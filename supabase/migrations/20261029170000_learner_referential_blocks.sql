-- Référentiel suivi par l'alternant, et blocs de compétences rattachés.
-- tutor_assignments.referential_id existait déjà sans clé étrangère.

alter table public.competency_blocks
  add column if not exists referential_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'competency_blocks_referential_fk'
  ) then
    alter table public.competency_blocks
      add constraint competency_blocks_referential_fk
      foreign key (referential_id) references public.tutor_referential_library (id) on delete cascade;
  end if;
end $$;

create index if not exists competency_blocks_referential_idx
  on public.competency_blocks (referential_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tutor_assignments_referential_fk'
  )
  and not exists (
    select 1
    from public.tutor_assignments a
    where a.referential_id is not null
      and not exists (
        select 1 from public.tutor_referential_library r where r.id = a.referential_id
      )
  ) then
    alter table public.tutor_assignments
      add constraint tutor_assignments_referential_fk
      foreign key (referential_id) references public.tutor_referential_library (id) on delete set null;
  end if;
end $$;

insert into public.tutor_referential_library (slug, title, description, domain, level, organization)
values (
  'bachelor-ai-business',
  'Bachelor AI Business',
  'Référentiel suivi par les alternants : prospection, négociation et closing.',
  'Commerce',
  'Bachelor',
  'Byound'
)
on conflict (slug) do update
set title = excluded.title,
    description = excluded.description,
    domain = excluded.domain,
    level = excluded.level,
    organization = excluded.organization;

insert into public.competency_blocks (code, title, kind, referential_id)
select v.code, v.title, 'skill', r.id
from (
  values
    ('CCP1', 'Prospection'),
    ('CCP2', 'Négociation'),
    ('CCP3', 'Closing')
) as v(code, title)
join public.tutor_referential_library r on r.slug = 'bachelor-ai-business'
on conflict (code) do update
set title = excluded.title,
    kind = excluded.kind,
    referential_id = excluded.referential_id;

insert into public.tutor_mission_templates (referential_id, title, description, objective, difficulty)
select r.id, b.title, 'Mission issue du bloc ' || b.code || ' — ' || b.title || '.', b.title, 'core'
from public.tutor_referential_library r
join public.competency_blocks b on b.referential_id = r.id
where r.slug = 'bachelor-ai-business'
  and not exists (
    select 1
    from public.tutor_mission_templates t
    where t.referential_id = r.id
      and t.title = b.title
  );
