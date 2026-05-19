-- Texte long affiché catalogue (complément à description courte)
alter table public.courses
  add column if not exists presentation text;

comment on column public.courses.presentation is 'Présentation marketing / pédagogique longue (catalogue, fiche formation).';
