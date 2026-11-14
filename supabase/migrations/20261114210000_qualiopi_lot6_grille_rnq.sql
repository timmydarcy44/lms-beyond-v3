-- Qualiopi Lot 6 (RNQ V10) — grille 33 indicateurs + N/A justifiés
-- Additive only. Pas de modification CFA.

-- ---------------------------------------------------------------------------
-- Attestations : 1–33 + kind (preuve vs N/A)
-- ---------------------------------------------------------------------------
alter table public.crm_qualiopi_indicator_attestations
  drop constraint if exists crm_qualiopi_indicator_attestations_indicator_id_check;

alter table public.crm_qualiopi_indicator_attestations
  add constraint crm_qualiopi_indicator_attestations_indicator_id_check
  check (indicator_id >= 1 and indicator_id <= 33);

alter table public.crm_qualiopi_indicator_attestations
  add column if not exists kind text not null default 'evidence';

alter table public.crm_qualiopi_indicator_attestations
  drop constraint if exists crm_qualiopi_indicator_attestations_kind_check;

alter table public.crm_qualiopi_indicator_attestations
  add constraint crm_qualiopi_indicator_attestations_kind_check
  check (kind in ('evidence', 'na'));

comment on column public.crm_qualiopi_indicator_attestations.kind is
  'evidence = preuve manuelle validante ; na = justification N/A OF B2B (exportable).';

comment on table public.crm_qualiopi_indicator_attestations is
  'Qualiopi Lot 6 — attestations manuelles (1–33) et justifications N/A.';
