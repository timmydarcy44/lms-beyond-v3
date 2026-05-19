-- Audit complet : connexion « Invalid login credentials » pour demo@ecole.fr
-- À exécuter dans le SQL Editor du MÊME projet Supabase que l’app (URL anon / auth).
-- Ne modifie aucune donnée (lecture seule sauf si vous décommentez les correctifs).

-- 1) Utilisateur Auth (auth.users)
select
  id,
  email,
  email_confirmed_at,
  banned_until,
  created_at,
  updated_at,
  left(coalesce(encrypted_password, ''), 12) as password_hash_prefix
from auth.users
where lower(trim(coalesce(email, ''))) = 'demo@ecole.fr';

-- 2) Doublons d’e-mail (ne devrait pas retourner plus d’une ligne)
select count(*) as auth_users_with_demo_email
from auth.users
where lower(trim(coalesce(email, ''))) = 'demo@ecole.fr';

-- 3) Identités OAuth / email (GoTrue)
select i.id, i.provider, i.identity_data, i.created_at, i.updated_at
from auth.identities i
join auth.users u on u.id = i.user_id
where lower(trim(coalesce(u.email, ''))) = 'demo@ecole.fr';

-- 4) Profil applicatif (public.profiles) — id = auth.users.id en général
select p.*
from public.profiles p
where lower(trim(coalesce(p.email, ''))) = 'demo@ecole.fr';

-- 5) Memberships (accès école / EDGE Lab, etc.)
select om.*, o.name as org_name, o.slug as org_slug
from public.org_memberships om
join public.organizations o on o.id = om.org_id
join public.profiles p on p.id = om.user_id
where lower(trim(coalesce(p.email, ''))) = 'demo@ecole.fr';

-- 6) Organisations « EDGE » / « Playmakers » (existence en base)
select id, name, slug, created_at
from public.organizations
where slug ilike '%edge%'
   or name ilike '%edge%'
   or slug ilike '%playmakers%'
   or name ilike '%playmakers%'
order by name;

-- Interprétation rapide :
-- • 0 ligne en (1) : le compte n’existe pas dans CE projet → créer l’utilisateur ou vérifier l’URL Supabase côté app.
-- • email_confirmed_at null : selon config Auth, le mot de passe peut être refusé → confirmer l’e-mail ou forcer confirmation (Dashboard Auth / Admin API).
-- • identities avec provider ≠ email : connexion « mot de passe » peut ne pas s’appliquer → utiliser le bon provider ou lier un mot de passe.
-- • Mot de passe : ne pas compter sur un UPDATE SQL crypt() si GoTrue rejette le hash → utiliser
--     node scripts/reset-demo-ecole-password.mjs "NouveauMotDePasse"
--   avec SUPABASE_SERVICE_ROLE_KEY dans .env.local, ou Dashboard → Users → Set password.
