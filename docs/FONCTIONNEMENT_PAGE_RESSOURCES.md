# Fonctionnement de la page Ressources

## Architecture

La page ressources est composée de **2 fichiers** :

### 1. `src/app/jessica-contentin/ressources/page.tsx` (Server Component)
**Rôle** : Récupère les données côté serveur

**Ce qu'elle fait** :
1. Récupère l'ID de Jessica Contentin depuis la table `profiles` (email: `contentin.cabinet@gmail.com` ou UUID: `17364229-fe78-4986-ac69-41b880e34631`)
2. Fait une requête directe à Supabase pour vérifier les items dans `catalog_items` :
   ```sql
   SELECT * FROM catalog_items 
   WHERE creator_id = '17364229-fe78-4986-ac69-41b880e34631' 
   AND is_active = true
   ```
3. Appelle `getCatalogItems()` avec le `superAdminId` de Jessica Contentin
4. Filtre les items pour ne garder que ceux de Jessica Contentin
5. Passe les items à `RessourcesPageClient` via la prop `initialItems`

**Logs de debug** :
- `[RessourcesPage] Direct query result:` - Résultat de la requête directe
- `[RessourcesPage] getCatalogItems result:` - Résultat de `getCatalogItems()`
- `[RessourcesPage] Final filtered items count:` - Nombre final d'items

### 2. `src/app/jessica-contentin/ressources/page-client.tsx` (Client Component)
**Rôle** : Affiche l'interface utilisateur

**Ce qu'elle fait** :
1. Reçoit `initialItems` en props
2. Met à jour `catalogItems` avec `initialItems` via `useState` et `useEffect`
3. Groupe les items par catégorie
4. Affiche les items dans des sliders horizontaux (style Netflix)
5. Gère les animations et interactions

**Logs de debug** :
- `[RessourcesPageClient] Items updated:` - Nombre d'items reçus

## Flux de données

```
1. Utilisateur visite /jessica-contentin/ressources
   ↓
2. page.tsx (Server Component) s'exécute
   ↓
3. Récupère l'ID de Jessica Contentin
   ↓
4. Requête directe à catalog_items (pour debug)
   ↓
5. Appelle getCatalogItems(superAdminId)
   ↓
6. Filtre les items par creator_id
   ↓
7. Passe initialItems à RessourcesPageClient
   ↓
8. page-client.tsx (Client Component) s'affiche
   ↓
9. Affiche les items dans des sliders par catégorie
```

## Pourquoi les ressources ne s'affichent pas ?

### Causes possibles :

1. **`initialItems` est vide** :
   - Vérifier les logs `[RessourcesPage] Final filtered items count:`
   - Si 0, vérifier que les items ont bien `creator_id = 17364229-fe78-4986-ac69-41b880e34631`
   - Vérifier que `is_active = true`

2. **Problème d'hydratation** :
   - Les items sont chargés côté serveur mais pas transmis au client
   - Vérifier les logs `[RessourcesPageClient] Items updated:`

3. **Problème de catégories** :
   - Si les items n'ont pas de `category`, ils sont groupés dans "Autres"
   - Vérifier que `displayedCategories.length > 0`

4. **Problème de route** :
   - La page doit être accessible sur `/jessica-contentin/ressources`
   - Vérifier que le lien dans le header pointe vers cette route

## Comment déboguer

1. **Ouvrir la console du navigateur** (F12)
2. **Regarder les logs** :
   - `[RessourcesPage] Direct query result:` - Doit montrer 7 items
   - `[RessourcesPage] getCatalogItems result:` - Doit montrer 7 items
   - `[RessourcesPage] Final filtered items count:` - Doit être 7
   - `[RessourcesPageClient] Items updated:` - Doit être 7

3. **Vérifier dans React DevTools** :
   - Ouvrir React DevTools
   - Trouver `RessourcesPageClient`
   - Vérifier la prop `initialItems` - doit contenir 7 items

4. **Vérifier dans Network** :
   - Ouvrir l'onglet Network
   - Filtrer par "ressources"
   - Vérifier que la page se charge correctement

## Tables Supabase utilisées

- `profiles` : Pour trouver l'ID de Jessica Contentin
- `catalog_items` : Pour récupérer les ressources/modules/tests
- `resources` : Pour enrichir les ressources avec les détails (images, prix, etc.)
- `courses` : Pour enrichir les modules avec les détails

## Filtres appliqués

1. **Par creator_id** : Seulement les items de Jessica Contentin
2. **Par is_active** : Seulement les items actifs
3. **Par target_audience** : Aucun filtre (tous les items sont affichés)

