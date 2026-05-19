-- Isoler flashcards chapitre vs sous-chapitre

alter table public.flashcards
  add column if not exists subchapter_id uuid;

alter table public.flashcards
  add column if not exists local_subchapter_ref text;

create index if not exists flashcards_subchapter_idx on public.flashcards (subchapter_id);
create index if not exists flashcards_local_subchapter_ref_idx
  on public.flashcards (course_id, local_subchapter_ref)
  where local_subchapter_ref is not null;

comment on column public.flashcards.subchapter_id is 'UUID du sous-chapitre (quand disponible).';
comment on column public.flashcards.local_subchapter_ref is 'Identifiant local du sous-chapitre (ex. subchapter-...) quand subchapter_id est null.';

