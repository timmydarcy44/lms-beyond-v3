-- Le titulaire peut demander à ce que sa page publique ne soit pas indexée.
-- La colonne n'est pas dans la liste verrouillée du trigger : seul indexable change.

begin;

alter table public.badge_assertions
  add column if not exists indexable boolean not null default true;

comment on column public.badge_assertions.indexable is
  'false : la page /badges/{id} porte noindex.';

commit;
