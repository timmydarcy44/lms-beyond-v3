# 🎯 Configuration Finale - Étapes Restantes

## ✅ Ce qui est déjà fait

- ✅ Fichier `.env.local` existe
- ✅ Variables Supabase de base configurées
- ✅ Toutes les migrations sont présentes dans le projet
- ✅ Code frontend prêt (mapping des rôles corrigé)

## ⚠️ Ce qui reste à faire

### 1. Ajouter la clé Service Role (5 minutes)

**Pourquoi ?** Cette clé est nécessaire pour certaines opérations admin côté serveur.

**Comment faire :**

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Settings → API
4. Trouvez **"service_role"** (⚠️ secret key - ne la partagez jamais !)
5. Ouvrez `.env.local` et ajoutez :
   ```env
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

### 2. Exécuter les Migrations dans Supabase (10-15 minutes)

Les migrations doivent être exécutées **dans l'ordre** dans Supabase Studio.

#### Option A : Vérifier d'abord ce qui existe

Exécutez cette requête dans **Supabase Studio → SQL Editor** :

```sql
-- Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Résultat attendu** (après toutes les migrations) :
- `profiles`
- `courses`
- `paths`
- `enrollments`
- `organizations` ⭐
- `groups` ⭐
- `group_members` ⭐
- `drive_consigne` ⭐
- `drive_documents` ⭐
- `drive_folders` ⭐
- `flashcards` ⭐
- Et d'autres...

#### Option B : Exécuter les migrations une par une

1. **Allez sur https://app.supabase.com → Votre projet → SQL Editor**

2. **Migration 1** : `000_admin_basics.sql`
   - Ouvrez le fichier `supabase/migrations/000_admin_basics.sql`
   - Copiez tout le contenu
   - Collez dans SQL Editor
   - Cliquez sur **Run** (ou `Ctrl+Enter`)
   - ✅ Vérifiez qu'il n'y a pas d'erreur

3. **Migration 2** : `001_add_role_column.sql`
   - Même processus
   - ⚠️ Cette migration utilise `IF NOT EXISTS`, donc pas de problème si vous la relancez

4. **Migration 3** : `002_lms_tutor_builder_activity.sql`
   - Même processus

5. **Migration 4** : `003_fix_inconsistencies.sql` ⭐ **CRITIQUE**
   - Même processus
   - Cette migration corrige toutes les incohérences
   - C'est la plus importante !

### 3. Vérifier les Colonnes de `profiles`

Après avoir exécuté les migrations, vérifiez que la table `profiles` a toutes les colonnes nécessaires :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**Colonnes attendues :**
- `id`
- `role`
- `email` ⭐
- `full_name` ⭐
- `first_name` ⭐
- `last_name` ⭐
- `phone` ⭐
- `avatar_url` ⭐
- `display_name`
- `created_at`

### 4. Tester la Connexion

1. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

2. **Ouvrez http://localhost:3000/login**

3. **Créez un compte** ou connectez-vous

4. **Vérifiez les logs** :
   - Ouvrez la console du navigateur (F12)
   - Vérifiez qu'il n'y a pas d'erreur "Supabase client unavailable"
   - Vérifiez qu'il n'y a pas d'erreur "Unable to retrieve user profile"

5. **Testez un dashboard** :
   - Allez sur `/dashboard`
   - Les données devraient s'afficher (même si vides pour l'instant)

### 5. Créer un Utilisateur Admin (Optionnel)

Pour tester les fonctionnalités admin :

1. Créez un compte normal via `/signup`
2. Dans **Supabase Studio → Table Editor → `profiles`**
3. Trouvez votre utilisateur (via email)
4. Changez la colonne `role` à `"admin"` (en anglais dans la DB)

Ou via SQL :
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre_email@exemple.com';
```

## 🔍 Vérification Rapide

Vous pouvez utiliser le script de vérification :

```bash
npm run check:db
```

## ✅ Checklist Finale

- [ ] `SUPABASE_SERVICE_ROLE_KEY` ajoutée dans `.env.local`
- [ ] Migration `000_admin_basics.sql` exécutée
- [ ] Migration `001_add_role_column.sql` exécutée
- [ ] Migration `002_lms_tutor_builder_activity.sql` exécutée
- [ ] Migration `003_fix_inconsistencies.sql` exécutée ⭐
- [ ] Table `profiles` a toutes les colonnes nécessaires
- [ ] Serveur redémarré
- [ ] Test de connexion réussi
- [ ] Test d'authentification réussi

## 🎉 Une fois tout terminé

Votre application sera **pleinement connectée** ! Vous pourrez :
- ✅ Créer des utilisateurs
- ✅ Gérer les rôles
- ✅ Créer des cours, tests, ressources
- ✅ Utiliser toutes les fonctionnalités du LMS

## 🚨 Besoin d'aide ?

Si vous rencontrez des erreurs :
1. Consultez `CONNEXION_DB_INSTRUCTIONS.md` (section Troubleshooting)
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les logs dans Supabase Studio → Logs



