BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.bns_club_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  club text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NULL,
  email text NULL,
  phone text NULL,
  hard_skills jsonb NOT NULL,
  soft_skills text[] NOT NULL,
  preferred_validation text NOT NULL,
  market_gap text NULL,
  beyond_connect_optin boolean NOT NULL DEFAULT false,
  preferred_contact_channel text NULL,
  user_agent text NULL,
  source text NULL,
  version text NOT NULL DEFAULT 'v1'
);

ALTER TABLE public.bns_club_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bns_club_survey_insert_public ON public.bns_club_survey_responses;
DROP POLICY IF EXISTS bns_club_survey_admin_all ON public.bns_club_survey_responses;
DROP POLICY IF EXISTS bns_club_survey_admin_read ON public.bns_club_survey_responses;

CREATE POLICY bns_club_survey_insert_public ON public.bns_club_survey_responses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY bns_club_survey_admin_all ON public.bns_club_survey_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.super_admins sa
      WHERE sa.user_id = auth.uid() AND sa.is_active = TRUE
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('admin','instructor')
    )
  );

COMMIT;

