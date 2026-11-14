-- Qualiopi Lot 1 (RNQ V10) — fiches formation ind. 1 & 2
-- Additive only.

alter table public.training_courses
  add column if not exists recognition_type text
    check (
      recognition_type is null
      or recognition_type in (
        'attestation_fin',
        'certificat_realisation',
        'open_badge',
        'aucune_certification_pro'
      )
    ),
  add column if not exists recognition_detail text,
  add column if not exists pedagogical_modality text
    check (
      pedagogical_modality is null
      or pedagogical_modality in (
        'presentiel',
        'distanciel_synchrone',
        'elearning_asynchrone',
        'mixte'
      )
    ),
  add column if not exists pedagogical_modality_detail text,
  add column if not exists financing_modalities text,
  add column if not exists price_on_quote boolean not null default false,
  add column if not exists results_method_override text;

comment on column public.training_courses.recognition_type is
  'Qualiopi ind.1 — type de reconnaissance de la formation.';
comment on column public.training_courses.pedagogical_modality is
  'Qualiopi ind.1 — modalité pédagogique structurée.';
comment on column public.training_courses.financing_modalities is
  'Qualiopi ind.1 — modalités de financement (texte libre).';
comment on column public.training_courses.price_on_quote is
  'Qualiopi ind.1 — si true, afficher « Sur devis » plutôt que les montants.';
comment on column public.training_courses.results_method_override is
  'Qualiopi ind.2 — surcharge de la méthode de calcul des indicateurs (sinon of_settings).';

alter table public.of_settings
  add column if not exists results_indicators_method text;

comment on column public.of_settings.results_indicators_method is
  'Qualiopi ind.2 — méthode de calcul globale des indicateurs de résultats (formule, période, répondants).';
