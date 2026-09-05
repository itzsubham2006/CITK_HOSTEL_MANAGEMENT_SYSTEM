-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- FIX: Infinite Recursion in RLS policies for profiles & complaints
-- ====================================================================

-- 1. Create plpgsql helper functions with SECURITY DEFINER and search_path = public
-- (Using plpgsql ensures PostgreSQL does not inline the function, which bypasses RLS cleanly)

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

CREATE OR REPLACE FUNCTION public.current_user_hostel()
RETURNS hostel_name AS $$
DECLARE
    u_hostel hostel_name;
BEGIN
    SELECT hostel INTO u_hostel FROM public.profiles WHERE id = auth.uid();
    RETURN u_hostel;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- 2. Drop the recursive policy on profiles
DROP POLICY IF EXISTS "Users can read own profile row or admin/warden view all" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

-- 3. Re-create non-recursive SELECT policy on profiles
CREATE POLICY "Users can read own profile row or admin/warden view all"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id
        OR public.is_admin_or_warden()
    );


-- 4. Re-create non-recursive SELECT policy on complaints
DROP POLICY IF EXISTS "Users can view complaints in their hostel or if admin/warden" ON public.complaints;

CREATE POLICY "Users can view complaints in their hostel or if admin/warden"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_warden()
        OR hostel = public.current_user_hostel()
    );
