# Diagnostic CMS - Problème "Page d'accueil"

## Problème
En cliquant sur "Page d'accueil" dans `/super/pages`, rien ne s'affiche.

## Causes possibles

### 1. La page n'existe pas dans la base de données
**Solution :** Exécuter les migrations SQL :
```sql
-- 1. Créer les tables
-- Exécuter : supabase/CREATE_CMS_PAGES_TABLE.sql

-- 2. Mettre à jour la structure pour support grille
-- Exécuter : supabase/UPDATE_CMS_STRUCTURE_FOR_GRID.sql

-- 3. Importer la landing page
-- Exécuter : supabase/IMPORT_LANDING_PAGE_AS_GRID.sql
```

### 2. Le contenu est vide ou mal formaté
**Vérification :** Aller sur `/super/pages/debug` pour voir les pages et leur contenu.

### 3. Erreur dans le chargement
**Vérification :** Ouvrir la console du navigateur (F12) et regarder les logs :
- `[edit-page] Page loaded:` - Vérifier que la page est chargée
- `[grid-page-builder] Initial page:` - Vérifier que les sections sont initialisées

## Actions de diagnostic

1. **Vérifier que la page existe :**
   - Aller sur `/super/pages`
   - Vérifier que "Page d'accueil - Beyond LMS" apparaît dans la liste

2. **Vérifier le contenu :**
   - Aller sur `/super/pages/debug`
   - Vérifier le format du `content` de la page landing

3. **Vérifier les logs :**
   - Ouvrir la console du navigateur
   - Cliquer sur "Éditer" sur la page
   - Regarder les logs `[edit-page]` et `[grid-page-builder]`

4. **Vérifier les erreurs :**
   - Regarder s'il y a des erreurs dans la console
   - Regarder s'il y a des erreurs dans l'onglet Network

## Solutions

### Si la page n'existe pas
Exécuter les migrations SQL dans l'ordre.

### Si le contenu est vide
La page sera créée avec une structure vide. Ajouter des sections depuis le builder.

### Si le format est incorrect
Le builder convertit automatiquement les formats legacy en grille. Si ça ne fonctionne pas, vérifier les logs.

## Page de debug

Une page de debug a été créée à `/super/pages/debug` pour inspecter :
- Toutes les pages dans la base
- Le format de leur contenu
- Les erreurs éventuelles



