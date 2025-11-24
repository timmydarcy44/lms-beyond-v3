# 🗄️ Guide de Migration de la Base de Données

## 📋 Vue d'Ensemble

Ce guide vous accompagne dans l'audit et la migration complète de votre base de données pour aligner la structure avec le code frontend.

---

## 🎯 Objectif

**Corriger toutes les incohérences entre :**
- La structure actuelle de la DB
- Ce que le code frontend attend
- Les meilleures pratiques pour la scalabilité

---

## 📊 Étape 1 : Audit Complet

### Fichier : `supabase/AUDIT_COMPLET_FINAL.sql`

**Ce que fait ce script :**
1. ✅ Liste toutes les tables et colonnes existantes
2. ✅ Identifie les colonnes manquantes dans :
   - `profiles` (email, full_name, first_name, last_name, phone, avatar_url)
   - `courses` (org_id, owner_id, cover_image, duration_minutes, etc.)
   - `paths` (org_id, owner_id, creator_id)
   - `resources` (org_id, created_by, kind, published, slug)
   - `tests` (org_id, creator_id, owner_id, published)
3. ✅ Identifie les tables manquantes :
   - `organizations`, `org_memberships`
   - `groups`, `group_members`
   - `content_assignments`
   - Tables analytics : `login_events`, `learning_sessions`, `course_progress`, `path_progress`, `resource_views`, `test_attempts`
   - Tables de liaison : `path_courses`, `path_tests`, `path_resources`
   - `super_admins`, `drive_documents`, `drive_folders`
4. ✅ Vérifie les incohérences :
   - `enrollments` : learner_id vs user_id
   - Colonnes de propriété : creator_id vs owner_id vs created_by
5. ✅ Vérifie les RLS policies
6. ✅ Vérifie les contraintes UNIQUE (pour UPSERT)

**Comment l'exécuter :**
1. Ouvrez **Supabase Studio** → **SQL Editor**
2. Copiez le contenu de `supabase/AUDIT_COMPLET_FINAL.sql`
3. Cliquez sur **Run** (ou `Ctrl+Enter`)
4. Analysez les résultats

---

## 🔧 Étape 2 : Migration Complète

### Fichier : `supabase/migrations/005_COMPLETE_DB_MIGRATION.sql`

**Ce que fait ce script :**

### 1. Colonnes Manquantes
- ✅ Ajoute toutes les colonnes manquantes dans `profiles`, `courses`, `paths`, `resources`, `tests`
- ✅ Synchronise les données existantes (copie depuis colonnes équivalentes)
- ✅ Remplit `email` depuis `auth.users`
- ✅ Crée les index nécessaires

### 2. Tables Manquantes
- ✅ Crée toutes les tables manquantes avec :
  - Clés primaires et foreign keys
  - Contraintes CHECK appropriées
  - Index pour les performances
  - Valeurs par défaut

### 3. Corrections d'Incohérences
- ✅ Corrige `enrollments` (learner_id vs user_id)
- ✅ Synchronise creator_id / owner_id / created_by

### 4. RLS
- ✅ Active RLS sur toutes les nouvelles tables

**Comment l'exécuter :**
1. **Sauvegardez votre DB** avant (optionnel mais recommandé)
2. Ouvrez **Supabase Studio** → **SQL Editor**
3. Copiez le contenu de `supabase/migrations/005_COMPLETE_DB_MIGRATION.sql`
4. Cliquez sur **Run** (ou `Ctrl+Enter`)
5. Vérifiez les messages de succès

---

## ⚠️ Points d'Attention

### 1. Enrollments (learner_id vs user_id)
**Problème** : Le code utilise parfois `learner_id`, parfois `user_id`

**Solution** : La migration :
- Crée `learner_id` si elle n'existe pas
- Copie les données depuis `user_id` si nécessaire
- Les deux colonnes peuvent coexister (mais `learner_id` est la référence)

### 2. Creator_id vs Owner_id
**Problème** : Plusieurs colonnes pour la même notion

