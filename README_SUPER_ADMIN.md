# 🛡️ Super Admin - Guide de Configuration

## 🎯 Vue d'Ensemble

L'espace Super Admin vous donne un accès complet à toutes les données du système : organisations, utilisateurs, contenus, etc.

## 📋 Étapes de Configuration

### 1. Exécuter le Script SQL

Exécutez le script `supabase/CREATE_SUPER_ADMIN_SYSTEM.sql` dans Supabase Studio :

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. **SQL Editor** → Nouvelle requête
4. Copiez-collez le contenu de `CREATE_SUPER_ADMIN_SYSTEM.sql`
5. Cliquez sur **Run**

Ce script va :
- ✅ Créer la table `super_admins`
- ✅ Créer la fonction `is_super_admin()`
- ✅ Ajouter les RLS policies pour accès complet

### 2. Ajouter Votre Compte comme Super Admin

**Important** : Remplacez `votre-email@exemple.com` par votre email réel dans cette requête :

```sql
INSERT INTO public.super_admins (user_id, created_by, notes)
SELECT id, id, 'Premier super admin'
FROM public.profiles 
WHERE email = 'votre-email@exemple.com';
```

**Comment trouver votre user_id si vous ne connaissez pas votre email dans profiles ?**

```sql
-- Voir tous les profils avec leurs emails
SELECT id, email, full_name, role 
FROM public.profiles 
ORDER BY created_at DESC;
```

Puis utilisez l'`id` correspondant :

```sql
INSERT INTO public.super_admins (user_id, created_by, notes)
VALUES ('votre-user-id-ici', 'votre-user-id-ici', 'Premier super admin');
```

### 3. Vérifier l'Accès

1. Connectez-vous avec votre compte
2. Allez sur `/admin/super`
3. Vous devriez voir le dashboard Super Admin

Si vous êtes redirigé vers `/dashboard`, c'est que votre compte n'est pas encore dans `super_admins`.

---

## 🔐 Sécurité

### RLS Policies

Les RLS policies créées permettent au Super Admin d'accéder à **TOUTES** les tables :
- `organizations`
- `org_memberships`
- `profiles` (lecture uniquement pour sécurité)
- `courses`, `paths`, `resources`, `tests`
- `groups`, `group_members`
- `enrollments`, `path_progress`
- Et toutes les autres tables importantes

### Service Role Key

Pour créer des utilisateurs, le système utilise la clé `SUPABASE_SERVICE_ROLE_KEY`. Assurez-vous qu'elle est dans votre `.env.local` :

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 📚 Fonctionnalités Disponibles

### Dashboard (`/admin/super`)
- Vue d'ensemble globale
- Statistiques (organisations, utilisateurs, contenus)
- Activité récente

### Organisations (`/admin/super/organisations`)
- Liste de toutes les organisations
- Création d'organisations
- Détails et gestion des membres

### Utilisateurs (`/admin/super/utilisateurs`)
- Liste de tous les utilisateurs
- Création d'utilisateurs
- Filtres par rôle

### Statistiques (`/admin/super/statistiques`)
- Graphiques et métriques globales
- (À venir)

---

## 🚨 Dépannage

### Erreur : "Accès non autorisé"

**Cause** : Votre compte n'est pas dans `super_admins`

**Solution** :
```sql
-- Vérifier si vous êtes super admin
SELECT sa.*, p.email, p.full_name
FROM public.super_admins sa
JOIN public.profiles p ON p.id = sa.user_id
WHERE sa.is_active = TRUE;
```

Si votre compte n'apparaît pas, exécutez l'INSERT ci-dessus.

### Erreur : "SUPABASE_SERVICE_ROLE_KEY manquant"

**Cause** : La variable d'environnement n'est pas définie

**Solution** : Ajoutez-la dans `.env.local` et redémarrez le serveur Next.js

### Les données ne s'affichent pas

**Cause** : RLS policies non créées

**Solution** : Réexécutez `CREATE_SUPER_ADMIN_SYSTEM.sql` et vérifiez les policies :

```sql
-- Vérifier les policies super admin
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE policyname LIKE '%super_admin%'
ORDER BY tablename;
```

---

## 📝 Notes Importantes

1. **Accès Complet** : En tant que Super Admin, vous avez accès à TOUTES les données. Utilisez ce pouvoir avec responsabilité.

2. **Création d'Utilisateurs** : Quand vous créez un utilisateur dans une organisation, un email d'invitation est généré (via `email_confirm: false`). L'utilisateur devra confirmer son email pour se connecter.

3. **RLS Bypass** : Les Super Admins contournent toutes les RLS policies grâce à `is_super_admin()`, ce qui permet de voir et modifier toutes les données.

4. **Audit Trail** : Pour l'instant, il n'y a pas de log des actions super admin. C'est une fonctionnalité à ajouter si nécessaire.

---

## ✅ Checklist de Configuration

- [ ] Script SQL `CREATE_SUPER_ADMIN_SYSTEM.sql` exécuté
- [ ] Votre compte ajouté dans `super_admins`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configuré dans `.env.local`
- [ ] Accès à `/admin/super` fonctionnel
- [ ] Test de création d'organisation réussi
- [ ] Test de création d'utilisateur réussi

---

**Prêt !** Vous pouvez maintenant gérer toutes les organisations et utilisateurs du système. 🚀




