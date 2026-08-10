-- Offre EDGE entreprise (Skills / Learning / Learning+) pour gating produit.
alter table public.organizations
  add column if not exists edge_offer text;

alter table public.organizations
  drop constraint if exists organizations_edge_offer_check;

alter table public.organizations
  add constraint organizations_edge_offer_check
  check (
    edge_offer is null
    or edge_offer in ('skills', 'learning', 'learning-plus')
  );

comment on column public.organizations.edge_offer is
  'Offre commerciale EDGE: skills | learning | learning-plus. Learning+ débloque la bibliothèque formations salariés.';
