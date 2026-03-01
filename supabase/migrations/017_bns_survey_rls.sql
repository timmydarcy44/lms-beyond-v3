BEGIN;

ALTER TABLE public.bns_club_survey_responses
  ADD COLUMN IF NOT EXISTS website text;

ALTER TABLE public.bns_club_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bns_survey_insert_public ON public.bns_club_survey_responses;
DROP POLICY IF EXISTS bns_survey_select_admin ON public.bns_club_survey_responses;
DROP POLICY IF EXISTS bns_survey_update_admin ON public.bns_club_survey_responses;
DROP POLICY IF EXISTS bns_survey_delete_admin ON public.bns_club_survey_responses;

CREATE POLICY bns_survey_insert_public
ON public.bns_club_survey_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (
  coalesce(trim(first_name), '') <> ''
  AND coalesce(trim(last_name), '') <> ''
  AND coalesce(trim(club), '') <> ''
  AND (website IS NULL OR trim(website) = '')
);

CREATE POLICY bns_survey_select_admin
ON public.bns_club_survey_responses
FOR SELECT
USING (
  public.user_has_role(auth.uid(), array['super_admin','admin'])
  OR EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid() AND sa.is_active = true
  )
);

CREATE POLICY bns_survey_update_admin
ON public.bns_club_survey_responses
FOR UPDATE
USING (
  public.user_has_role(auth.uid(), array['super_admin','admin'])
  OR EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid() AND sa.is_active = true
  )
)
WITH CHECK (
  public.user_has_role(auth.uid(), array['super_admin','admin'])
  OR EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid() AND sa.is_active = true
  )
);

CREATE POLICY bns_survey_delete_admin
ON public.bns_club_survey_responses
FOR DELETE
USING (
  public.user_has_role(auth.uid(), array['super_admin','admin'])
  OR EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid() AND sa.is_active = true
  )
);

COMMIT;

