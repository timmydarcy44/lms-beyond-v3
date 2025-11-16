# 🚀 Guide de Configuration Rapide - Base de Données

## Étape 1 : Créer le fichier .env.local

Créez un fichier `.env.local` à la racine du projet (même niveau que `package.json`).

### Contenu à mettre dans `.env.local` :

```env
# Supabase Configuration
# ⚠️ REMPLACEZ ces valeurs par celles de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (optionnel - pour les fonctionnalités IA)
OPENAI_API_KEY=sk-...
```

### 🔍 Où trouver ces valeurs ?

1. **Allez sur https://app.supabase.com**
2. **Sélectionnez votre projet** (ou créez-en un si vous n'en avez pas)
3. **Cliquez sur Settings (⚙️) → API**
4. **Copiez :**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez-la secrète !)

---

## Étape 2 : Exécuter les Migrations

Vous devez exécuter les migrations dans l'ordre dans Supabase Studio :

### Option A : Via Supabase Studio (Recommandé)

1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Pour chaque migration (dans l'ordre) :
   - Ouvrez le fichier SQL depuis votre projet local
   - Copiez tout le contenu
   - Collez dans l'éditeur SQL
   - Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)

**Ordre d'exécution :**
1. `supabase/migrations/000_admin_basics.sql`
2. `supabase/migrations/001_add_role_column.sql`
3. `supabase/migrations/002_lms_tutor_builder_activity.sql`
4. `supabase/migrations/003_fix_inconsistencies.sql` ⭐ **CRITIQUE**

### Option B : Vérifier ce qui existe déjà

Si vous avez déjà une base de données, vous pouvez vérifier quelles tables existent en exécutant cette requête dans SQL Editor :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## Étape 3 : Vérifier que tout fonctionne

1. **Redémarrez votre serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Ouvrez http://localhost:3000**

3. **Testez l'authentification** :
   - Allez sur `/login`
   - Créez un compte ou connectez-vous

4. **Vérifiez les logs dans la console** :
   - Si vous voyez "Supabase client unavailable" → `.env.local` manquant ou incorrect
   - Si vous voyez "Unable to retrieve user profile" → Les migrations ne sont pas exécutées

---

## ⚠️ Problèmes Courants

### "Supabase client unavailable"
- ✅ Vérifiez que `.env.local` existe à la racine du projet
- ✅ Vérifiez que les variables commencent bien par `NEXT_PUBLIC_` pour celles qui doivent être accessibles côté client
- ✅ **Redémarrez le serveur** après avoir créé/modifié `.env.local`

### "column does not exist" ou "table does not exist"
- ✅ Exécutez toutes les migrations dans l'ordre
- ✅ Commencez par `000_admin_basics.sql`

### Les rôles ne fonctionnent pas
- ✅ Vérifiez que dans la DB, les rôles sont en anglais : `student`, `instructor`, `admin`, `tutor`
- ✅ Le mapping automatique est déjà en place dans le code

---

## ✅ Checklist

Avant de passer à la suite, vérifiez :

- [ ] Fichier `.env.local` créé avec les 3 variables Supabase
- [ ] Migration `000_admin_basics.sql` exécutée
- [ ] Migration `001_add_role_column.sql` exécutée (si nécessaire)
- [ ] Migration `002_lms_tutor_builder_activity.sql` exécutée (si nécessaire)
- [ ] Migration `003_fix_inconsistencies.sql` exécutée ⭐
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Test de connexion réussi

---

## 🎯 Prochaines Étapes

Une fois tout configuré :
1. Créez votre premier utilisateur via `/signup`
2. Dans Supabase Studio → Table Editor → `profiles`, changez le `role` à `"admin"` pour tester les fonctionnalités admin



