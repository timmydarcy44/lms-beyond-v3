# 🔍 Audit de Cohérence Front/Back LMS

## ✅ Points Cohérents

1. **Tables principales** : `courses`, `paths`, `resources`, `tests`, `enrollments`, `badges` sont bien définies
2. **RLS policies** : Correctement configurées pour la plupart des tables
3. **Structure de base** : Les tables essentielles existent

---

## 🚨 Incohérences Critiques

### 1. **Mapping des Rôles (CRITIQUE)**

**SQL** (migrations) :
- `'student'`, `'instructor'`, `'admin'`, `'tutor'`

**TypeScript** (`src/types/database.ts`) :
- `"formateur"`, `"apprenant"`, `"admin"`, `"tuteur"`

**Impact** : Les vérifications de rôles dans les requêtes ne fonctionneront jamais.

**Localisation** :
- `src/lib/queries/admin.ts:230` : `.eq("role", "student")`
- `src/lib/auth/session.ts:41` : `role: profile.role as UserRole`

---

### 2. **Colonnes Manquantes dans `profiles` (CRITIQUE)**

**SQL actuel** :
```sql
- id uuid
- role text
- display_name text
- created_at timestamptz
```

**Attendu par le code** :
- `email` (utilisé dans `session.ts:30`)
- `full_name` (utilisé dans `session.ts:30`, `admin.ts:310`)
- `first_name` (utilisé dans `admin.ts:310`, `actions.ts`)
- `last_name` (utilisé dans `admin.ts:310`, `actions.ts`)
- `phone` (utilisé dans `actions.ts`)
- `avatar_url` (utilisé dans `session.ts:30`)

**Fichiers concernés** :
- `src/lib/auth/session.ts:30`
- `src/lib/queries/admin.ts:310`
- `src/app/admin/apprenants/new/actions.ts:90-105`

---

### 3. **Tables Manquantes (CRITIQUE)**

**Utilisées dans le code mais absentes des migrations** :

#### a) `organizations`
- Utilisé dans : `src/lib/queries/admin.ts:434`, `src/app/admin/apprenants/new/actions.ts:105`

#### b) `org_memberships`
- Utilisé dans : `src/lib/queries/admin.ts:314`, `src/app/admin/apprenants/new/actions.ts:105`

#### c) `groups`
- Utilisé dans : `src/lib/queries/admin.ts:380`, `src/app/admin/groupes/new/actions.ts:69`

#### d) `group_members`
- Utilisé dans : `src/lib/queries/admin.ts:319`, `src/app/admin/apprenants/new/actions.ts:122`

#### e) `drive_documents`, `drive_consigne`, `drive_folders`
- Utilisé dans : `src/lib/queries/formateur.ts:826`, `src/components/formateur/drive/`

**Note** : Il existe peut-être une migration `001_drive_and_groups.sql` non trouvée.

---

### 4. **Colonnes Manquantes dans `courses`**

**SQL actuel** :
```sql
- id, slug, title, description, status, creator_id, builder_snapshot, created_at, updated_at
```

**Attendu par le code** :
- `cover_image` (utilisé dans `formateur.ts:200`, `apprenant.ts:338`)
- `modules_count` (utilisé dans `apprenant.ts:338`)
- `duration_minutes` (utilisé dans `apprenant.ts:338`, `formateur.ts:767`)
- `duration_label` (utilisé dans `formateur.ts:758`)
- `category` (utilisé dans `apprenant.ts:338`)

---

### 5. **Colonnes Manquantes dans `tests`**

**SQL actuel** (+ ajouts 002) :
```sql
- id, slug, title, description, status, kind, duration_minutes, created_by, created_at, updated_at
- hero_image, difficulty, builder_snapshot, is_ai_enabled (ajoutées dans 002)
```

**Attendu par le code** :
- `hero_image` ✅ (ajouté dans 002)
- Toutes les autres colonnes semblent OK

---

### 6. **Structure `flashcards`**

**SQL** : Table existe dans `000_admin_basics.sql` (ligne 154+ probablement)

**TypeScript** : `src/types/database.ts:32-38` définit bien `Flashcard`

**Vérifier** : Si la table `flashcards` existe vraiment dans la migration (pas visible dans le fichier lu).

---

### 7. **Nommage Incohérent : `test_attempts` vs `test_sessions`**

**SQL** :
- `test_attempts` (table existante dans 000)
- `test_sessions` (table ajoutée dans 002)

