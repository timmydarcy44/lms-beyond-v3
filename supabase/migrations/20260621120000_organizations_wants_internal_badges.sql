-- Open Badges internes : seules les orgs avec wants_internal_badges = true
-- apparaissent dans le sélecteur « Club / Organisation » (admin super).

alter table public.organizations
  add column if not exists wants_internal_badges boolean not null default false;

comment on column public.organizations.wants_internal_badges is
  'Si true, l''organisation apparaît dans le dropdown Club/Organisation (création Open Badge super-admin).';

-- EDGE Lab uniquement (pas les prospects CRM « EDGE » sans slug edgelab).
update public.organizations
set wants_internal_badges = true
where lower(trim(coalesce(slug, ''))) in ('edgelab', 'edge-lab', 'edge_lab')
   or lower(trim(coalesce(name, ''))) = 'edge lab';
