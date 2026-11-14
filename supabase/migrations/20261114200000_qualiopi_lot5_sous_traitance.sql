-- Qualiopi Lot 5 (RNQ V10) — sous-traitance pédagogique (ind. 27)
-- Additive only. Pas de modification CFA.

alter table public.experts
  add column if not exists employment_status text
    check (
      employment_status is null
      or employment_status in ('salarie', 'independant', 'portage')
    ),
  add column if not exists subcontract_signed_at date,
  add column if not exists subcontract_ends_at date,
  add column if not exists quality_commitment_at timestamptz;

comment on column public.experts.employment_status is
  'Qualiopi ind.27 — salarié | indépendant sous-traitant | portage salarial.';
comment on column public.experts.subcontract_signed_at is
  'Date de signature du contrat de sous-traitance (indépendant / portage).';
comment on column public.experts.subcontract_ends_at is
  'Date de fin du contrat de sous-traitance (null = sans échéance).';
comment on column public.experts.quality_commitment_at is
  'Engagement de respect du référentiel qualité (case + date).';

create index if not exists experts_employment_status_idx
  on public.experts (employment_status)
  where employment_status is not null;