**Code frontend** :
- `use-test-sessions.ts` utilise probablement `test_sessions` ✅
- Mais attention à la confusion entre les deux tables

---

## 🔧 Actions Requises

### Priorité 1 : FIXES IMMÉDIATS

1. **Corriger le mapping des rôles** :
   - Option A : Modifier SQL pour utiliser les valeurs françaises
   - Option B : Modifier TypeScript pour utiliser les valeurs anglaises
   - **Recommandation** : Option B (valeurs anglaises en DB)

2. **Ajouter les colonnes manquantes à `profiles`** :
   ```sql
   ALTER TABLE profiles 
     ADD COLUMN IF NOT EXISTS email text,
     ADD COLUMN IF NOT EXISTS full_name text,
     ADD COLUMN IF NOT EXISTS first_name text,
     ADD COLUMN IF NOT EXISTS last_name text,
     ADD COLUMN IF NOT EXISTS phone text,
     ADD COLUMN IF NOT EXISTS avatar_url text;
   ```

3. **Créer les tables manquantes** : `organizations`, `org_memberships`, `groups`, `group_members`, `drive_*`

4. **Ajouter les colonnes manquantes à `courses`** :
   ```sql
   ALTER TABLE courses 
     ADD COLUMN IF NOT EXISTS cover_image text,
     ADD COLUMN IF NOT EXISTS modules_count integer DEFAULT 0,
     ADD COLUMN IF NOT EXISTS duration_minutes integer,
     ADD COLUMN IF NOT EXISTS duration_label text,
     ADD COLUMN IF NOT EXISTS category text;
   ```

### Priorité 2 : VÉRIFICATIONS

5. Vérifier si `001_drive_and_groups.sql` existe
6. Vérifier si la table `flashcards` existe dans la migration
7. Clarifier la différence entre `test_attempts` et `test_sessions`

---

## 📊 Récapitulatif

| Problème | Priorité | Impact | Fichiers Affectés |
|----------|----------|--------|-------------------|
| Mapping rôles | 🔴 CRITIQUE | Bloque l'authentification | `auth/session.ts`, `queries/admin.ts` |
| Colonnes `profiles` | 🔴 CRITIQUE | Bloque les requêtes de session | `auth/session.ts`, `queries/admin.ts`, `actions.ts` |
| Tables manquantes | 🔴 CRITIQUE | Bloque admin/groups/drive | `queries/admin.ts`, `queries/formateur.ts`, `actions.ts` |
| Colonnes `courses` | 🟡 HAUTE | Bloque l'affichage | `queries/formateur.ts`, `queries/apprenant.ts` |
| `test_attempts` vs `test_sessions` | 🟡 MOYENNE | Confusion potentielle | `use-test-sessions.ts` |

---

## ✅ Recommandations Finales

1. ✅ **Migration `003_fix_inconsistencies.sql` créée** :
   - Ajoute toutes les colonnes manquantes à `profiles` et `courses`
   - Crée les tables manquantes (`organizations`, `org_memberships`, `groups`, `group_members`, `drive_*`)
   - Crée la table `flashcards` si elle n'existe pas
   - Configure toutes les RLS policies

2. ⚠️ **À faire** : Mettre à jour les types TypeScript dans `src/types/database.ts` pour refléter la structure réelle

3. ⚠️ **À faire** : Créer des fonctions de mapping pour convertir entre rôles français/anglais :
   - Le code frontend utilise `"formateur"`, `"apprenant"`, `"tuteur"`
   - La DB utilise `"instructor"`, `"student"`, `"tutor"`
   - Il faut mapper : `formateur` → `instructor`, `apprenant` → `student`, `tuteur` → `tutor`

4. ⚠️ **À faire** : Exécuter la migration `003_fix_inconsistencies.sql`

---

## 📝 Prochaines Étapes

### Étape 1 : Exécuter la migration
```bash
psql "$DATABASE_URL" -f supabase/migrations/003_fix_inconsistencies.sql
```

### Étape 2 : Créer un helper de mapping des rôles
Créer `src/lib/utils/role-mapping.ts` pour mapper entre les rôles français (frontend) et anglais (DB).

### Étape 3 : Mettre à jour les requêtes
Adapter les requêtes qui utilisent directement les rôles pour utiliser le mapping.

### Étape 4 : Tester la connexion
Vérifier que toutes les requêtes fonctionnent correctement avec la nouvelle structure.

