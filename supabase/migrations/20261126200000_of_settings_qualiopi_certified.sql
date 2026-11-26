-- Flag OF : certification Qualiopi obtenue (front public masque OPCO tant que faux).
alter table public.of_settings
  add column if not exists qualiopi_certified boolean not null default false;

comment on column public.of_settings.qualiopi_certified is
  'true = afficher les modalités de financement réelles (OPCO compris) sur le front public ; false = phrase « Qualiopi en cours ».';
