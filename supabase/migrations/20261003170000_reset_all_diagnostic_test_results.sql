-- Remise à zéro des diagnostics EDGE (DISC, IDMC, soft skills) pour tous les profils.
-- Conserve projet pro, expériences, diplômes, compétences métier.
-- À appliquer une fois ; les apprenants / salariés repassent les tests.

-- ---------------------------------------------------------------------------
-- Résultats tests (tables satellites)
-- ---------------------------------------------------------------------------
delete from public.soft_skills_resultats;
delete from public.soft_skills_resultats_salarie;
delete from public.disc_resultats;
delete from public.idmc_resultats;

do $$
begin
  if to_regclass('public.soft_skills_resultats_legacy_pre_20260503') is not null then
    delete from public.soft_skills_resultats_legacy_pre_20260503;
  end if;
  if to_regclass('public.disc_resultats_legacy_pre_20260503') is not null then
    delete from public.disc_resultats_legacy_pre_20260503;
  end if;
  if to_regclass('public.idmc_resultats_legacy_pre_20260503') is not null then
    delete from public.idmc_resultats_legacy_pre_20260503;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Cache profil lié aux tests (pas le projet professionnel)
-- ---------------------------------------------------------------------------
update public.profiles
set
  cross_profile_completion = null,
  ai_analysis = null,
  objective_details = null
where
  cross_profile_completion is not null
  or ai_analysis is not null
  or objective_details is not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'disc_scores'
  ) then
    update public.profiles
    set
      disc_scores = null,
      score_d = null,
      score_i = null,
      score_s = null,
      score_c = null
    where
      disc_scores is not null
      or score_d is not null
      or score_i is not null
      or score_s is not null
      or score_c is not null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Badge « Profil comportemental » — attributions liées aux anciens tests
-- ---------------------------------------------------------------------------
update public.open_badges
set evaluation_config = (
  coalesce(evaluation_config, '{}'::jsonb)
  - 'learnerAwards'
  - 'learnerSubmissions'
  - 'learnerSubmissionsArchive'
)
where id = 'a1000001-0000-4000-8000-000000000001'
   or name in ('Profil comportemental Byound', 'Profil comportemental EDGE', 'Diagnostic Commercial');
