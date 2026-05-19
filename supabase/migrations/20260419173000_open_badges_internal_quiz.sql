-- Add internal quiz JSONB editor storage for open_badges

alter table if exists public.open_badges
  add column if not exists internal_quiz jsonb;

