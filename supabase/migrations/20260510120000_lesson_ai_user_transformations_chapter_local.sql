-- Requiert PostgreSQL 15+ (NULLS NOT DISTINCT sur l’index unique).
-- Historique EDGE / lesson assistant : rattacher les transformations aux sous-chapitres
-- dont l'id est local (builder snapshot), pas un UUID PostgreSQL.
-- NULLS NOT DISTINCT : une seule ligne par (user, transformation, lesson_id nul, chapter_local_id nul).

alter table public.lesson_ai_user_transformations
  add column if not exists chapter_local_id text;

comment on column public.lesson_ai_user_transformations.chapter_local_id is
  'Identifiant chapitre/sous-chapitre côté snapshot (ex. subchapter-…) quand lesson_id est NULL.';

alter table public.lesson_ai_user_transformations
  drop constraint if exists lesson_ai_user_transformations_user_id_lesson_id_transformation_id_key;

create unique index if not exists lesson_ai_user_transformations_dedupe_uidx
  on public.lesson_ai_user_transformations (user_id, transformation_id, lesson_id, chapter_local_id)
  nulls not distinct;
