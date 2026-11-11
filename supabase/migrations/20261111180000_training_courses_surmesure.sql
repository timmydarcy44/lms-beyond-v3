-- Formations / programmes co-construits avec un client (Sur-mesure)
-- Stockés dans training_courses pour rester branchables sur les dossiers Qualiopi.

alter table public.training_courses
  add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

alter table public.training_courses
  add column if not exists source text not null default 'catalogue';

alter table public.training_courses
  add column if not exists specific_needs text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'training_courses_source_check'
  ) then
    alter table public.training_courses
      add constraint training_courses_source_check
      check (source in ('catalogue', 'surmesure'));
  end if;
end $$;

create index if not exists training_courses_organization_id_idx
  on public.training_courses (organization_id)
  where organization_id is not null;

create index if not exists training_courses_source_idx
  on public.training_courses (source);

-- Le catalogue public ne doit jamais exposer les fiches client.
drop policy if exists "Public can read active training courses" on public.training_courses;
create policy "Public can read active training courses"
  on public.training_courses
  for select
  using (
    is_active = true
    and organization_id is null
    and coalesce(source, 'catalogue') = 'catalogue'
  );

comment on column public.training_courses.organization_id is
  'Si renseigné : formation/programme co-construit pour ce compte client (Sur-mesure).';
comment on column public.training_courses.source is
  'catalogue = offre publique ; surmesure = co-construction client.';
comment on column public.training_courses.specific_needs is
  'Besoins spécifiques / adaptations (Qualiopi) au niveau de la fiche.';
