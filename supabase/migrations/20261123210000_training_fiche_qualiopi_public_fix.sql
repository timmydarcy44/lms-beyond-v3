-- Qualiopi ind.1 : contact / handicap / dépublication + alignement modalitésités.

alter table public.training_courses
  add column if not exists handicap_referent text;

comment on column public.training_courses.handicap_referent is
  'Surcharge du référent handicap public (sinon constante site)';

-- Dépublier « Accompagnement individuel ciblé » (données conservées).
update public.training_courses
set
  is_active = false,
  updated_at = now()
where slug = 'accompagnement-individuel-cible'
  and is_active is distinct from false;

-- Contact référent par défaut sur les fiches catalogue publiques encore vides.
update public.training_courses
set
  contact_referent = 'Jessica Contentin — jessica.contentin@byound.fr',
  updated_at = now()
where organization_id is null
  and (source is null or source = 'catalogue')
  and coalesce(trim(contact_referent), '') = '';

-- Alignement modalités : formats Présentiel+Distanciel+Blended → mixte + détail explicite.
update public.training_courses
set
  pedagogical_modality = 'mixte',
  pedagogical_modality_detail =
    'Formation dispensée en présentiel, en distanciel synchrone (visio) ou en format blended (mixte), selon le besoin. '
    || coalesce(nullif(trim(pedagogical_modality_detail), ''), 'Alternance d’apports théoriques et de mises en situation. Ateliers en sous-groupes, études de cas métier, feedbacks individualisés. Supports remis sur le LMS ; évaluations formatives tout au long du parcours.'),
  updated_at = now()
where organization_id is null
  and (source is null or source = 'catalogue')
  and is_active = true
  and formats @> array['Présentiel','Distanciel','Blended']::text[]
  and (
    pedagogical_modality is distinct from 'mixte'
    or coalesce(pedagogical_modality_detail, '') not ilike '%présentiel%'
    or coalesce(pedagogical_modality_detail, '') not ilike '%distanciel%'
    or (
      coalesce(pedagogical_modality_detail, '') not ilike '%blended%'
      and coalesce(pedagogical_modality_detail, '') not ilike '%mixte%'
    )
  );

-- Présentiel + Distanciel (sans Blended).
update public.training_courses
set
  pedagogical_modality = 'mixte',
  pedagogical_modality_detail =
    'Formation dispensée en présentiel ou en distanciel synchrone (visio), selon le besoin. '
    || coalesce(nullif(trim(pedagogical_modality_detail), ''), 'Alternance d’apports théoriques et de mises en situation. Ateliers en sous-groupes, études de cas métier, feedbacks individualisés. Supports remis sur le LMS ; évaluations formatives tout au long du parcours.'),
  updated_at = now()
where organization_id is null
  and (source is null or source = 'catalogue')
  and is_active = true
  and formats @> array['Présentiel','Distanciel']::text[]
  and not (formats @> array['Blended']::text[])
  and (
    coalesce(pedagogical_modality_detail, '') not ilike '%présentiel%'
    or coalesce(pedagogical_modality_detail, '') not ilike '%distanciel%'
  );

-- Présentiel + Blended (sans Distanciel explicite).
update public.training_courses
set
  pedagogical_modality = 'mixte',
  pedagogical_modality_detail =
    'Formation dispensée en présentiel ou en format blended (mixte), selon le besoin. '
    || coalesce(nullif(trim(pedagogical_modality_detail), ''), 'Alternance d’apports théoriques et de mises en situation. Ateliers en sous-groupes, études de cas métier, feedbacks individualisés. Supports remis sur le LMS ; évaluations formatives tout au long du parcours.'),
  updated_at = now()
where organization_id is null
  and (source is null or source = 'catalogue')
  and is_active = true
  and formats @> array['Présentiel','Blended']::text[]
  and not (formats @> array['Distanciel']::text[])
  and (
    coalesce(pedagogical_modality_detail, '') not ilike '%présentiel%'
    or (
      coalesce(pedagogical_modality_detail, '') not ilike '%blended%'
      and coalesce(pedagogical_modality_detail, '') not ilike '%mixte%'
    )
  );

-- Toucher updated_at des fiches actives catalogue pour afficher « 23 novembre 2026 »
-- sur cette livraison (après les updates ciblés ci-dessus).
update public.training_courses
set updated_at = timestamptz '2026-11-23 12:00:00+01'
where organization_id is null
  and (source is null or source = 'catalogue')
  and is_active = true;
