-- Plan d'accompagnement rédigé + flux de consentement par e-mail
alter table public.disability_cases
  add column if not exists accompaniment_plan_html text,
  add column if not exists consent_token text,
  add column if not exists consent_requested_at timestamptz;

create unique index if not exists disability_cases_consent_token_uidx
  on public.disability_cases (consent_token)
  where consent_token is not null;
