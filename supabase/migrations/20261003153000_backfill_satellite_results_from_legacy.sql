-- Reprise des résultats laissés dans *_legacy_pre_20260503 après alignement schéma (20260503103000).
-- Idempotent : n'insère que si la ligne cible n'existe pas encore.

do $$
begin
  if to_regclass('public.soft_skills_resultats_legacy_pre_20260503') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'soft_skills_resultats_legacy_pre_20260503'
         and column_name = 'learner_id'
     ) then
    insert into public.soft_skills_resultats (learner_id, answers, scores, total_score, taken_at)
    select
      l.learner_id,
      coalesce(l.answers, '{}'::jsonb),
      coalesce(l.scores, '{}'::jsonb),
      coalesce(l.total_score, 0),
      coalesce(l.taken_at, now())
    from public.soft_skills_resultats_legacy_pre_20260503 l
    where l.learner_id is not null
    on conflict (learner_id) do nothing;
  end if;

  if to_regclass('public.disc_resultats_legacy_pre_20260503') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'disc_resultats_legacy_pre_20260503'
         and column_name = 'profile_id'
     ) then
    insert into public.disc_resultats (profile_id, scores, updated_at)
    select
      l.profile_id,
      l.scores,
      coalesce(l.updated_at, now())
    from public.disc_resultats_legacy_pre_20260503 l
    where l.profile_id is not null
    on conflict (profile_id) do nothing;
  end if;

  if to_regclass('public.idmc_resultats_legacy_pre_20260503') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'idmc_resultats_legacy_pre_20260503'
         and column_name = 'profile_id'
     ) then
    insert into public.idmc_resultats (profile_id, scores, responses, global_score, level, updated_at)
    select
      l.profile_id,
      l.scores,
      l.responses,
      l.global_score,
      l.level,
      coalesce(l.updated_at, now())
    from public.idmc_resultats_legacy_pre_20260503 l
    where l.profile_id is not null
    on conflict (profile_id) do nothing;
  end if;
end $$;
