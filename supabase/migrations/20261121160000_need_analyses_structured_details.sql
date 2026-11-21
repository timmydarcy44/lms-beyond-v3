-- Détails structurés pour la récolte de besoins (lieu, durée, budget…).
alter table public.organization_need_analyses
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.organization_need_analyses.details is
  'Champs structurés : lieu, mode, durée, dates, budget, financement, effectif, postes, niveau, expérience.';
