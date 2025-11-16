# ✅ Checklist Post-Migration

## 🎯 Objectif
Vérifier que toutes les corrections ont été appliquées avec succès.

---

## 📋 Vérifications à Effectuer

### 1. ✅ Colonnes Ajoutées

#### **COURSES**
- [ ] `org_id` existe et a un index
- [ ] `created_by` existe et a un index
- [ ] `created_by` est synchronisé avec `creator_id` (si `creator_id` existe)

#### **PATHS**
- [ ] `org_id` existe et a un index

#### **RESOURCES**
- [ ] `slug` existe et a un index
- [ ] `status` existe
- [ ] `status` est synchronisé avec `published` (si `published` existe)

#### **TESTS**
- [ ] `creator_id` existe et a un index
- [ ] `creator_id` est synchronisé avec `created_by` (si `created_by` existe)

---

### 2. ✅ Table Créée

#### **LEARNING_SESSIONS**
- [ ] La table `learning_sessions` existe
- [ ] Toutes les colonnes sont présentes :
  - `id` (uuid, PRIMARY KEY)
  - `user_id` (uuid, NOT NULL)
  - `course_id` (uuid, nullable)
  - `path_id` (uuid, nullable)
  - `duration_minutes` (integer)
  - `active_duration_minutes` (integer)
  - `created_at` (timestamptz)
  - `ended_at` (timestamptz)
- [ ] Les index sont créés :
  - `learning_sessions_user_id_idx`
  - `learning_sessions_course_id_idx`
  - `learning_sessions_path_id_idx`
  - `learning_sessions_created_at_idx`
- [ ] RLS est activé

---

### 3. ✅ Index Créés

Vérifier que les index suivants existent :

- [ ] `courses_org_id_idx`
- [ ] `courses_created_by_idx`
- [ ] `paths_org_id_idx`
- [ ] `resources_slug_idx`
- [ ] `tests_creator_id_idx`

---

### 4. ✅ Synchronisation des Données

#### **ENROLLMENTS**
- [ ] `learner_id` et `user_id` sont synchronisés
- [ ] Pas de `user_id IS NULL` alors que `learner_id` existe

#### **COURSES**
- [ ] `created_by` est copié depuis `creator_id` (où `created_by IS NULL`)

#### **TESTS**
- [ ] `creator_id` est copié depuis `created_by` (où `creator_id IS NULL`)

#### **RESOURCES**
- [ ] `status` est synchronisé avec `published`
- [ ] Les slugs sont générés (où `slug IS NULL`)

---

## 🧪 Tests Fonctionnels

### 1. **Super Admin Dashboard**
- [ ] La page `/super` se charge sans erreur
- [ ] Les statistiques s'affichent correctement
- [ ] Les requêtes utilisant `org_id` fonctionnent

### 2. **Formateur Dashboard**
- [ ] La page `/dashboard/formateur` se charge sans erreur
- [ ] Les formations s'affichent avec leur `org_id`
- [ ] Les filtres par organisation fonctionnent

### 3. **Ressources**
- [ ] Les ressources peuvent être créées avec `slug` et `status`
- [ ] Les requêtes utilisant `slug` fonctionnent
- [ ] Les requêtes utilisant `status` fonctionnent

### 4. **Tests**
- [ ] Les tests peuvent être créés avec `creator_id`
- [ ] Les requêtes utilisant `creator_id` fonctionnent

### 5. **Learning Sessions**
- [ ] La table `learning_sessions` est accessible
- [ ] Les requêtes analytics dans `super-admin.ts` fonctionnent

---

## 🔍 Script de Vérification

Exécuter le script `supabase/VERIFY_MIGRATION_SUCCESS.sql` dans Supabase Studio.

**Résultats attendus** :
- ✅ Toutes les colonnes doivent être marquées comme "existe"
- ✅ Tous les index doivent être présents
- ✅ La table `learning_sessions` doit être créée
- ✅ Les données doivent être synchronisées (0 incohérences)

---

## 🚨 Problèmes Potentiels

### Si des colonnes sont toujours manquantes :
1. Vérifier les logs d'erreur dans Supabase Studio
2. Exécuter manuellement les `ALTER TABLE` manquants
3. Vérifier les permissions (RLS peut bloquer certaines opérations)

### Si les index ne sont pas créés :
1. Créer manuellement les index manquants :
   ```sql
   CREATE INDEX IF NOT EXISTS courses_org_id_idx ON courses (org_id);
   ```

### Si les données ne sont pas synchronisées :
1. Exécuter les `UPDATE` manuellement pour synchroniser
2. Vérifier les contraintes qui peuvent bloquer

---

## ✅ Validation Finale

Une fois toutes les vérifications effectuées :

- [ ] Toutes les colonnes sont présentes
- [ ] Toutes les tables sont créées
- [ ] Tous les index sont créés
- [ ] Les données sont synchronisées
- [ ] L'application fonctionne correctement
- [ ] Aucune erreur dans les logs

**🎉 Migration complète et validée !**

---

## 📝 Notes

- Les scripts utilisent `IF NOT EXISTS`, donc ils peuvent être ré-exécutés sans risque
- Les données existantes sont préservées (seules les nouvelles colonnes sont ajoutées)
- Les synchronisations se font automatiquement lors de la migration




