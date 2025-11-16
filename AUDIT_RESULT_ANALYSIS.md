# 📊 Analyse de l'Audit Supabase - Rapport Final

## ✅ Points Validés

### 1. **Table `profiles`** ✅
Toutes les colonnes nécessaires sont présentes :
- `id`, `email`, `full_name`, `first_name`, `last_name`, `phone`, `avatar_url`, `role`
- ✅ Pas de `display_name` (correctement géré dans la migration)

### 2. **Table `courses`** ⚠️
**Structure réelle** :
- `owner_id` (pas `creator_id` comme dans notre migration)
- `cover_image`, `modules_count`, `duration_minutes`, `duration_label`, `category` ✅ (ajoutées)
- **Manque** : `slug`, `description`, `status`, `builder_snapshot` (peut-être absents de l'audit, ou non créés)

### 3. **Table `tests`** ⚠️
**Structure réelle** :
- `owner_id` (pas `created_by`)
- `org_id` (obligatoire)
- Pas de `slug` visible dans l'audit
- Colonnes ajoutées dans 002 : `hero_image`, `difficulty`, `builder_snapshot`, `is_ai_enabled` ✅

### 4. **Tables Drive** ✅
- `drive_documents` : structure correcte avec `folder_id`, `author_id`, `submitted_at`, `shared_with`, `ai_usage_score`
- `drive_folders` : structure correcte
- `drive_consigne` : structure correcte

### 5. **Tables Organisations** ✅
- `organizations` : structure correcte
- `org_memberships` : structure correcte
- `groups` : structure correcte
- `group_members` : structure correcte

---

## 🚨 Incohérences Critiques Détectées

### 1. **`courses.owner_id` vs `courses.creator_id`** (CRITIQUE)

**Problème** :
- Code frontend attend : `creator_id`
- Base de données réelle : `owner_id`
- Migration 000_admin_basics.sql crée : `creator_id`

**Impact** :
- Toutes les requêtes qui utilisent `courses.creator_id` vont échouer
- Les RLS policies dans 000_admin_basics.sql utilisent `creator_id`

**Solution** :
- Option A : Renommer `creator_id` → `owner_id` dans la migration 000
- Option B : Ajouter un alias ou une colonne calculée
- Option C : Mettre à jour le code frontend pour utiliser `owner_id`

**Recommandation** : **Option C** (modifier le frontend) car la base réelle utilise déjà `owner_id` partout.

---

### 2. **`tests.created_by` vs `tests.owner_id`** (CRITIQUE)

**Problème** :
- Migration 002 crée/utilise : `created_by`
- Base de données réelle : `owner_id`

**Impact** :
- Les RLS policies pour tests échoueront

**Solution** :
- Utiliser `owner_id` dans toutes les migrations et le code

---

### 3. **Structure de `courses` incomplète**

**Manque potentiellement** :
- `slug` (utilisé dans le code frontend)
- `description` (utilisé dans le code frontend)
- `status` (utilisé dans le code frontend)
- `builder_snapshot` (jsonb, pour le builder)

**À vérifier** : Si ces colonnes existent mais n'ont pas été listées dans l'audit.

---

### 4. **Deux systèmes de tables parallèles**

**Système 1 (existant)** :
- `formations` → `sections` → `chapters` → `subchapters`
- Structure hiérarchique complète
- Utilise `org_id` pour l'isolation

**Système 2 (notre migration)** :
- `courses` (table simple)
- `paths` (simple)

**Question** : Faut-il unifier ces deux systèmes ou les garder séparés ?

---

### 5. **Mapping des rôles** (CONFIRMÉ)

**Frontend** : `"formateur"`, `"apprenant"`, `"admin"`, `"tuteur"`
**Database** : `"instructor"`, `"student"`, `"admin"`, `"tutor"`

**Status** : ✅ Helper de mapping créé dans `src/lib/utils/role-mapping.ts`

---

## 📋 Actions Recommandées

### Priorité 1 : CORRECTIONS IMMÉDIATES

1. **Mettre à jour le code frontend pour utiliser `owner_id` au lieu de `creator_id`** :
   - Fichiers à modifier :
     - `src/lib/queries/admin.ts`
     - `src/lib/queries/formateur.ts`
     - `src/lib/queries/apprenant.ts`
     - Toutes les RLS policies dans les migrations

2. **Mettre à jour les migrations pour utiliser `owner_id`** :
   - Migration 000_admin_basics.sql : remplacer `creator_id` par `owner_id`
   - Migration 002 : remplacer `created_by` par `owner_id` pour tests

3. **Vérifier les colonnes manquantes dans `courses`** :
   - Ajouter `slug` si absent
   - Ajouter `description` si absent
   - Ajouter `status` si absent
   - Vérifier `builder_snapshot`

---

### Priorité 2 : CLARIFICATIONS

4. **Décider du système de tables** :
   - Utiliser `formations` (existant) OU `courses` (nouveau) ?
   - Ou les unifier ?

5. **Mettre à jour les types TypeScript** :
   - `src/types/database.ts` doit refléter la structure réelle
   - Utiliser `owner_id` au lieu de `creator_id`
   - Utiliser `owner_id` au lieu de `created_by` pour tests

---

## ✅ Fonctions et Policies Validées

### Fonctions ✅
- `user_has_role()` : ✅ Existe et fonctionne
- `is_admin()`, `is_instructor()`, `is_learner()`, `is_tutor()` : ✅ Existent
- Fonctions helper pour RLS : ✅ Toutes présentes

### Policies RLS ✅
- Toutes les tables ont des policies RLS configurées
- Utilisation cohérente de `org_memberships` pour les permissions
- Isolation multi-organisation bien gérée

---

## 📝 Prochaines Étapes

1. **Créer une migration corrective** pour :
   - Ajouter les colonnes manquantes à `courses` si nécessaire
   - Standardiser l'utilisation de `owner_id`

2. **Mettre à jour le code frontend** :
   - Remplacer tous les `creator_id` par `owner_id`
   - Remplacer tous les `created_by` par `owner_id` pour tests
   - Utiliser le mapping des rôles

3. **Mettre à jour les types TypeScript** :
   - Refléter la structure réelle de la base

4. **Tester la connexion complète** :
   - Vérifier que toutes les requêtes fonctionnent
   - Valider les RLS policies




