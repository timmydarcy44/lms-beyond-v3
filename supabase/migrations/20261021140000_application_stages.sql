-- Étape, lecture, source et date d'entretien des candidatures entreprise.
-- À coller dans Supabase. Sans cette migration, l'écran déduit l'étape depuis applications.status.

alter table public.applications
  add column if not exists stage text,
  add column if not exists read_at timestamptz,
  add column if not exists source text,
  add column if not exists interview_at timestamptz;

update public.applications
set stage = case
  when lower(coalesce(status, '')) in ('rejected', 'refused', 'declined', 'refus') then 'rejected'
  when lower(coalesce(status, '')) in ('interview', 'entretien', 'interviewing') then 'interview'
  when lower(coalesce(status, '')) in ('retained', 'retenu', 'retenue', 'accepted', 'hired') then 'retained'
  else 'new'
end
where stage is null;

alter table public.applications drop constraint if exists applications_stage_check;
alter table public.applications
  add constraint applications_stage_check
  check (stage is null or stage in ('new', 'interview', 'retained', 'rejected'));
