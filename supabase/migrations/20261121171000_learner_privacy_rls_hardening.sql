-- Durcissement RLS : tuteur et entreprise ne voient jamais
-- Care / mental_health, dossier handicap, motif médical d'absence, matchings hors offre.

-- ---------------------------------------------------------------------------
-- 1) Legacy handicap_* : fermer using (true) → staff handicap uniquement
-- ---------------------------------------------------------------------------
drop policy if exists handicap_profiles_service on public.handicap_profiles;
drop policy if exists handicap_followups_service on public.handicap_followups;
drop policy if exists handicap_documents_service on public.handicap_documents;
drop policy if exists handicap_meetings_service on public.handicap_meetings;

do $handicap$
begin
  if to_regprocedure('public.is_disability_staff(uuid)') is not null then
    if to_regclass('public.handicap_profiles') is not null then
      execute $p$
        create policy handicap_profiles_staff on public.handicap_profiles
          for all using (public.is_disability_staff(auth.uid()))
          with check (public.is_disability_staff(auth.uid()))
      $p$;
    end if;
    if to_regclass('public.handicap_followups') is not null then
      execute $p$
        create policy handicap_followups_staff on public.handicap_followups
          for all using (public.is_disability_staff(auth.uid()))
          with check (public.is_disability_staff(auth.uid()))
      $p$;
    end if;
    if to_regclass('public.handicap_documents') is not null then
      execute $p$
        create policy handicap_documents_staff on public.handicap_documents
          for all using (public.is_disability_staff(auth.uid()))
          with check (public.is_disability_staff(auth.uid()))
      $p$;
    end if;
    if to_regclass('public.handicap_meetings') is not null then
      execute $p$
        create policy handicap_meetings_staff on public.handicap_meetings
          for all using (public.is_disability_staff(auth.uid()))
          with check (public.is_disability_staff(auth.uid()))
      $p$;
    end if;
  end if;
end;
$handicap$;

-- ---------------------------------------------------------------------------
-- 2) mental_health_* : retirer lectures tuteur / org manager / instructor
-- ---------------------------------------------------------------------------
do $mh$
begin
  if to_regclass('public.mental_health_assessments') is not null then
    execute 'drop policy if exists "Org managers view mental assessments" on public.mental_health_assessments';
    execute 'drop policy if exists "Instructors can view mental assessments" on public.mental_health_assessments';
    execute 'drop policy if exists "Tutors can view mental assessments" on public.mental_health_assessments';
  end if;
  if to_regclass('public.mental_health_responses') is not null then
    execute 'drop policy if exists "Admins can view their organization responses" on public.mental_health_responses';
    execute 'drop policy if exists "Instructors can view their learners responses" on public.mental_health_responses';
    execute 'drop policy if exists "Tutors can view their learners responses" on public.mental_health_responses';
    execute 'drop policy if exists "Special users can view responses" on public.mental_health_responses';
  end if;
  if to_regclass('public.mental_health_indicators') is not null then
    execute 'drop policy if exists "Tutors can view their learners indicators" on public.mental_health_indicators';
    execute 'drop policy if exists "Org managers view mental indicators" on public.mental_health_indicators';
    execute 'drop policy if exists "Instructors can view mental indicators" on public.mental_health_indicators';
  end if;
end;
$mh$;

-- ---------------------------------------------------------------------------
-- 3) school_absences : activer RLS + masquer le motif hors apprenant / staff école
-- ---------------------------------------------------------------------------
do $abs$
begin
  if to_regclass('public.school_absences') is null then
    return;
  end if;

  alter table public.school_absences enable row level security;

  -- Apprenant : ses absences (y compris motif).
  execute 'drop policy if exists school_absences_learner_all on public.school_absences';
  execute $p$
    create policy school_absences_learner_all on public.school_absences
      for all
      using (learner_id = auth.uid())
      with check (learner_id = auth.uid())
  $p$;

  -- Tuteur : voit les absences de ses alternants, SANS motif médical
  -- (colonne motif retirée via vue ; ici on autorise la ligne pour statut/date).
  execute 'drop policy if exists school_absences_tutor_select on public.school_absences';
  execute $p$
    create policy school_absences_tutor_select on public.school_absences
      for select
      using (
        exists (
          select 1 from public.tutor_assignments ta
          where ta.tutor_id = auth.uid()
            and ta.learner_id = school_absences.learner_id
            and ta.status = 'active'
        )
      )
  $p$;

  -- Staff école (même school_id, rôle école / admin / instructor) : lecture.
  execute 'drop policy if exists school_absences_school_staff_select on public.school_absences';
  execute $p$
    create policy school_absences_school_staff_select on public.school_absences
      for select
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.school_id is not null
            and p.school_id = school_absences.school_id
            and lower(coalesce(p.role, p.role_type, '')) in (
              'admin', 'instructor', 'ecole', 'school_admin', 'formateur', 'referent'
            )
        )
      )
  $p$;
end;
$abs$;

-- Vue sans motif pour tuteur / entreprise (apprenant lit school_absences directement).
do $view$
begin
  if to_regclass('public.school_absences') is null then
    return;
  end if;
  execute $v$
    create or replace view public.school_absences_safe as
    select
      id,
      school_id,
      learner_id,
      slot_id,
      kind,
      status,
      duration_hours,
      proof_filename,
      proof_path,
      proof_mime,
      proof_size,
      created_at,
      updated_at,
      case when learner_id = auth.uid() then motif else null end as motif_visible
    from public.school_absences
  $v$;
  execute $c$
    comment on view public.school_absences_safe is
      'Absences sans motif médical pour tuteur/entreprise. L''apprenant lit motif via school_absences.'
  $c$;
  grant select on public.school_absences_safe to authenticated;
end;
$view$;

-- ---------------------------------------------------------------------------
-- 4) applications : retirer la lecture « tout profil même school_id » (tuteurs inclus)
-- ---------------------------------------------------------------------------
drop policy if exists applications_school_select on public.applications;
create policy applications_school_select
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.job_offers jo
      join public.profiles p on p.school_id = jo.school_id and p.id = auth.uid()
      where jo.id = applications.job_id
        and lower(coalesce(p.role, p.role_type, '')) in (
          'admin', 'instructor', 'ecole', 'school_admin', 'formateur', 'referent'
        )
        and not exists (
          select 1 from public.user_roles ur
          where ur.user_id = auth.uid() and ur.role = 'tuteur'
        )
    )
  );
