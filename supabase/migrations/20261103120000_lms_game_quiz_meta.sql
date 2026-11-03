-- Annonce des jeux et questions de quiz.
-- Les questions restent dans tests.questions (jsonb) : explanation et concept_ref
-- s'y ajoutent sans écraser un texte déjà rédigé.
-- learner_id marque une Byound Card créée pour un apprenant, invisible aux autres.

alter table public.serious_games
  add column if not exists hook text,
  add column if not exists duration_min integer,
  add column if not exists steps_count integer,
  add column if not exists skills jsonb not null default '[]'::jsonb,
  add column if not exists character jsonb,
  add column if not exists cover_url text,
  add column if not exists max_attempts integer;

alter table public.flashcards
  add column if not exists learner_id uuid;

create index if not exists flashcards_learner_idx on public.flashcards (learner_id);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tests' and column_name = 'questions'
  ) then
    comment on column public.tests.questions is
      'Chaque question peut porter explanation (texte) et concept_ref ({label, subchapterId, anchor, passage}). Une complétion automatique ne remplace pas un texte déjà présent.';
  end if;
end $$;
