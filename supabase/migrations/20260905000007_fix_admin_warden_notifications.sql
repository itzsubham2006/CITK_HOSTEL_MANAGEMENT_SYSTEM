-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- MIGRATION: Ensure Admins, Wardens, and Students Receive Notifications
-- ====================================================================

-- 0. ENSURE announcement_id COLUMN EXISTS WITH CASCADE DELETE
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS announcement_id BIGINT REFERENCES public.announcements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_announcement_id 
ON public.notifications(announcement_id);

-- Ensure RLS allows triggers and authenticated operations to insert notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for notifications" ON public.notifications;
CREATE POLICY "Enable insert for notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 1. UPDATE ANNOUNCEMENT NOTIFICATION TRIGGER
-- Global announcements: notify ALL users (students, wardens, admins)
-- Hostel announcements: notify hostel students AND ALL wardens & admins
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hostel IS NULL THEN
        INSERT INTO public.notifications (user_id, message, link, announcement_id)
        SELECT id, '📢 Global Announcement: ' || NEW.title, '/announcements', NEW.id
        FROM public.profiles;
    ELSE
        INSERT INTO public.notifications (user_id, message, link, announcement_id)
        SELECT id, '📢 ' || NEW.hostel || ' Announcement: ' || NEW.title, '/announcements', NEW.id
        FROM public.profiles
        WHERE hostel = NEW.hostel OR role IN ('admin', 'warden');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;
CREATE TRIGGER on_announcement_created
    AFTER INSERT ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_announcement();


-- 2. NOTIFY ADMINS & WARDENS WHEN A NEW ISSUE IS REPORTED
CREATE OR REPLACE FUNCTION public.handle_new_complaint()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, message, link)
    SELECT id, '🚨 New Issue in ' || NEW.hostel || ' (' || NEW.category || '): ' || SUBSTRING(NEW.description FROM 1 FOR 50), '/issues/' || NEW.id
    FROM public.profiles
    WHERE role = 'admin' OR (role = 'warden' AND (hostel = NEW.hostel OR hostel IS NULL));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_complaint_created ON public.complaints;
CREATE TRIGGER on_complaint_created
    AFTER INSERT ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_complaint();


-- 3. NOTIFY STUDENT WHEN AN ISSUE STATUS IS UPDATED (e.g. In Progress, Resolved)
CREATE OR REPLACE FUNCTION public.handle_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.notifications (user_id, message, link)
        VALUES (
            NEW.user_id, 
            '✅ Issue (' || NEW.category || ' - ' || NEW.hostel || ') status updated to ' || NEW.status, 
            '/issues/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_complaint_status_updated ON public.complaints;
CREATE TRIGGER on_complaint_status_updated
    AFTER UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.handle_complaint_status_change();


-- 4. ENSURE SUPABASE REALTIME REPLICATES NOTIFICATIONS & ANNOUNCEMENTS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
    END IF;
END $$;


-- 5. BACKFILL NOTIFICATIONS FOR EXISTING ACTIVE ANNOUNCEMENTS
-- Populates missing announcement notifications for admins, wardens, and students right now
INSERT INTO public.notifications (user_id, message, link, announcement_id)
SELECT 
  p.id AS user_id,
  CASE 
    WHEN a.hostel IS NULL THEN '📢 Global Announcement: ' || a.title
    ELSE '📢 ' || a.hostel || ' Announcement: ' || a.title
  END AS message,
  '/announcements' AS link,
  a.id AS announcement_id
FROM public.announcements a
CROSS JOIN public.profiles p
WHERE (a.hostel IS NULL OR p.hostel = a.hostel OR p.role IN ('admin', 'warden'))
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = p.id 
      AND (n.announcement_id = a.id OR n.message LIKE '%' || a.title || '%')
  );
