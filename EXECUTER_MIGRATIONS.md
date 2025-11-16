# 🚀 Guide d'Exécution des Migrations - Pas à Pas

## ✅ Configuration Vérifiée

- ✅ `.env.local` configuré avec toutes les variables
- ✅ `SUPABASE_SERVICE_ROLE_KEY` présente
- ✅ Migrations prêtes dans `supabase/migrations/`

## 📋 Prochaines Étapes : Exécuter les Migrations

### Option 1 : Via Supabase Studio (Recommandé - Plus Simple)

#### Étape 1 : Ouvrir Supabase Studio

1. Allez sur **https://app.supabase.com**
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** (celui avec l'URL : `fqqqejpakbccwvrlolpc.supabase.co`)
4. Dans le menu de gauche, cliquez sur **SQL Editor** (icône </>)

#### Étape 2 : Exécuter la Migration 000

1. **Ouvrez le fichier** `supabase/migrations/000_admin_basics.sql` dans votre éditeur local
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Retournez dans Supabase Studio → SQL Editor**
5. **Collez** le contenu dans l'éditeur SQL
6. **Cliquez sur "Run"** (en haut à droite) ou appuyez sur **Ctrl+Enter**
7. ✅ Vérifiez qu'il n'y a **pas d'erreur** (vous devriez voir "Success" en vert)

#### Étape 3 : Exécuter la Migration 001

1. **Ouvrez** `supabase/migrations/001_add_role_column.sql`
2. **Copiez tout le contenu**
3. **Retournez dans SQL Editor**
4. **Effacez** le contenu précédent (ou créez un nouvel onglet)
5. **Collez** le nouveau contenu
6. **Exécutez** (Run ou Ctrl+Enter)
7. ✅ Vérifiez le succès

#### Étape 4 : Exécuter la Migration 002

1. **Ouvrez** `supabase/migrations/002_lms_tutor_builder_activity.sql`
2. **Copiez tout le contenu**
3. **Dans SQL Editor**, effacez et collez
4. **Exécutez**
5. ✅ Vérifiez le succès

#### Étape 5 : Exécuter la Migration 003 ⭐ CRITIQUE

1. **Ouvrez** `supabase/migrations/003_fix_inconsistencies.sql`
2. **Copiez tout le contenu** (c'est un long fichier)
3. **Dans SQL Editor**, effacez et collez
4. **Exécutez** (peut prendre quelques secondes)
5. ✅ Vérifiez le succès - vous devriez voir "Success. No rows returned"

### Option 2 : Vérifier d'abord ce qui existe déjà

Si vous avez déjà une base de données avec des tables, exécutez d'abord ce script de vérification :

1. **Ouvrez** `supabase/check-db-status.sql`
2. **Copiez tout le contenu**
3. **Dans Supabase Studio → SQL Editor**, collez et exécutez
4. **Analysez les résultats** pour voir ce qui existe déjà

**Si certaines tables existent déjà :**
- Les migrations utilisent `IF NOT EXISTS`, donc pas de problème si vous les relancez
- Vous pouvez exécuter toutes les migrations en sécurité

## 🔍 Vérification Après Exécution

Une fois toutes les migrations exécutées, vérifiez que tout est en place :

1. **Dans Supabase Studio**, allez dans **Table Editor** (menu de gauche)
2. **Vérifiez que ces tables existent** :
   - ✅ `profiles`
   - ✅ `courses`
   - ✅ `paths`
   - ✅ `organizations` ⭐
   - ✅ `groups` ⭐
   - ✅ `drive_documents` ⭐
   - ✅ `flashcards` ⭐

3. **Vérifiez les colonnes de `profiles`** :
   - Cliquez sur la table `profiles`
   - Vérifiez qu'elle a ces colonnes :
     - `email` ⭐
     - `full_name` ⭐
     - `first_name` ⭐
     - `last_name` ⭐
     - `phone` ⭐
     - `avatar_url` ⭐

## ⚠️ Erreurs Courantes

### "relation already exists"
- ✅ **Pas grave** : Cela signifie que la table existe déjà
- ✅ Vous pouvez continuer avec les migrations suivantes

### "column already exists"
- ✅ **Pas grave** : La colonne existe déjà
- ✅ Les migrations utilisent `IF NOT EXISTS` donc ça devrait passer

### "permission denied"
- ⚠️ Vérifiez que vous êtes bien connecté à Supabase Studio
- ⚠️ Vérifiez que vous avez les droits sur le projet

### Erreur de syntaxe
- ⚠️ Vérifiez que vous avez copié **tout** le contenu du fichier
- ⚠️ Assurez-vous qu'il n'y a pas de caractères manquants

## 🎯 Après les Migrations

Une fois toutes les migrations exécutées avec succès :

1. ✅ Redémarrez votre serveur de développement : `npm run dev`
2. ✅ Testez l'authentification : `/login`
3. ✅ Testez les dashboards : `/dashboard`

## 📞 Besoin d'Aide ?

Si vous rencontrez une erreur spécifique :
1. Copiez le message d'erreur exact
2. Notez quelle migration a échoué
3. Je peux vous aider à la résoudre !



