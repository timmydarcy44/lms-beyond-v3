-- Métier distinct du poste sur la fiche collaborateur.
-- À coller dans Supabase, puis à exécuter.

alter table public.employees
  add column if not exists metier text;
