create table if not exists public.quiz_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  document_id uuid,
  folder_id uuid,
  topic text,
  question_type text,
  is_correct boolean not null default false,
  created_at timestamp with time zone default now()
);

alter table public.quiz_history enable row level security;

create policy "Users can read own quiz history"
  on public.quiz_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own quiz history"
  on public.quiz_history for insert
  with check (auth.uid() = user_id);
