-- Miroir pédagogique des colonnes front/back (outils / exports qui attendent question & answer)

alter table public.flashcards
  add column if not exists question text;

alter table public.flashcards
  add column if not exists answer text;

comment on column public.flashcards.question is 'Miroir de front pour compatibilité outils.';
comment on column public.flashcards.answer is 'Miroir de back pour compatibilité outils.';
