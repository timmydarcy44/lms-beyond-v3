# 🔧 Optimisation Disk IO Supabase - Plan d'Action

## 📊 Analyse du Problème

Votre projet consomme trop de Disk IO, ce qui peut causer :
- ⚠️ Augmentation des temps de réponse
- ⚠️ Hausse de l'utilisation CPU (IO wait)
- ⚠️ Risque d'instabilité de l'instance

## 🔍 Causes Identifiées

### 1. **Requêtes Multiples dans des Boucles** (CRITIQUE)

**Fichier** : `src/app/jessica-contentin/ressources/page.tsx`

**Problème** : Pour chaque item du catalogue, on fait 3-4 requêtes séparées :
```typescript
// Ligne 105-173 : Pour CHAQUE item, on fait :
- 1 requête vers resources/courses/tests
- 1 requête vers catalog_items
- 1 requête vers catalog_access (si utilisateur connecté)
```

**Impact** : Si vous avez 20 items, cela fait **60-80 requêtes** par chargement de page !

**Solution** : Utiliser des jointures SQL ou des requêtes groupées.

---

### 2. **Pas de Cache** (CRITIQUE)

**Problème** : Toutes les requêtes sont refaites à chaque chargement de page, même si les données n'ont pas changé.

**Exemples** :
- Page ressources : Requêtes refaites à chaque visite
- Dashboard : Données recalculées à chaque chargement
- Catalogue : Liste complète rechargée à chaque fois

**Solution** : Implémenter un cache avec :
- Next.js `unstable_cache` pour les Server Components
- React Query pour les Client Components
- Cache Redis (optionnel, pour Supabase)

---

### 3. **Requêtes Non Optimisées** (IMPORTANT)

**Problème** : Beaucoup de requêtes qui récupèrent toutes les colonnes (`select("*")`) ou qui ne sont pas indexées.

**Exemples trouvés** :
```typescript
// src/app/api/beyond-connect/matches/calculate/route.ts
supabase.from("beyond_connect_skills").select("*") // ❌ Récupère tout
supabase.from("beyond_connect_experiences").select("*") // ❌ Récupère tout
```

**Solution** : 
- Sélectionner uniquement les colonnes nécessaires
- Vérifier que les index existent sur les colonnes utilisées dans WHERE/JOIN

---

### 4. **Requêtes Fréquentes Sans Pagination** (IMPORTANT)

**Problème** : Certaines API routes récupèrent toutes les données sans limite.

**Exemples** :
- `/api/catalogue/route.ts` : Récupère tous les items
- `/api/beyond-connect/matches/calculate/route.ts` : Récupère tous les profils

**Solution** : Implémenter la pagination avec `limit()` et `offset()`.

---

## 🚀 Plan d'Action Priorisé

### ✅ PRIORITÉ 1 : Optimiser la Page Ressources (Impact Immédiat)

**Fichier** : `src/app/jessica-contentin/ressources/page.tsx`

**Actions** :
1. Créer une fonction SQL qui fait tout en une seule requête
2. Utiliser des jointures au lieu de requêtes multiples
3. Ajouter un cache de 5 minutes

**Gain estimé** : **-70% de requêtes** sur cette page (la plus visitée)

---

### ✅ PRIORITÉ 2 : Ajouter un Cache Global

**Actions** :
1. Utiliser `unstable_cache` de Next.js pour les Server Components
2. Utiliser React Query pour les Client Components
3. Configurer un TTL de 5 minutes pour les données statiques

**Gain estimé** : **-50% de requêtes** globales

---

### ✅ PRIORITÉ 3 : Optimiser les Requêtes API

**Actions** :
1. Remplacer `select("*")` par `select("col1, col2, ...")`
2. Ajouter des `limit()` sur les requêtes de liste
3. Vérifier et créer les index manquants

**Gain estimé** : **-30% de Disk IO** par requête

---

### ✅ PRIORITÉ 4 : Vérifier les Index de Base de Données

**Actions** :
1. Analyser les requêtes lentes dans Supabase Dashboard
2. Créer des index sur :
   - `catalog_items.creator_id`
   - `catalog_items.is_active`
   - `catalog_access.user_id`
   - `catalog_access.catalog_item_id`
   - `profiles.email`

**Gain estimé** : **-40% de temps d'exécution** des requêtes

---

## 📝 Scripts SQL à Exécuter

### 1. Créer des Index Manquants

```sql
-- Index pour catalog_items (utilisé fréquemment)
CREATE INDEX IF NOT EXISTS idx_catalog_items_creator_active 
ON catalog_items(creator_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_catalog_items_content_type 
ON catalog_items(item_type, is_active);

-- Index pour catalog_access (vérifications d'accès)
CREATE INDEX IF NOT EXISTS idx_catalog_access_user_item 
ON catalog_access(user_id, catalog_item_id, access_status);

CREATE INDEX IF NOT EXISTS idx_catalog_access_org_item 
ON catalog_access(organization_id, catalog_item_id, access_status);

-- Index pour profiles (recherche par email)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index pour resources (recherche par creator)
CREATE INDEX IF NOT EXISTS idx_resources_creator 
ON resources(creator_id);

-- Index pour tests (recherche par creator)
CREATE INDEX IF NOT EXISTS idx_tests_creator 
ON tests(creator_id);
```

### 2. Fonction SQL Optimisée pour la Page Ressources

