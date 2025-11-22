# 🔧 Corrections Nécessaires après Audit

## ✅ Résumé de l'Audit

**Structure de la base validée** ✅
- Toutes les tables nécessaires existent
- Les colonnes principales sont présentes
- Les RLS policies sont configurées

**Incohérences détectées** ⚠️

---

## 🚨 Corrections Critiques à Faire

### 1. **Remplacer `creator_id` → `owner_id` dans le code frontend**

**Fichiers à modifier** :

#### `src/lib/queries/formateur.ts`
- **Ligne 676** : `.eq("creator_id", userId)` → `.eq("owner_id", userId)` (pour paths)
- **Ligne 759** : `.eq("creator_id", userId)` → `.eq("owner_id", userId)` (pour courses)
- **Ligne 764** : `.eq("created_by", userId)` → `.eq("owner_id", userId)` (pour tests)
- **Ligne 769** : `.eq("created_by", userId)` → `.eq("owner_id", userId)` (pour resources)

#### `src/lib/queries/admin.ts`
- Vérifier les usages de `creator_id` dans les queries

#### `supabase/migrations/000_admin_basics.sql`
- **Ligne 23** : `creator_id` → `owner_id` dans la table `courses`
- **Ligne 29** : Index `courses_creator_idx` → `courses_owner_idx`
- **Ligne 39** : `creator_id` → `owner_id` dans la table `paths`
- **Ligne 45** : Index `paths_creator_idx` → `paths_owner_idx`
- Toutes les policies RLS qui utilisent `creator_id`

#### `supabase/migrations/002_lms_tutor_builder_activity.sql`
- Vérifier les usages de `created_by` dans `tests` → utiliser `owner_id`

---

### 2. **Ajouter les colonnes manquantes à `courses` (si nécessaire)**

Si ces colonnes n'existent pas vraiment dans ta base :
- `slug` (text unique not null)
- `description` (text)
- `status` (text avec check)
- `builder_snapshot` (jsonb)

Elles sont déjà dans la migration 000, mais vérifie qu'elles existent vraiment.

---

### 3. **Mettre à jour les types TypeScript**

#### `src/types/database.ts`
- Remplacer `creator_id` par `owner_id` dans `Formation` et autres interfaces
- S'assurer que tous les types correspondent à la structure réelle

---

## 📝 Plan d'Action

### Étape 1 : Corriger le code frontend
1. Modifier `src/lib/queries/formateur.ts` (4 lignes)
2. Vérifier et modifier `src/lib/queries/admin.ts` si nécessaire
3. Vérifier `src/lib/queries/apprenant.ts` si nécessaire

### Étape 2 : Vérifier les colonnes de `courses`
- Exécuter une requête pour voir toutes les colonnes réelles
- Ajouter les colonnes manquantes si nécessaire via migration

### Étape 3 : Mettre à jour les types
- Modifier `src/types/database.ts` pour correspondre à la réalité

---

## ⚠️ Note Importante

**Les migrations 000 et 002 utilisent `creator_id`/`created_by`, mais ta base réelle utilise `owner_id`.**

**Options** :
1. **Option A (Recommandée)** : Modifier le code frontend pour utiliser `owner_id` (aligné avec ta base existante)
2. **Option B** : Modifier la base pour utiliser `creator_id` (nécessite une migration de renommage)

**Je recommande l'Option A** car :
- Ta base fonctionne déjà avec `owner_id`
- Moins de risques de casser l'existant
- Cohérent avec le reste de ta structure (tout utilise `owner_id`)

---

## 🔍 Vérifications Supplémentaires

1. **Table `resources`** : Vérifier si elle utilise `created_by` ou `owner_id`
2. **Table `paths`** : Vérifier si elle utilise `creator_id` ou `owner_id`
3. **Colonnes `slug`** : Vérifier si elles existent dans `courses`, `tests`, `paths`









