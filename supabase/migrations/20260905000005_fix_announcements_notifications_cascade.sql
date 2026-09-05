-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- MIGRATION: OTP Table Fix + Announcement Notification Dynamic Cascade
-- ====================================================================

-- 1. DROP EXISTING otp_verifications AND ENSURE cit_otp_requests EXISTS
DROP TABLE IF EXISTS public.otp_verifications CASCADE;

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


-- 2. LINK NOTIFICATIONS TO ANNOUNCEMENTS (ON DELETE CASCADE)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS announcement_id BIGINT REFERENCES public.announcements(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_announcement_id 
ON public.notifications(announcement_id);


-- 3. UPDATE ANNOUNCEMENT CREATION TRIGGER TO SAVE announcement_id
CREATE OR REPLACE FUNCTION public.handle_new_announcement()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hostel IS NULL THEN
        -- Notify all students
        INSERT INTO public.notifications (user_id, message, link, announcement_id)
        SELECT id, '📢 Global Announcement: ' || NEW.title, '/announcements', NEW.id
        FROM public.profiles;
    ELSE
        -- Notify students of that specific hostel
        INSERT INTO public.notifications (user_id, message, link, announcement_id)
        SELECT id, '📢 ' || NEW.hostel || ' Announcement: ' || NEW.title, '/announcements', NEW.id
        FROM public.profiles
        WHERE hostel = NEW.hostel;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. CREATE DELETION TRIGGER ON ANNOUNCEMENTS TO CASCADE REMOVAL OF NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.handle_delete_announcement()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all notifications linked by announcement_id or by legacy title match
    DELETE FROM public.notifications 
    WHERE announcement_id = OLD.id
       OR (
           link = '/announcements' 
           AND (message LIKE '%' || OLD.title || '%' OR message LIKE '📢%' || OLD.title || '%')
       );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_announcement_deleted ON public.announcements;
CREATE TRIGGER on_announcement_deleted
    BEFORE DELETE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.handle_delete_announcement();


-- 5. CLEAN UP EXISTING ORPHANED ANNOUNCEMENT NOTIFICATIONS RIGHT NOW
DELETE FROM public.notifications n
WHERE n.link = '/announcements'
  AND (
    n.announcement_id IS NULL 
    OR NOT EXISTS (SELECT 1 FROM public.announcements a WHERE a.id = n.announcement_id)
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE n.message LIKE '%' || a.title || '%'
  );


-- 6. ENABLE SUPABASE REALTIME REPLICATION FOR NOTIFICATIONS & ANNOUNCEMENTS
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
