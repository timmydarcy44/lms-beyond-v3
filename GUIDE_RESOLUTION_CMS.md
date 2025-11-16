# Guide de résolution - Problème CMS "Page d'accueil"

## Problème
En cliquant sur "Page d'accueil" dans `/super/pages`, rien ne s'affiche ou la page est vide.

## Solution étape par étape

### Étape 1 : Vérifier que la page existe

1. Aller sur `/super/pages`
2. Vérifier si "Page d'accueil - Beyond LMS" apparaît dans la liste
3. Si elle n'apparaît pas → Passer à l'étape 2
4. Si elle apparaît → Passer à l'étape 3

### Étape 2 : Créer la page (si elle n'existe pas)

Exécuter les migrations SQL dans l'ordre :

```sql
-- 1. Créer les tables CMS
-- Exécuter dans Supabase SQL Editor : supabase/CREATE_CMS_PAGES_TABLE.sql

-- 2. Ajouter le support de la grille
-- Exécuter : supabase/UPDATE_CMS_STRUCTURE_FOR_GRID.sql

-- 3. Importer la landing page avec structure de grille
-- Exécuter : supabase/IMPORT_LANDING_PAGE_AS_GRID.sql
```

**Comment exécuter :**
1. Aller sur votre projet Supabase
2. Ouvrir "SQL Editor"
3. Copier-coller le contenu de chaque fichier SQL
4. Cliquer sur "Run"

### Étape 3 : Vérifier le contenu de la page

1. Aller sur `/super/pages/debug` (page de diagnostic)
2. Vérifier que la page "landing" apparaît
3. Vérifier le format du contenu :
   - Si `content` est `null` ou `[]` → La page est vide
   - Si `content` contient des sections → Tout est OK

### Étape 4 : Tester l'édition

1. Aller sur `/super/pages`
2. Cliquer sur l'icône "Éditer" (crayon) sur "Page d'accueil"
3. Vous devriez voir :
   - Sidebar gauche avec les outils
   - Zone centrale avec la prévisualisation
   - Si aucune section : message "Aucune section" avec bouton pour en ajouter

### Étape 5 : Si la page est vide

Si la page existe mais est vide :

1. Dans le builder, cliquer sur "Ajouter une section" (bouton dans la zone de prévisualisation)
2. Ou utiliser les boutons de layout dans la sidebar (1, 2, 3 colonnes)
3. Ajouter des blocs (H1, Texte, Image, etc.) dans les colonnes

## Diagnostic avancé

### Vérifier les logs

1. Ouvrir la console du navigateur (F12)
2. Aller sur `/super/pages/[pageId]/edit`
3. Regarder les logs :
   - `[edit-page] Page loaded:` - Doit afficher les infos de la page
   - `[grid-page-builder] Initial page:` - Doit afficher le contenu chargé

### Erreurs courantes

**Erreur : "Page not found"**
- La page n'existe pas dans la base
- Solution : Exécuter les migrations SQL

**Erreur : "content is null"**
- Le contenu n'a pas été initialisé
- Solution : La page sera vide, ajouter des sections

**Erreur : "content_type is undefined"**
- La colonne `content_type` n'existe pas
- Solution : Exécuter `UPDATE_CMS_STRUCTURE_FOR_GRID.sql`

## Structure attendue

Une page avec structure de grille doit avoir :
```json
{
  "id": "...",
  "slug": "landing",
  "title": "Page d'accueil - Beyond LMS",
  "content_type": "grid",
  "content": [
    {
      "id": "section-...",
      "type": "section",
      "layout": "1",
      "columns": [...],
      "styles": {...}
    }
  ]
}
```

## Contact

Si le problème persiste après avoir suivi ces étapes :
1. Vérifier les logs dans la console
2. Vérifier la page `/super/pages/debug`
3. Vérifier que les migrations SQL ont bien été exécutées



