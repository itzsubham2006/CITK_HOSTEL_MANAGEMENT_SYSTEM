-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM - SUPABASE INITIAL SCHEMA MIGRATION
-- ====================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'admin', 'warden');
CREATE TYPE complaint_status AS ENUM ('Pending', 'In Progress', 'Resolved');
CREATE TYPE complaint_category AS ENUM (
    'Electricity',
    'Water',
    'Cleanliness',
    'Food',
    'Furniture',
    'Internet',
    'Security',
    'Bathroom',
    'Other'
);
CREATE TYPE hostel_name AS ENUM (
    'SNM',
    'SJ',
    'JD',
    'BJ',
    'Bakhungri',
    'Gambari'
);

-- 2. PROFILES (Extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hostel hostel_name NOT NULL DEFAULT 'SJ',
    room_no TEXT NOT NULL DEFAULT 'N/A',
    role user_role NOT NULL DEFAULT 'student',
    profile_pic_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COMPLAINTS TABLE
CREATE TABLE public.complaints (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hostel hostel_name NOT NULL,
    category complaint_category NOT NULL,
    description TEXT NOT NULL,
    status complaint_status NOT NULL DEFAULT 'Pending',
    image_url TEXT,
    upvotes INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. COMPLAINT UPVOTES (Ensures 1 upvote per student per complaint)
CREATE TABLE public.complaint_upvotes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    complaint_id BIGINT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_complaint_upvote UNIQUE (user_id, complaint_id)
);

-- 5. ANNOUNCEMENTS
CREATE TABLE public.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    hostel hostel_name, -- NULL means all hostels
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. NOTIFICATIONS
CREATE TABLE public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. HOSTEL DIARIES (Community Feed)
CREATE TABLE public.hostel_diaries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. DIARY LIKES
CREATE TABLE public.diary_likes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    diary_id BIGINT NOT NULL REFERENCES public.hostel_diaries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_diary_like UNIQUE (user_id, diary_id)
);

-- 9. DIARY COMMENTS
CREATE TABLE public.diary_comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    diary_id BIGINT NOT NULL REFERENCES public.hostel_diaries(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. FEEDBACK
CREATE TABLE public.feedback (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    feedback TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. ANTI-RAGGING REPORTS
CREATE TABLE public.anti_ragging_reports (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    college TEXT NOT NULL,
    year TEXT NOT NULL,
    complaint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_hostel_room ON public.profiles(hostel, room_no);

CREATE INDEX idx_complaints_hostel_status ON public.complaints(hostel, status);
CREATE INDEX idx_complaints_upvotes ON public.complaints(upvotes DESC);
CREATE INDEX idx_complaints_user ON public.complaints(user_id);
CREATE INDEX idx_complaints_created ON public.complaints(created_at DESC);

CREATE INDEX idx_complaint_upvotes_complaint ON public.complaint_upvotes(complaint_id);
CREATE INDEX idx_complaint_upvotes_user ON public.complaint_upvotes(user_id);

CREATE INDEX idx_announcements_pinned_created ON public.announcements(is_pinned DESC, created_at DESC);
CREATE INDEX idx_announcements_hostel ON public.announcements(hostel);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

CREATE INDEX idx_hostel_diaries_created ON public.hostel_diaries(created_at DESC);
CREATE INDEX idx_hostel_diaries_user ON public.hostel_diaries(user_id);

CREATE INDEX idx_diary_likes_diary ON public.diary_likes(diary_id);
CREATE INDEX idx_diary_comments_diary ON public.diary_comments(diary_id);

-- ====================================================================
-- POSTGRES FUNCTIONS & TRIGGERS
-- ====================================================================

-- 1. Automatic Profile Creation on auth.users Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role user_role := 'student';
    parsed_hostel hostel_name := 'SJ';
BEGIN
    IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            default_role := (new.raw_user_meta_data->>'role')::user_role;
        EXCEPTION WHEN OTHERS THEN
            default_role := 'student';
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
        default_role,
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

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Sync Complaint Upvotes Count on Upvote / Un-upvote
CREATE OR REPLACE FUNCTION public.handle_complaint_upvote_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.complaints
        SET upvotes = (
            SELECT COUNT(*) FROM public.complaint_upvotes WHERE complaint_id = NEW.complaint_id
        )
        WHERE id = NEW.complaint_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.complaints
        SET upvotes = (
            SELECT COUNT(*) FROM public.complaint_upvotes WHERE complaint_id = OLD.complaint_id
        )
        WHERE id = OLD.complaint_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_complaint_upvote_added
    AFTER INSERT ON public.complaint_upvotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_upvote_change();

CREATE OR REPLACE TRIGGER on_complaint_upvote_removed
    AFTER DELETE ON public.complaint_upvotes
    FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_upvote_change();

-- 3. Automatically notify hostel students when announcement is published
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hostel IS NULL THEN
        -- Notify all students
        INSERT INTO public.notifications (user_id, message, link)
        SELECT id, '📢 Global Announcement: ' || NEW.title, '/announcements'
        FROM public.profiles;
    ELSE
        -- Notify students of that specific hostel
        INSERT INTO public.notifications (user_id, message, link)
        SELECT id, '📢 ' || NEW.hostel || ' Announcement: ' || NEW.title, '/announcements'
        FROM public.profiles
        WHERE hostel = NEW.hostel;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_announcement_created
    AFTER INSERT ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_announcement();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anti_ragging_reports ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins and Wardens can update any profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'warden'));

-- COMPLAINTS POLICIES
CREATE POLICY "Users can view complaints in their hostel or if admin/warden"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() IN ('admin', 'warden')
        OR hostel = (SELECT hostel FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Students can insert complaints"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Complaint owner or admin can update status and details"
    ON public.complaints FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'warden'))
    WITH CHECK (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'warden'));

