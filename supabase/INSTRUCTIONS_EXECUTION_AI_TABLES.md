# 🚀 Instructions d'Exécution - Tables IA

## 📋 Script à Exécuter

**Fichier** : `supabase/CREATE_AI_PROMPTS_AND_HISTORY_TABLES.sql`

## ✅ Étapes d'Exécution

### 1. Ouvrir Supabase Studio

1. Allez sur **https://app.supabase.com**
2. **Connectez-vous** à votre compte
3. **Sélectionnez votre projet** (celui avec l'URL : `fqqqejpakbccwvrlolpc.supabase.co`)
4. Dans le menu de gauche, cliquez sur **SQL Editor** (icône `</>`)

### 2. Exécuter le Script

1. **Ouvrez le fichier** `supabase/CREATE_AI_PROMPTS_AND_HISTORY_TABLES.sql` dans votre éditeur local
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Retournez dans Supabase Studio → SQL Editor**
5. **Collez** le contenu dans l'éditeur SQL
6. **Cliquez sur "Run"** (en haut à droite) ou appuyez sur **Ctrl+Enter**
7. ✅ Vérifiez qu'il n'y a **pas d'erreur** (vous devriez voir "Success" en vert)

## 📊 Ce que le Script Crée

### Tables
- ✅ `ai_prompts` - Stocke les prompts personnalisés pour chaque fonctionnalité IA
- ✅ `ai_interactions` - Historique de toutes les interactions avec l'IA

### Fonctionnalités
- ✅ Index pour améliorer les performances
- ✅ Trigger automatique pour `updated_at`
- ✅ RLS (Row Level Security) configuré
- ✅ Politiques de sécurité pour Super Admin uniquement
- ✅ Prompts par défaut insérés

## 🔐 Sécurité

- **Seuls les Super Admins** (comme `timdarcypro@gmail.com`) peuvent :
  - Modifier les prompts IA
  - Consulter l'historique complet des interactions

- **Les utilisateurs** peuvent :
  - Voir leurs propres interactions
  - Insérer leurs propres interactions (automatique via les routes API)

## ✅ Vérification

Après exécution, vous pouvez vérifier que les tables existent :

```sql
-- Vérifier les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_prompts', 'ai_interactions');

-- Vérifier les prompts par défaut
SELECT feature_id, feature_name, endpoint 
FROM ai_prompts;
```

## 🎯 Prochaines Étapes

Une fois le script exécuté :

1. ✅ Les routes API IA utiliseront automatiquement les prompts personnalisés
2. ✅ Toutes les interactions IA seront enregistrées dans l'historique
3. ✅ Vous pourrez modifier les prompts depuis `/admin/super/ia`
4. ✅ Vous pourrez consulter l'historique depuis `/admin/super/ia` → Onglet "Historique"

---

**Note** : Si vous avez déjà exécuté ce script et obtenez une erreur de duplication, c'est normal. Le script utilise `DROP POLICY IF EXISTS` et `ON CONFLICT DO NOTHING` pour éviter les erreurs.


