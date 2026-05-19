-- Permet de lier des flashcards à un identifiant de chapitre « builder » (non-UUID)
-- tant que le chapitre n’a pas d’UUID en base (chapter_id reste nullable).

alter table public.flashcards
  add column if not exists local_chapter_ref text;

create index if not exists flashcards_local_chapter_ref_idx
  on public.flashcards (course_id, local_chapter_ref)
  where local_chapter_ref is not null;

comment on column public.flashcards.local_chapter_ref is
  'Identifiant local du chapitre dans le builder (ex. chapter-...) quand chapter_id est encore null.';
