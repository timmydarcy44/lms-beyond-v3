# 🧹 Nettoyage Supabase - Guide sécurisé

## ⚠️ IMPORTANT

Ce guide vous permet de nettoyer des données obsolètes dans Supabase pour libérer des ressources. **Toutes les opérations sont réversibles si vous avez un backup**.

## 📋 Étapes à suivre

### 1. Faire un backup (OBLIGATOIRE)

Avant tout nettoyage, faites un backup de votre base de données :

1. Allez sur : https://supabase.com/dashboard/project/zmcefidiiqqppowymoxt/database/backups
2. Créez un backup manuel
3. Ou utilisez l'export SQL : Database → Backups → Download backup

### 2. Diagnostic (OBLIGATOIRE)

Exécutez d'abord le script de diagnostic pour voir ce qui peut être nettoyé :

1. Allez sur : https://supabase.com/dashboard/project/zmcefidiiqqppowymoxt/sql/new
2. Copiez-collez le contenu de `supabase/DIAGNOSTIC_NETTOYAGE.sql`
3. Exécutez le script
4. **Notez les résultats** pour voir combien d'éléments seront supprimés

### 3. Nettoyage (OPTIONNEL)

**⚠️ Ne faites cette étape que si le diagnostic montre des données nettoyables ET que vous avez fait un backup.**

1. Allez sur : https://supabase.com/dashboard/project/zmcefidiiqqppowymoxt/sql/new
2. Copiez-collez le contenu de `supabase/NETTOYAGE_SECURISE.sql`
3. **Relisez attentivement** ce qui sera supprimé
4. Exécutez le script

## 🗑️ Ce qui sera nettoyé (si vous exécutez NETTOYAGE_SECURISE.sql)

### Sécurisé (ne supprime que des données obsolètes) :

1. **Sessions auth** : Sessions de plus de 30 jours (sauf actives)
2. **Refresh tokens** : Tokens de plus de 30 jours
3. **Catalog items inactifs** : Items inactifs depuis plus de 180 jours
4. **Formations en brouillon** : Brouillons de plus de 180 jours (sauf ceux avec catalog_items)
5. **Tests en brouillon** : Brouillons de plus de 180 jours (sauf ceux avec catalog_items)
6. **Ressources en brouillon** : Brouillons de plus de 180 jours (sauf ceux avec catalog_items)
7. **Todos complétés** : Todos complétés depuis plus de 90 jours
8. **Interactions IA** : Logs de plus de 180 jours
9. **Flashcards non utilisés** : Flashcards jamais révisés depuis plus de 180 jours
10. **Rendez-vous passés** : Rendez-vous de plus de 180 jours
11. **Notifications** : Notifications de plus de 90 jours

### Ce qui NE sera PAS nettoyé (sécurisé) :

- ✅ Toutes les données actives
- ✅ Toutes les formations publiées
- ✅ Tous les catalog_items actifs
- ✅ Tous les utilisateurs et profils
- ✅ Toutes les données récentes (< 30-90 jours selon le type)

## 📊 Espace libéré

Après le nettoyage, vous devriez voir une réduction de la taille de la base de données. Le script affichera la taille avant et après.

## 🔄 Si vous avez besoin de restaurer

Si vous avez besoin de restaurer des données supprimées :
1. Allez sur : https://supabase.com/dashboard/project/zmcefidiiqqppowymoxt/database/backups
2. Restaurez le backup créé avant le nettoyage

## ⚠️ Recommandations

1. **Commencez par le diagnostic** : Ne nettoyez que si nécessaire
2. **Faites un backup** : Toujours avant de supprimer
3. **Testez en local** : Si possible, testez sur une copie locale d'abord
4. **Nettoyez progressivement** : Vous pouvez modifier les dates dans le script pour être plus conservateur




