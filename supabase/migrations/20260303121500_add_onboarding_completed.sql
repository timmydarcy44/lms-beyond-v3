alter table if exists public.profiles
  add column if not exists onboarding_completed boolean default false;

update public.profiles
set onboarding_completed = false
where onboarding_completed is null;
