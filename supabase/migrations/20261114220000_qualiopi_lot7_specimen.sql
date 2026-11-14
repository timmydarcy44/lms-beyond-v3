-- Qualiopi Lot 7 (RNQ V10) — dossier spécimen / parcours de démonstration
-- Additive only. Pas de modification CFA.

alter table public.formation_dossiers
  add column if not exists is_specimen boolean not null default false;

create index if not exists formation_dossiers_specimen_idx
  on public.formation_dossiers (is_specimen)
  where is_specimen = true;

comment on column public.formation_dossiers.is_specimen is
  'Qualiopi Lot 7 — dossier de démonstration : bandeau SPÉCIMEN, filigrane docs, exclu des indicateurs de résultats / BPF / score Qualiopi.';
