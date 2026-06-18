-- Praticiens visibles dans l'espace salarié (Mes coachings) — admin via praticiens_bct

alter table public.praticiens_bct
  add column if not exists visible_salarie_coaching boolean not null default false;

comment on column public.praticiens_bct.visible_salarie_coaching is
  'Affiché dans /dashboard/salarie/coachings (lecture authentifiée)';

drop policy if exists praticiens_bct_salarie_read on public.praticiens_bct;
create policy praticiens_bct_salarie_read on public.praticiens_bct
  for select to authenticated
  using (status = 'active' and visible_salarie_coaching = true);

insert into public.praticiens_bct (
  id,
  prenom,
  nom,
  photo_url,
  titre,
  biographie,
  specialites,
  tarif_session,
  duree_session,
  status,
  visible_marketplace,
  visible_salarie_coaching,
  bct_certified
) values
  (
    'c1a2b3c4-d5e6-4f78-9abc-def012345601',
    'Jessica',
    'Contentin',
    '/jessica-contentin/jessica-portrait.jpg',
    'Psychopédagogue — neuroéducation',
    'Psychopédagogue certifiée, spécialisée en gestion des émotions et accompagnement TND.',
    array['Gestion des émotions', 'TDA-H', 'Confiance en soi', 'Phobie scolaire'],
    8000,
    60,
    'active',
    true,
    true,
    true
  ),
  (
    'c1a2b3c4-d5e6-4f78-9abc-def012345602',
    'Timmy',
    'Darcy',
    null,
    'Coach professionnel — performance',
    'Coach certifié EDGE, accompagnement des parcours professionnels et montée en compétences.',
    array['Leadership', 'Communication', 'Orientation carrière', 'Soft skills'],
    8000,
    60,
    'active',
    true,
    true,
    true
  ),
  (
    'c1a2b3c4-d5e6-4f78-9abc-def012345603',
    'Jérôme',
    'Picot',
    null,
    'Consultant management & transformation',
    'Expert management et conduite du changement pour managers et collaborateurs.',
    array['Management', 'Conflits', 'Performance d''équipe', 'Pilotage'],
    8000,
    60,
    'active',
    true,
    true,
    true
  )
on conflict (id) do update set
  prenom = excluded.prenom,
  nom = excluded.nom,
  photo_url = excluded.photo_url,
  titre = excluded.titre,
  biographie = excluded.biographie,
  specialites = excluded.specialites,
  status = excluded.status,
  visible_marketplace = excluded.visible_marketplace,
  visible_salarie_coaching = excluded.visible_salarie_coaching,
  bct_certified = excluded.bct_certified,
  updated_at = now();
