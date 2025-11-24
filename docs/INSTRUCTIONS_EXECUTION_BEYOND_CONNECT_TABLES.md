# 🚀 Instructions d'Exécution - Tables Beyond Connect

## 📋 Scripts à Exécuter

**Ordre d'exécution :**
1. `supabase/CREATE_BEYOND_CONNECT_COMPLETE.sql` (création de toutes les tables)
2. `supabase/ADD_JOB_OFFER_FIELDS.sql` (ajout des colonnes manquantes)

## ✅ Étapes d'Exécution

### 1. Ouvrir Supabase Studio

1. Allez sur **https://app.supabase.com**
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** (celui avec l'URL : `fqqqejpakbccwvrlolpc.supabase.co`)
4. Dans le menu de gauche, cliquez sur **SQL Editor** (icône `</>`)

### 2. Exécuter le Script Principal

1. **Ouvrez le fichier** `supabase/CREATE_BEYOND_CONNECT_COMPLETE.sql` dans votre éditeur local
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Retournez dans Supabase Studio → SQL Editor**
5. **Collez** le contenu dans l'éditeur SQL
6. **Cliquez sur "Run"** (en haut à droite) ou appuyez sur **Ctrl+Enter**
7. ✅ Vérifiez qu'il n'y a **pas d'erreur** (vous devriez voir "Success" en vert)

**⚠️ Note :** Ce script est long et peut prendre quelques secondes à s'exécuter.

### 3. Exécuter le Script d'Ajout de Colonnes

1. **Ouvrez le fichier** `supabase/ADD_JOB_OFFER_FIELDS.sql` dans votre éditeur local
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Retournez dans Supabase Studio → SQL Editor**
5. **Effacez** le contenu précédent (ou créez un nouvel onglet)
6. **Collez** le nouveau contenu
7. **Cliquez sur "Run"** (en haut à droite) ou appuyez sur **Ctrl+Enter**
8. ✅ Vérifiez qu'il n'y a **pas d'erreur**

## 📊 Ce que les Scripts Créent

### Tables Principales
- ✅ `beyond_connect_experiences` - Expériences professionnelles
- ✅ `beyond_connect_education` - Diplômes et formations
- ✅ `beyond_connect_skills` - Compétences
- ✅ `beyond_connect_certifications` - Certifications
- ✅ `beyond_connect_projects` - Projets/portfolios
- ✅ `beyond_connect_languages` - Langues
- ✅ `beyond_connect_companies` - Entreprises
- ✅ `beyond_connect_job_offers` - Offres d'emploi
- ✅ `beyond_connect_applications` - Candidatures
- ✅ `beyond_connect_cv_library` - CVthèque
- ✅ `beyond_connect_matches` - Matchings (premium)
- ✅ `beyond_connect_profile_settings` - Paramètres de visibilité

### Vues
- ✅ `beyond_connect_user_badges` - Badges des utilisateurs
- ✅ `beyond_connect_test_results` - Résultats de tests
- ✅ `beyond_connect_user_profiles` - Profils complets

### Colonnes Ajoutées
- ✅ `hours_per_week` dans `beyond_connect_job_offers`
- ✅ `required_soft_skills` dans `beyond_connect_job_offers`

## 🔐 Sécurité

- **RLS (Row Level Security)** est activé sur toutes les tables
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Les entreprises peuvent voir les offres d'emploi publiques et gérer leurs propres offres

## ✅ Vérification

Après exécution, vous pouvez vérifier que les tables existent :

```sql
-- Vérifier les tables Beyond Connect
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'beyond_connect_%'
ORDER BY table_name;
```

Vous devriez voir toutes les tables listées ci-dessus.

## 🐛 Problèmes Courants

### Erreur : "relation already exists"
- C'est normal si vous avez déjà exécuté le script. Les tables existent déjà.
- Vous pouvez ignorer cette erreur ou utiliser `DROP TABLE IF EXISTS` avant de recréer.

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté avec un compte ayant les droits d'administration sur Supabase.

### Les tables n'apparaissent pas dans l'API
- Attendez quelques secondes après l'exécution du script.
- Rafraîchissez la page de l'application.
- Vérifiez que vous avez bien exécuté les deux scripts dans l'ordre.