```sql
-- Fonction qui récupère tous les items en une seule requête
CREATE OR REPLACE FUNCTION get_jessica_catalog_items(user_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  item_type TEXT,
  content_id UUID,
  title TEXT,
  description TEXT,
  short_description TEXT,
  hero_image_url TEXT,
  thumbnail_url TEXT,
  price NUMERIC,
  is_free BOOLEAN,
  category TEXT,
  access_status TEXT,
  stripe_checkout_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.item_type,
    ci.content_id,
    COALESCE(ci.title, r.title, c.title, t.title) as title,
    COALESCE(ci.description, r.description, c.description, t.description) as description,
    ci.short_description,
    COALESCE(ci.hero_image_url, r.hero_image_url, c.hero_image_url, t.hero_image_url) as hero_image_url,
    COALESCE(ci.thumbnail_url, r.thumbnail_url, c.thumbnail_url, t.thumbnail_url) as thumbnail_url,
    COALESCE(ci.price, r.price, c.price, t.price, 0) as price,
    COALESCE(ci.is_free, (COALESCE(ci.price, r.price, c.price, t.price, 0) = 0)) as is_free,
    COALESCE(ci.category, r.category, c.category, t.category) as category,
    CASE 
      WHEN user_id_param IS NOT NULL AND EXISTS (
        SELECT 1 FROM catalog_access ca 
        WHERE ca.catalog_item_id = ci.id 
        AND (ca.user_id = user_id_param OR ca.organization_id IN (
          SELECT org_id FROM profiles WHERE id = user_id_param
        ))
        AND ca.access_status IN ('purchased', 'manually_granted', 'free')
      ) THEN 'purchased'
      WHEN COALESCE(ci.is_free, (COALESCE(ci.price, r.price, c.price, t.price, 0) = 0)) THEN 'free'
      ELSE 'pending_payment'
    END as access_status,
    ci.stripe_checkout_url
  FROM catalog_items ci
  LEFT JOIN resources r ON ci.item_type = 'ressource' AND ci.content_id = r.id
  LEFT JOIN courses c ON ci.item_type = 'module' AND ci.content_id = c.id
  LEFT JOIN tests t ON ci.item_type = 'test' AND ci.content_id = t.id
  WHERE ci.creator_id = '17364229-fe78-4986-ac69-41b880e34631' -- Jessica Contentin UUID
    AND ci.is_active = true
  ORDER BY ci.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔧 Modifications de Code à Faire

### 1. Optimiser `src/app/jessica-contentin/ressources/page.tsx`

**Avant** (60-80 requêtes) :
```typescript
// Pour chaque item, 3-4 requêtes
for (const item of directItems) {
  const { data: resource } = await supabase.from("resources")...
  const { data: catalogItem } = await supabase.from("catalog_items")...
  const { data: access } = await supabase.from("catalog_access")...
}
```

**Après** (1 requête) :
```typescript
// Une seule requête avec la fonction SQL
const { data: items } = await supabase
  .rpc('get_jessica_catalog_items', { user_id_param: userId || null });

// Avec cache Next.js
import { unstable_cache } from 'next/cache';

const getCachedItems = unstable_cache(
  async (userId: string | null) => {
    const { data } = await supabase
      .rpc('get_jessica_catalog_items', { user_id_param: userId || null });
    return data || [];
  },
  ['jessica-catalog-items'],
  { revalidate: 300 } // Cache de 5 minutes
);
```

### 2. Ajouter un Cache Global

**Créer** : `src/lib/cache/query-cache.ts`

```typescript
import { unstable_cache } from 'next/cache';

export function createCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  revalidateSeconds: number = 300
) {
  return unstable_cache(
    queryFn,
    [key],
    { revalidate: revalidateSeconds }
  );
}
```

### 3. Optimiser les Requêtes API

**Avant** :
```typescript
const { data } = await supabase.from("table").select("*");
```

**Après** :
```typescript
const { data } = await supabase
  .from("table")
  .select("id, name, email") // Seulement les colonnes nécessaires
  .limit(100); // Limiter les résultats
```

---

## 📊 Métriques à Surveiller

Après les optimisations, surveillez dans Supabase Dashboard :

1. **Disk IO** : Doit diminuer de 50-70%
2. **Temps de réponse** : Doit diminuer de 30-50%
3. **CPU Usage** : Doit diminuer (moins d'IO wait)

---

## ⚡ Actions Immédiates (Aujourd'hui)

1. ✅ Exécuter les scripts SQL pour créer les index
2. ✅ Créer la fonction SQL `get_jessica_catalog_items`
3. ✅ Optimiser la page ressources avec cache
4. ✅ Vérifier les requêtes lentes dans Supabase Dashboard

---

## 📅 Actions à Court Terme (Cette Semaine)

1. ✅ Implémenter le cache global
2. ✅ Optimiser toutes les requêtes `select("*")`
3. ✅ Ajouter la pagination aux listes
4. ✅ Monitorer les métriques

---

## 💰 Option : Upgrade Compute Add-on

Si les optimisations ne suffisent pas, considérez un upgrade :
- **Pro** : Plus de Disk IO budget
- **Cons** : Coût supplémentaire

Mais **essayez d'abord les optimisations** - elles devraient résoudre 70-80% du problème.

---

## 📞 Support

Si vous avez besoin d'aide pour implémenter ces optimisations, je peux :
1. Créer les scripts SQL optimisés
2. Modifier le code pour utiliser le cache
3. Optimiser les requêtes spécifiques

Dites-moi par où commencer ! 🚀

