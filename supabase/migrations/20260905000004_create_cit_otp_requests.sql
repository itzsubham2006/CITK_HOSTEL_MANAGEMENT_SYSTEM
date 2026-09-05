-- ====================================================================
-- CITK HOSTEL ISSUE MANAGEMENT SYSTEM
-- MIGRATION: Replace otp_verifications with cit_otp_requests
-- ====================================================================

-- 1. Create cit_otp_requests table
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

-- 2. Create index on (user_id, email)
CREATE INDEX IF NOT EXISTS idx_cit_otp_user_email 
ON public.cit_otp_requests USING btree (user_id, email) TABLESPACE pg_default;

-- 3. Create index for fast lookup by email and requested_at
CREATE INDEX IF NOT EXISTS idx_cit_otp_email_requested 
ON public.cit_otp_requests USING btree (email, requested_at DESC) TABLESPACE pg_default;

-- 4. Enable Row Level Security (Service-role only access)
ALTER TABLE public.cit_otp_requests ENABLE ROW LEVEL SECURITY;

-- 5. Drop deprecated table if present
DROP TABLE IF EXISTS public.otp_verifications;
