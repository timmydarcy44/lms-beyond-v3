# 🔗 Instructions de Connexion Base de Données

## ✅ État Actuel

La connexion entre le frontend et Supabase est **déjà configurée**, mais nécessite quelques étapes avant d'être pleinement fonctionnelle.

### ✅ Ce qui est déjà en place :

1. **Clients Supabase** : Configuration complète (browser + server)
2. **Requêtes SQL** : Toutes les queries sont prêtes
3. **Mapping des rôles** : Système de conversion DB ↔ Frontend implémenté
4. **Migration de correction** : Fichier `003_fix_inconsistencies.sql` prêt

### ⚠️ Ce qui doit être fait :

## 📋 Étapes à Suivre

### 1. Configurer les Variables d'Environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role

# OpenAI (optionnel, pour les fonctionnalités IA)
OPENAI_API_KEY=votre_cle_openai
```

**Où trouver ces valeurs ?**
- Allez sur https://app.supabase.com
- Sélectionnez votre projet
- Settings → API
- Copiez l'URL et les clés

### 2. Exécuter les Migrations

La migration `003_fix_inconsistencies.sql` doit être exécutée pour :
- Ajouter les colonnes manquantes (`profiles`, `courses`)
- Créer les tables manquantes (`organizations`, `groups`, `drive_*`)
- Configurer les RLS policies

**Option A : Via Supabase Studio**
1. Ouvrez votre projet sur https://app.supabase.com
2. Allez dans SQL Editor
3. Collez le contenu de `supabase/migrations/003_fix_inconsistencies.sql`
4. Exécutez la requête

**Option B : Via CLI (si vous avez psql installé)**
```bash
psql "$DATABASE_URL" -f supabase/migrations/003_fix_inconsistencies.sql
```

**Important** : Assurez-vous d'exécuter les migrations dans l'ordre :
1. `000_admin_basics.sql`
2. `001_add_role_column.sql` (si existe)
3. `002_lms_tutor_builder_activity.sql` (si existe)
4. `003_fix_inconsistencies.sql`

### 3. Vérifier la Connexion

Après avoir configuré les variables et exécuté les migrations :

1. **Démarrez le serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Testez l'authentification** :
   - Allez sur `/login`
   - Créez un compte ou connectez-vous
   - Vérifiez que la session est bien récupérée

3. **Vérifiez les dashboards** :
   - `/dashboard` : Devrait afficher les données de la DB
   - `/dashboard/admin` : Devrait afficher les KPIs

### 4. Créer un Premier Utilisateur Admin (si nécessaire)

Si vous n'avez pas encore d'utilisateur admin :

1. Créez un compte normal via `/signup`
2. Dans Supabase Studio → Table Editor → `profiles`
3. Trouvez votre utilisateur et changez `role` à `"admin"`

Ou via SQL :
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'votre_user_id';
```

## 🔧 Corrections Appliquées

### ✅ Mapping des Rôles

Le fichier `src/lib/auth/session.ts` a été corrigé pour convertir automatiquement les rôles de la base de données (anglais) vers le frontend (français) :

- `student` (DB) → `apprenant` (Frontend)
- `instructor` (DB) → `formateur` (Frontend)
- `tutor` (DB) → `tuteur` (Frontend)
- `admin` (DB) → `admin` (Frontend)

**Les queries utilisent déjà les rôles anglais** (correct pour la DB), donc pas besoin de modifications supplémentaires.

## 🚨 Troubleshooting

### Erreur : "Supabase client unavailable"
- Vérifiez que `.env.local` existe et contient les bonnes variables
- Redémarrez le serveur de développement après avoir créé/modifié `.env.local`

### Erreur : "Unable to retrieve user profile"
- Vérifiez que la table `profiles` existe
- Vérifiez que la migration `003_fix_inconsistencies.sql` a été exécutée
- Vérifiez que les colonnes `email`, `full_name`, `avatar_url` existent dans `profiles`

### Erreur : "column does not exist"
- Exécutez la migration `003_fix_inconsistencies.sql` complètement
- Vérifiez que toutes les migrations précédentes ont été exécutées

### Les rôles ne fonctionnent pas
- Vérifiez que le rôle dans la DB est en anglais (`student`, `instructor`, etc.)
- Le mapping est automatique via `session.ts` (déjà corrigé)

## ✅ Checklist Finale

- [ ] Fichier `.env.local` créé avec les variables Supabase
- [ ] Toutes les migrations exécutées (dans l'ordre)
- [ ] Serveur redémarré après configuration
- [ ] Test de connexion réussi
- [ ] Test d'authentification réussi
- [ ] Test d'affichage des données réussi

## 🎉 Une fois tout configuré

Votre application sera pleinement connectée à Supabase et pourra :
- ✅ Gérer l'authentification
- ✅ Stocker/récupérer les données
- ✅ Respecter les RLS policies
- ✅ Afficher les dashboards avec les vraies données









