-- Niveau pédagogique affiché catalogue / métadonnées (aligné sur snapshot.general.level)

alter table public.courses
  add column if not exists level text;

comment on column public.courses.level is 'Niveau cible : Débutant, Acquisition, Intermédiaire, Spécialiste, Expert.';
