# 📋 Plan de Correction de la Structure de la Base

## 🔴 INCOHÉRENCES CRITIQUES IDENTIFIÉES

### 1. **ENROLLMENTS - Problème Principal**

**État actuel :**
- ✅ Colonne `learner_id` : **NOT NULL** + Foreign Key vers `profiles.id`
- ⚠️ Colonne `user_id` : **NULLABLE** (alias ajouté par migration 004)
- ❌ Clé primaire : `id` (UUID simple, pas composite)
- ❌ Policy RLS : `enrollments_instructor_assign` utilise `enrollments.user_id` mais la table utilise `learner_id`

**Problème :**
- Le code insère avec `learner_id` ✅
- Mais la policy RLS vérifie `enrollments.user_id` ❌
- La clé primaire est sur `id`, donc l'upsert ne peut pas utiliser une contrainte composite

**Solution recommandée :**
1. Corriger la policy RLS pour utiliser `learner_id` au lieu de `user_id`
2. Garder `user_id` comme colonne de synchronisation (alias) pour compatibilité frontend
3. Créer une contrainte UNIQUE sur `(learner_id, course_id)` pour permettre les upserts

---

### 2. **COLONNES DE PROPRIÉTÉ - Incohérences**

**État actuel :**

| Table | Colonnes de propriété |
|-------|----------------------|
| `courses` | `creator_id` + `owner_id` |
| `paths` | `creator_id` + `owner_id` |
| `resources` | `created_by` + `owner_id` |
| `tests` | `created_by` + `owner_id` |

**Problème :**
- Mélange entre `creator_id`/`created_by` et `owner_id`
- Les policies RLS utilisent parfois l'un, parfois l'autre
- Le code frontend doit gérer plusieurs colonnes

**Solution recommandée :**
**Option A (Préférée)** : Standardiser sur `owner_id` partout
- `courses` : Garder `owner_id`, `creator_id` comme alias synchronisé
- `paths` : Garder `owner_id`, `creator_id` comme alias synchronisé
- `resources` : Synchroniser `created_by` → `owner_id`
- `tests` : Synchroniser `created_by` → `owner_id`

**Option B** : Standardiser sur `creator_id` + `owner_id` partout
- Plus complexe, nécessite plus de migrations

---

## 📝 ACTIONS DE CORRECTION

### Étape 1 : Corriger ENROLLMENTS

#### 1.1. Corriger la policy RLS
- Modifier `enrollments_instructor_assign` pour utiliser `learner_id`
- Créer script : `FIX_ENROLLMENTS_RLS_POLICY_V2.sql`

#### 1.2. Ajouter contrainte UNIQUE pour upsert
- Créer contrainte UNIQUE sur `(learner_id, course_id)`
- Permettra les upserts sans spécifier `onConflict`

---

### Étape 2 : Uniformiser les colonnes de propriété

#### 2.1. Synchroniser `created_by` → `owner_id` pour resources et tests
- Créer trigger pour synchroniser automatiquement
- Mettre à jour les policies RLS pour utiliser `owner_id` principalement

#### 2.2. Garder `creator_id` comme alias pour courses et paths
- Les triggers existants devraient déjà gérer ça

---

### Étape 3 : Mettre à jour le code frontend

#### 3.1. Actions serveur
- ✅ Déjà corrigé pour utiliser `learner_id` dans `enrollments`
- ⚠️ Vérifier que les queries utilisent les bonnes colonnes de propriété

#### 3.2. Queries
- Standardiser sur `owner_id` pour courses, paths
- Standardiser sur `owner_id` pour resources, tests (au lieu de `created_by`)

---

## ✅ PRIORITÉS

**URGENT (Bloque les fonctionnalités) :**
1. ✅ Corriger policy `enrollments_instructor_assign` pour utiliser `learner_id`
2. ✅ Ajouter contrainte UNIQUE `(learner_id, course_id)` sur `enrollments`

**IMPORTANT (Améliore la cohérence) :**
3. Synchroniser `created_by` → `owner_id` pour resources et tests
4. Uniformiser les policies RLS pour utiliser `owner_id`

**NICE TO HAVE :**
5. Nettoyer les colonnes `user_id` si non utilisées ailleurs
6. Documenter la structure finale

---

## 🚀 PROCHAINES ÉTAPES

1. Créer `FIX_ENROLLMENTS_COMPLETE.sql` :
   - Corriger la policy RLS
   - Ajouter contrainte UNIQUE
   - Synchroniser `user_id` avec `learner_id` si nécessaire

2. Créer `SYNC_OWNERSHIP_COLUMNS.sql` :
   - Créer triggers pour synchroniser `created_by` → `owner_id`
   - Mettre à jour les policies pour utiliser `owner_id`

3. Tester après chaque correction




