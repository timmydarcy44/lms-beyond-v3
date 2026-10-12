create table if not exists public.formateur_course_journals (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  resources jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (course_id, author_id)
);

alter table public.formateur_course_journals enable row level security;

comment on table public.formateur_course_journals is
  'Cahier de texte d''un formateur pour un cours qui lui est assigné.';
