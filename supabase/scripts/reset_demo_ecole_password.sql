-- Réinitialiser le mot de passe du compte démo (Supabase Auth).
-- À exécuter dans le SQL Editor du projet Supabase, avec un mot de passe en clair que vous choisissez.
--
-- Le mot de passe ne vit PAS dans public.profiles ; seul auth.users compte pour signInWithPassword.
--
-- Si signInWithPassword renvoie encore « Invalid login credentials » après ce script :
--   1) Vérifiez que l’e-mail est exactement demo@ecole.fr (pas d’espace, bon projet Supabase).
--   2) Vérifiez qu’il n’y a qu’un seul utilisateur avec cet e-mail : select id, email from auth.users where lower(email) = 'demo@ecole.fr';
--   3) Préférez le chemin officiel (hash géré par GoTrue) :
--      Dashboard → Authentication → Users → demo@ecole.fr → « Send magic link » ou « Reset password » / « Set password »
--      ou API Admin (service_role) : auth.admin.updateUserById(userId, { password: '...' }).
--   Le SQL ci-dessous peut échouer silencieusement côté login si la colonne / l’algorithme ne correspond pas
--   à ce qu’attend votre version de GoTrue, ou si identities / confirmation ne sont pas cohérents.
--
-- Alternative fiable (hash géré par GoTrue) : depuis la racine du dépôt, avec .env.local rempli :
--   node scripts/reset-demo-ecole-password.mjs "VotreMotDePasse"

begin;

update auth.users
set
  encrypted_password = crypt('REMPLACEZ_PAR_VOTRE_MOT_DE_PASSE', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(coalesce(email, '')) = 'demo@ecole.fr';

commit;
