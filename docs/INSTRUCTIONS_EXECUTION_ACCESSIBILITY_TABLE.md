# 🚀 Instructions d'Exécution - Table Préférences d'Accessibilité

## 📋 Script à Exécuter

**Fichier** : `supabase/CREATE_ACCESSIBILITY_PREFERENCES_TABLE.sql`

## ✅ Étapes d'Exécution

### 1. Ouvrir Supabase Studio

1. Allez sur **https://app.supabase.com**
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** (celui avec l'URL : `fqqqejpakbccwvrlolpc.supabase.co`)
4. Dans le menu de gauche, cliquez sur **SQL Editor** (icône `</>`)

### 2. Exécuter le Script

1. **Ouvrez le fichier** `supabase/CREATE_ACCESSIBILITY_PREFERENCES_TABLE.sql` dans votre éditeur local
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Retournez dans Supabase Studio → SQL Editor**
5. **Collez** le contenu dans l'éditeur SQL
6. **Cliquez sur "Run"** (en haut à droite) ou appuyez sur **Ctrl+Enter**
7. ✅ Vérifiez qu'il n'y a **pas d'erreur** (vous devriez voir "Success" en vert)

## 📊 Ce que le Script Crée

### Table
- ✅ `user_accessibility_preferences` - Stocke les préférences d'accessibilité de chaque utilisateur

### Colonnes
- `id` - UUID primaire
- `user_id` - Référence vers `auth.users`
- `dyslexia_mode_enabled` - Mode dyslexie activé/désactivé
- `letter_spacing` - Espacement des lettres (en em)
- `line_height` - Hauteur de ligne
- `word_spacing` - Espacement des mots (en em)
- `font_family` - Police de caractères choisie
- `contrast_level` - Niveau de contraste (normal, high, very-high)
- `highlight_confusing_letters` - Mettre en évidence les lettres confusantes
- `underline_complex_sounds` - Souligner les sons complexes
- `created_at` / `updated_at` - Métadonnées

### Fonctionnalités
- ✅ Index pour améliorer les performances
- ✅ Trigger automatique pour `updated_at`
- ✅ RLS (Row Level Security) configuré
- ✅ Politiques de sécurité : chaque utilisateur peut voir/modifier ses propres préférences
- ✅ Contrainte UNIQUE sur `user_id` (un seul enregistrement par utilisateur)

## 🔐 Sécurité

- **Les utilisateurs** peuvent :
  - Voir leurs propres préférences
  - Créer leurs propres préférences
  - Modifier leurs propres préférences

- **Les autres utilisateurs** ne peuvent **pas** accéder aux préférences d'autrui

## ✅ Vérification

Après exécution, vous pouvez vérifier que la table existe :

```sql
-- Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_accessibility_preferences';

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_accessibility_preferences'
ORDER BY ordinal_position;
```

## 🎯 Prochaines Étapes

Une fois la table créée, les fonctionnalités suivantes seront disponibles :

1. ✅ **Mode dyslexie** - Les utilisateurs peuvent activer/désactiver le mode
2. ✅ **Palette technique** - Réglages personnalisés (espacement, police, contraste, etc.)
3. ✅ **Méthode Pomodoro** - Timer pour gérer les sessions de travail
4. ✅ **Sauvegarde automatique** - Les préférences sont sauvegardées dans Supabase



