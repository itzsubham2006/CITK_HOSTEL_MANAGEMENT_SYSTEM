-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- FIX: "Database error creating new user" & Support "None" for Hostel/Room
-- ====================================================================

-- 1. Allow NULL for hostel in profiles (for admins, wardens, day-scholars, or None)
ALTER TABLE public.profiles ALTER COLUMN hostel DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN room_no DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN room_no SET DEFAULT 'None';

-- 2. Drop existing triggers and functions to replace with robust version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    computed_role public.user_role := 'student'::public.user_role;
    parsed_hostel public.hostel_name := NULL;
    raw_hostel TEXT;
    raw_room TEXT;
    final_username TEXT;
    clean_email TEXT := lower(trim(new.email));
BEGIN
    -- Step A: Determine user role with safe priority
    IF EXISTS (SELECT 1 FROM public.admin_emails WHERE lower(email) = clean_email) THEN
        computed_role := 'admin'::public.user_role;
    ELSIF EXISTS (SELECT 1 FROM public.warden_emails WHERE lower(email) = clean_email) THEN
        computed_role := 'warden'::public.user_role;
    ELSIF clean_email LIKE '%@cit.ac.in' THEN
        computed_role := 'student'::public.user_role;
    ELSIF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            computed_role := (new.raw_user_meta_data->>'role')::public.user_role;
        EXCEPTION WHEN OTHERS THEN
            computed_role := 'student'::public.user_role;
        END;
    END IF;

    -- Step B: Parse Hostel (handle 'None', null, or empty string gracefully)
    raw_hostel := trim(COALESCE(new.raw_user_meta_data->>'hostel', ''));
    IF raw_hostel <> '' AND lower(raw_hostel) <> 'none' THEN
        BEGIN
            parsed_hostel := raw_hostel::public.hostel_name;
        EXCEPTION WHEN OTHERS THEN
            parsed_hostel := NULL;
        END;
    ELSE
        parsed_hostel := NULL;
    END IF;

    -- Step C: Parse Room No
    raw_room := trim(COALESCE(new.raw_user_meta_data->>'room_no', 'None'));
    IF raw_room = '' THEN
        raw_room := 'None';
    END IF;

    -- Step D: Ensure username is unique to avoid duplicate key errors
    final_username := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1));
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username AND id <> new.id) THEN
        final_username := final_username || '_' || floor(random() * 9000 + 1000)::text;
    END IF;

    -- Step E: Insert or update profiles
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
        final_username,
        new.email,
        parsed_hostel,
        raw_room,
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
EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback: never fail auth.users insertion due to a profile trigger glitch
    BEGIN
        INSERT INTO public.profiles (id, username, email, role, room_no)
        VALUES (
            new.id,
            split_part(new.email, '@', 1) || '_' || floor(random() * 9000 + 1000)::text,
            new.email,
            computed_role,
            'None'
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-attach trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
