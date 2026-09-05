-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- MIGRATION: OTP Verifications, Role Allowlists, and Seed Admin
-- ====================================================================

-- 1. CIT OTP REQUESTS TABLE (Service-Role Only)
CREATE TABLE IF NOT EXISTS public.cit_otp_requests (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    user_id uuid NULL,
    email text NOT NULL,
    otp_hash text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    requested_at timestamp with time zone NOT NULL DEFAULT now(),
    verified_at timestamp with time zone NULL,
    CONSTRAINT cit_otp_requests_pkey PRIMARY KEY (id),
    CONSTRAINT cit_otp_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cit_otp_user_email 
ON public.cit_otp_requests USING btree (user_id, email) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cit_otp_email_requested 
ON public.cit_otp_requests USING btree (email, requested_at DESC) TABLESPACE pg_default;

ALTER TABLE public.cit_otp_requests ENABLE ROW LEVEL SECURITY;
-- By default with RLS enabled and NO policies granted to anon or authenticated,
-- this table is accessible ONLY via the Supabase Service Role key on the server.


-- 2. ADMIN EMAILS ALLOWLIST TABLE
CREATE TABLE IF NOT EXISTS public.admin_emails (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin emails"
    ON public.admin_emails FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert admin emails"
    ON public.admin_emails FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete admin emails"
    ON public.admin_emails FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- 3. WARDEN EMAILS ALLOWLIST TABLE
CREATE TABLE IF NOT EXISTS public.warden_emails (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.warden_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view warden emails"
    ON public.warden_emails FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert warden emails"
    ON public.warden_emails FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete warden emails"
    ON public.warden_emails FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );


-- 4. UPDATE PROFILES RLS: Users can only read their own profile row, or admins/wardens view all
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile row or admin/warden view all" ON public.profiles;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
DECLARE
    u_role user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(u_role, 'student'::user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_or_warden()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_user_role() IN ('admin', 'warden');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "Users can read own profile row or admin/warden view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_admin_or_warden()
    );


-- 5. UPDATE USER CREATION TRIGGER: Assign role dynamically based on allowlists & @cit.ac.in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    computed_role user_role := 'student';
    parsed_hostel hostel_name := 'SJ';
    clean_email TEXT := lower(trim(new.email));
BEGIN
    -- Check role hierarchy:
    -- a. If email in admin_emails -> admin
    -- b. Else if email in warden_emails -> warden
    -- c. Else if email ends with @cit.ac.in -> student
    -- d. Fallback to user metadata role if valid
    IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = clean_email) THEN
        computed_role := 'admin';
    ELSIF EXISTS (SELECT 1 FROM public.warden_emails WHERE lower(email) = clean_email) THEN
        computed_role := 'warden';
    ELSIF clean_email LIKE '%@cit.ac.in' THEN
        computed_role := 'student';
    ELSIF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            computed_role := (new.raw_user_meta_data->>'role')::user_role;
        EXCEPTION WHEN OTHERS THEN
            computed_role := 'student';
        END;
    END IF;

    IF new.raw_user_meta_data->>'hostel' IS NOT NULL THEN
        BEGIN
            parsed_hostel := (new.raw_user_meta_data->>'hostel')::hostel_name;
        EXCEPTION WHEN OTHERS THEN
            parsed_hostel := 'SJ';
        END;
    END IF;

    INSERT INTO public.profiles (
        id,
        username,
        email,
        hostel,
        room_no,
        role,
        profile_pic_url
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        new.email,
        parsed_hostel,
        COALESCE(new.raw_user_meta_data->>'room_no', 'N/A'),
        computed_role,
        new.raw_user_meta_data->>'profile_pic_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        hostel = EXCLUDED.hostel,
        room_no = EXCLUDED.room_no,
        role = EXCLUDED.role,
        profile_pic_url = COALESCE(EXCLUDED.profile_pic_url, public.profiles.profile_pic_url),
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. SEED INITIAL ADMIN (Pre-approved before signup)
INSERT INTO public.admin_emails (email)
VALUES ('lastw5232@gmail.com')
ON CONFLICT (email) DO NOTHING;
