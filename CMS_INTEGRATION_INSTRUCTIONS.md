# Instructions d'intégration CMS

## Étape 1 : Exécuter les migrations SQL

Exécutez dans l'ordre :

1. **Créer les tables CMS** :
   ```sql
   -- Exécuter : supabase/CREATE_CMS_PAGES_TABLE.sql
   ```

2. **Importer la landing page existante** :
   ```sql
   -- Exécuter : supabase/IMPORT_LANDING_PAGE_TO_CMS.sql
   ```

## Étape 2 : Vérifier l'import

Après avoir exécuté les migrations, vous devriez voir :
- La page "landing" dans `/super/pages`
- La page est publiée (statut "Publiée")
- Vous pouvez la modifier via le builder

## Étape 3 : Accéder aux pages CMS

### Pour modifier une page :
- Aller sur `/super/pages`
- Cliquer sur "Éditer" sur la page souhaitée
- Utiliser le builder drag & drop

### Pour voir une page publique :
- Les pages publiées sont accessibles via `/pages/[slug]`
- Exemple : `/pages/landing` pour la landing page

## Structure des routes

- `/super/pages` - Liste des pages (Super Admin)
- `/super/pages/new` - Créer une nouvelle page
- `/super/pages/[pageId]/edit` - Éditer une page
- `/pages/[slug]` - Afficher une page publique (si publiée)

## Notes importantes

1. **La landing page actuelle** (`/landing`) continue de fonctionner avec les composants React existants
2. **Les pages CMS** sont accessibles via `/pages/[slug]`
3. **Pour remplacer la landing page** par une version CMS, vous devrez :
   - Modifier `/app/landing/page.tsx` pour charger depuis le CMS
   - Ou rediriger `/landing` vers `/pages/landing`

## Prochaines améliorations possibles

- [ ] Modifier `/landing` pour utiliser le CMS si une page existe
- [ ] Ajouter un système de templates
- [ ] Prévisualisation en temps réel
- [ ] Historique des versions







