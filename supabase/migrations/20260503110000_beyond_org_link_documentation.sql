-- Documentation métier Beyond : rattachement aux organisations.
--
-- Ce fichier NE MODIFIE PAS les parcours, galaxy, courses, path_* ni les données LMS existantes.
-- Il ajoute uniquement des commentaires SQL et un index utilitaire sur org_memberships (si la table existe).
--
-- Logique attendue (à respecter côté provisioning / app) :
-- 1) Une organisation CFA existe dans public.organizations (id = slug métier stable ou UUID provisionné).
-- 2) Le personnel « école » (accès dashboard Beyond Connect école) : profil avec role / role_type métier
--    ecole + profiles.school_id = cet organizations.id (voir aussi organization_features si utilisé).
-- 3) Les apprenants : au minimum une ligne dans org_memberships (org_id, user_id, role = 'learner')
--    pour l’organisation pédagogique ; Beyond Connect peut en plus utiliser profiles.school_id + school_students
--    pour le même org.id établissement.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'school_id'
  ) then
    execute $cmt$
      comment on column public.profiles.school_id is
        'Beyond Connect : ID métier de l’établissement CFA. Aligner sur public.organizations.id quand le CFA est une org Beyond. Comptes personnel école : renseigner pour RLS CRM / classes.';
    $cmt$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role_type'
  ) then
    execute $cmt$
      comment on column public.profiles.role_type is
        'Libellé métier (apprenant, ecole, …). Rattachement LMS multi-org : public.org_memberships ; apprenant : role learner sur son organisation.';
    $cmt$;
  end if;
end $$;

do $$
begin
  if to_regclass('public.org_memberships') is not null then
    create index if not exists org_memberships_user_org_bc_idx
      on public.org_memberships (user_id, org_id);
  end if;
end $$;
