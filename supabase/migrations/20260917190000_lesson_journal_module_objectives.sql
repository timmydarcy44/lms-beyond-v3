-- Cahier de texte + objectifs modules (reliés aux créneaux planning)
-- deliveredVolume = somme duration_hours des slots avec lesson_completed_at non null

alter table public.school_curriculum_modules
  add column if not exists learning_objectives text;

comment on column public.school_curriculum_modules.learning_objectives is
  'Objectifs pédagogiques du module (texte libre, une ligne = un objectif).';

alter table public.school_planning_slots
  add column if not exists lesson_content text,
  add column if not exists lesson_objectives text[] not null default '{}',
  add column if not exists lesson_homework text,
  add column if not exists lesson_resources jsonb not null default '[]'::jsonb,
  add column if not exists lesson_completed_at timestamptz,
  add column if not exists lesson_completed_by uuid references public.profiles (id) on delete set null;

create index if not exists school_planning_slots_lesson_completed_idx
  on public.school_planning_slots (school_id, lesson_completed_at)
  where lesson_completed_at is not null;

comment on column public.school_planning_slots.lesson_content is
  'Contenu de séance (cahier de texte) — alimente deliveredVolume.';
comment on column public.school_planning_slots.lesson_completed_at is
  'Horodatage validation cahier de texte = heures réalisées.';
