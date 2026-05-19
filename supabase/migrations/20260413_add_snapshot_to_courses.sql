-- Adds builder_snapshot to courses if missing.
-- Run this in Supabase SQL editor if you see:
-- "Could not find the 'builder_snapshot' column of 'courses'".

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS builder_snapshot jsonb DEFAULT '{}'::jsonb;

