alter table public.experts
  add column if not exists show_on_homepage boolean not null default false,
  add column if not exists homepage_order integer;

comment on column public.experts.show_on_homepage is
  'Affiche l''expert sur la page d''accueil Byound, après accord, et seulement avec une photo.';
