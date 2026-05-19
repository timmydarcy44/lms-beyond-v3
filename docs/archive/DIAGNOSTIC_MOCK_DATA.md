# 🔍 Diagnostic - Pourquoi je vois encore les données mock ?

## 🎯 Vérifications à Faire

### 1. Ouvrir la Console du Navigateur

1. **Ouvrez votre application** dans le navigateur
2. **Appuyez sur F12** (ou Clic droit → Inspecter)
3. **Allez dans l'onglet Console**
4. **Cherchez les messages** qui commencent par :
   - `[apprenant]`
   - `[formateur]`
   - `[admin]`
   - `[tuteur]`
   - `Supabase client unavailable`
   - `Supabase query failed`

### 2. Vérifier les Variables d'Environnement

Vérifiez que votre fichier `.env.local` contient bien :
```env
NEXT_PUBLIC_SUPABASE_URL=https://zmcefidiiqqppowymoxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_ici
```

**Important** : Redémarrez le serveur après modification de `.env.local` :
```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

### 3. Vérifier les Erreurs de Requêtes

Si vous voyez des erreurs dans la console comme :
- `column does not exist`
- `relation does not exist`
- `permission denied`

Cela signifie qu'il y a un problème avec les requêtes SQL.

## 🔧 Solutions Selon le Problème

### Problème A : "Supabase client unavailable"

**Solution** :
1. Vérifiez `.env.local` existe et contient les bonnes variables
2. Redémarrez le serveur : `npm run dev`

### Problème B : "column does not exist" ou erreurs SQL

**Solution** :
Les colonnes attendues n'existent pas. Exécutez dans Supabase Studio :

```sql
-- Vérifier les colonnes de courses
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('cover_image', 'modules_count', 'duration_minutes', 'category', 'status', 'slug');

-- Vérifier les colonnes de profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('email', 'full_name', 'display_name', 'role');
```

### Problème C : Aucune erreur, mais données vides

**C'est normal !** Vous voyez les données mock parce qu'il n'y a pas encore de données réelles dans votre base.

**Solution** : Créez des données de test ou attendez que des utilisateurs créent du contenu.

### Problème D : Requêtes qui échouent silencieusement

**Solution** : Vérifiez les logs Supabase :
1. Allez dans **Supabase Studio → Logs**
2. Regardez les erreurs SQL

## 📝 Test Rapide

Exécutez cette requête dans Supabase Studio pour vérifier qu'il y a des données :

```sql
-- Vérifier les cours
SELECT COUNT(*) as total_courses FROM courses;

-- Vérifier les profils
SELECT COUNT(*) as total_profiles, 
       COUNT(CASE WHEN role = 'instructor' THEN 1 END) as instructors,
       COUNT(CASE WHEN role = 'student' THEN 1 END) as students
FROM profiles;

-- Vérifier les enrollments
SELECT COUNT(*) as total_enrollments FROM enrollments;
```

## ✅ Si Tout Est OK Mais Toujours Mock

Si :
- ✅ Pas d'erreurs dans la console
- ✅ Variables d'environnement OK
- ✅ Serveur redémarré
- ✅ Mais toujours des données mock

Alors c'est probablement que **les requêtes retournent des tableaux vides**, et le code affiche les fallbacks quand les résultats sont vides (par design pour éviter les pages vides).

**C'est normal !** Il faut créer du contenu dans la base de données.




