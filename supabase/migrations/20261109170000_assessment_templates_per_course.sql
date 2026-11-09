-- Positionnement optionnel par formation catalogue (chaud/froid restent globaux)

alter table public.formation_assessment_templates
  add column if not exists training_course_id uuid
    references public.training_courses (id) on delete cascade;

comment on column public.formation_assessment_templates.training_course_id is
  'Null = gabarit global. Renseigné = override (typiquement positionnement) pour une formation catalogue.';

-- Remplace unique(kind) pour autoriser 1 global + N par course
alter table public.formation_assessment_templates
  drop constraint if exists formation_assessment_templates_kind_key;

drop index if exists formation_assessment_templates_kind_key;

create unique index if not exists formation_assessment_templates_kind_course_uidx
  on public.formation_assessment_templates (
    kind,
    coalesce(training_course_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists formation_assessment_templates_course_idx
  on public.formation_assessment_templates (training_course_id)
  where training_course_id is not null;