**Solution** : La migration :
- Synchronise automatiquement `creator_id` avec `owner_id`
- Les deux existent pour compatibilité
- `creator_id` est la référence principale

### 3. Published vs Status
**Problème** : Certaines tables utilisent `published` (boolean), d'autres `status` (text)

**Solution** : La migration :
- Ajoute `published` si `status` existe
- Synchronise les valeurs : `status = 'published'` → `published = true`

---

## 📝 Tables Créées par la Migration

### Tables Organisationnelles
- ✅ `organizations` - Organisations
- ✅ `org_memberships` - Membres d'organisations
- ✅ `groups` - Groupes
- ✅ `group_members` - Membres de groupes
- ✅ `content_assignments` - Assignation de contenu

### Tables Analytics
- ✅ `login_events` - Événements de connexion
- ✅ `learning_sessions` - Sessions d'apprentissage
- ✅ `course_progress` - Progression dans les cours
- ✅ `path_progress` - Progression dans les parcours
- ✅ `resource_views` - Consultations de ressources
- ✅ `test_attempts` - Tentatives de tests

### Tables de Liaison
- ✅ `path_courses` - Cours dans un parcours
- ✅ `path_tests` - Tests dans un parcours
- ✅ `path_resources` - Ressources dans un parcours

### Tables Drive
- ✅ `drive_folders` - Dossiers du drive
- ✅ `drive_documents` - Documents du drive

### Tables Admin
- ✅ `super_admins` - Super administrateurs

---

## ✅ Checklist Post-Migration

Après avoir exécuté la migration, vérifiez :

- [ ] Toutes les colonnes sont créées (vérifier avec `AUDIT_COMPLET_FINAL.sql`)
- [ ] Toutes les tables sont créées
- [ ] Les index sont créés (vérifier dans Supabase Studio → Database → Indexes)
- [ ] Les foreign keys sont créées (vérifier dans Supabase Studio → Database → Foreign Keys)
- [ ] RLS est activé sur toutes les tables (vérifier dans Supabase Studio → Authentication → Policies)
- [ ] Les données existantes sont préservées

---

## 🚨 Si des Erreurs Surviennent

### Erreur : "column already exists"
**Cause** : La colonne existe déjà
**Solution** : Normal, la migration utilise `IF NOT EXISTS`, continuez

### Erreur : "constraint violation"
**Cause** : Données existantes ne respectent pas les contraintes
**Solution** : Vérifiez les données, corrigez-les manuellement si nécessaire

### Erreur : "foreign key violation"
**Cause** : Référence vers une table/colonne qui n'existe pas
**Solution** : Exécutez d'abord la création des tables référencées

---

## 🔄 Ordre d'Exécution Recommandé

1. **Exécuter `AUDIT_COMPLET_FINAL.sql`**
   - Comprendre l'état actuel
   - Identifier les problèmes

2. **Sauvegarder la DB** (via Supabase Dashboard)

3. **Exécuter `005_COMPLETE_DB_MIGRATION.sql`**
   - Appliquer toutes les corrections

4. **Ré-exécuter `AUDIT_COMPLET_FINAL.sql`**
   - Vérifier que tout est corrigé

5. **Tester l'application**
   - Vérifier que tout fonctionne

---

## 📊 Résultats Attendus

Après la migration :
- ✅ Toutes les colonnes manquantes sont ajoutées
- ✅ Toutes les tables manquantes sont créées
- ✅ Tous les index sont créés
- ✅ Les données existantes sont préservées
- ✅ Les incohérences sont corrigées
- ✅ RLS est activé partout

---

## 🎯 Prochaines Étapes Après Migration

1. **Configurer les RLS Policies détaillées** (si nécessaire)
2. **Migrer les données existantes** (si certaines colonnes sont vides)
3. **Tester toutes les fonctionnalités** de l'application
4. **Vérifier les performances** (index utilisés)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase Studio
2. Exécutez `AUDIT_COMPLET_FINAL.sql` pour identifier le problème exact
3. Corrigez manuellement si nécessaire

---

**Bonne migration ! 🚀**









