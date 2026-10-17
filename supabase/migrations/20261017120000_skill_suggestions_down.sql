-- Annule 20261017120000_skill_suggestions.sql

drop policy if exists skill_catalog_aliases_read on public.skill_catalog_aliases;
drop policy if exists skill_catalog_additions_read on public.skill_catalog_additions;
drop policy if exists skill_suggestions_select_own on public.skill_suggestions;
drop policy if exists skill_suggestions_insert_own on public.skill_suggestions;

drop table if exists public.skill_catalog_aliases;
drop table if exists public.skill_catalog_additions;
drop table if exists public.skill_suggestions;
