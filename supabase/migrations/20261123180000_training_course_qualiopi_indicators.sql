-- Qualiopi fiche formation : contact référent + indicateurs qualité structurés
alter table public.training_courses
  add column if not exists contact_referent text;

alter table public.training_courses
  add column if not exists quality_indicators jsonb;

comment on column public.training_courses.contact_referent is
  'Contact référent affiché sur la fiche (ex. Jessica Contentin — jessica.contentin@byound.fr)';
comment on column public.training_courses.quality_indicators is
  'Indicateurs qualité par clé : { value, period, respondents } — null = non publié';

-- Référence Qualiopi : Communiquer avec impact
update public.training_courses
set
  formats = array['Présentiel et/ou distanciel asynchrone sur le LMS Byound'],
  pedagogical_modality = 'mixte',
  pedagogical_modality_detail =
    'Présentiel et/ou distanciel asynchrone sur le LMS Byound : parcours neuroadapté, quiz, entretiens expérientiels et jeux interactifs de mise en situation. Plan de progression individuel en fin de formation et re-test à deux mois.',
  methodology = array[
    'Apports courts',
    'Mises en situation',
    'Jeux de rôle',
    'Feedback entre pairs',
    'Co-développement',
    'Coaching',
    'Études de cas',
    'Supports numériques',
    'Plan de progression',
    'Re-test à deux mois',
    'LMS Byound',
    'Parcours neuroadapté',
    'Entretiens expérientiels',
    'Jeux interactifs'
  ],
  contact_referent = 'Jessica Contentin — jessica.contentin@byound.fr',
  recognition_type = coalesce(nullif(trim(recognition_type), ''), 'open_badge'),
  quality_indicators = coalesce(
    quality_indicators,
    '{
      "satisfaction": {"value": null, "period": null, "respondents": null},
      "success": {"value": null, "period": null, "respondents": null},
      "dropout": {"value": null, "period": null, "respondents": null},
      "recommendation": {"value": null, "period": null, "respondents": null},
      "completion": {"value": null, "period": null, "respondents": null}
    }'::jsonb
  ),
  updated_at = timestamptz '2026-11-23 12:00:00+01'
where slug = 'communiquer-avec-impact';