CREATE POLICY "Complaint owner or admin can delete complaint"
    ON public.complaints FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'warden'));

-- COMPLAINT UPVOTES POLICIES
CREATE POLICY "Anyone can view upvotes"
    ON public.complaint_upvotes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can add upvote"
    ON public.complaint_upvotes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can remove their upvote"
    ON public.complaint_upvotes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Anyone authenticated can view announcements"
    ON public.announcements FOR SELECT
    TO authenticated
    USING (
        hostel IS NULL
        OR hostel = (SELECT hostel FROM public.profiles WHERE id = auth.uid())
        OR public.current_user_role() IN ('admin', 'warden')
    );

CREATE POLICY "Admins and wardens can insert announcements"
    ON public.announcements FOR INSERT
    TO authenticated
    WITH CHECK (public.current_user_role() IN ('admin', 'warden'));

CREATE POLICY "Admins and wardens can update announcements"
    ON public.announcements FOR UPDATE
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'warden'));

CREATE POLICY "Admins and wardens can delete announcements"
    ON public.announcements FOR DELETE
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'warden'));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- HOSTEL DIARIES POLICIES
CREATE POLICY "Anyone authenticated can view diaries"
    ON public.hostel_diaries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create diary entries"
    ON public.hostel_diaries FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Diary owners or admin can delete diary entries"
    ON public.hostel_diaries FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'warden'));

-- DIARY LIKES POLICIES
CREATE POLICY "Anyone can view diary likes"
    ON public.diary_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can toggle diary like"
    ON public.diary_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can remove their diary like"
    ON public.diary_likes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- DIARY COMMENTS POLICIES
CREATE POLICY "Anyone can view diary comments"
    ON public.diary_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create diary comments"
    ON public.diary_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment owners or admin can delete diary comments"
    ON public.diary_comments FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.current_user_role() IN ('admin', 'warden'));

-- FEEDBACK POLICIES
CREATE POLICY "Anyone can submit feedback"
    ON public.feedback FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins and wardens can view feedback"
    ON public.feedback FOR SELECT
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'warden'));

-- ANTI-RAGGING POLICIES
CREATE POLICY "Anyone can submit anti-ragging reports"
    ON public.anti_ragging_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Only admins and wardens can view anti-ragging reports"
    ON public.anti_ragging_reports FOR SELECT
    TO authenticated
    USING (public.current_user_role() IN ('admin', 'warden'));
