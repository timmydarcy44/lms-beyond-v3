# Health Check - LMS Business Logic Audit

## 📊 État général

**Date de l'audit** : 2025-01-20  
**Version** : Next.js 15 + Supabase  
**Environnement** : Production Vercel  

---

## ✅/❌ Formations

| Fonctionnalité | État | Détails |
|---|---|---|
| **Liste (grid)** | ✅ | `app/(dashboard)/admin/formations/page.tsx` - Fonctionne avec données réelles |
| **Création (insert)** | ✅ | `app/api/formations/route.ts` - POST fonctionnel avec org_id |
| **Builder (sections/chapters/subchapters)** | ✅ | `app/(dashboard)/admin/formations/[id]/FormationBuilder.tsx` - Complet |
| **Persistance (positions + contenu)** | ✅ | `app/(dashboard)/admin/formations/[id]/actions.ts` - Server Actions fonctionnelles |
| **Preview formation** | ❌ | **MANQUANT** - Pas de page `/admin/formations/[id]/preview` |

**Problèmes identifiés** :
- Aucune page de prévisualisation pour les formations
- Pas de CTA d'assignation sur les cartes formations

---

## ✅/❌ Parcours (pathways)

| Fonctionnalité | État | Détails |
|---|---|---|
| **Liste (grid)** | ❌ | `app/(dashboard)/admin/parcours/page.tsx` - **Données mock uniquement** |
| **Création** | ❌ | **MANQUANT** - Pas de route API `/api/pathways` |
| **Ajout d'items** | ❌ | **MANQUANT** - Pas de route `/api/pathways/[id]/items` |
| **Affectation à apprenant/groupe** | ❌ | **MANQUANT** - Pas de route `/api/pathways/[id]/assign` |
| **Preview d'un parcours** | ❌ | **MANQUANT** - Pas de page `/admin/parcours/[id]/preview` |

**Problèmes identifiés** :
- Toutes les fonctionnalités parcours sont mockées
- Aucune intégration avec la base de données
- Pas de CRUD complet

---

## ✅/❌ Tests

| Fonctionnalité | État | Détails |
|---|---|---|
| **Liste (grid)** | ❌ | `app/(dashboard)/admin/tests/page.tsx` - **Données mock uniquement** |
| **Création** | ❌ | **MANQUANT** - Pas de route API `/api/tests` |
| **Affectation** | ❌ | **MANQUANT** - Pas de route `/api/tests/[id]/assign` |
| **Preview (embed)** | ❌ | **MANQUANT** - Pas de page `/admin/tests/[id]/preview` |

**Problèmes identifiés** :
- Toutes les fonctionnalités tests sont mockées
- Pas d'intégration Typeform
- Pas de CRUD complet

---

## ✅/❌ Ressources

| Fonctionnalité | État | Détails |
|---|---|---|
| **Liste (grid)** | ❌ | `app/(dashboard)/admin/ressources/page.tsx` - **Données mock uniquement** |
| **Création** | ❌ | **MANQUANT** - Pas de route API `/api/resources` |
| **Affectation** | ❌ | **MANQUANT** - Pas de route `/api/resources/[id]/assign` |
| **Preview** | ❌ | **MANQUANT** - Pas de page `/admin/ressources/[id]/preview` |

**Problèmes identifiés** :
- Toutes les fonctionnalités ressources sont mockées
- Pas de gestion des fichiers (PDF, vidéo, audio)
- Pas de CRUD complet

---

## ✅/❌ Assignations

| Fonctionnalité | État | Détails |
|---|---|---|
| **pathway_assignments** | ❌ | **MANQUANT** - Pas de table ni de logique |
| **test_assignments** | ❌ | **MANQUANT** - Pas de table ni de logique |
| **resource_assignments** | ❌ | **MANQUANT** - Pas de table ni de logique |
| **formation assignments** | ✅ | Via `pathway_items` - Fonctionne partiellement |

**Problèmes identifiés** :
- Système d'assignation incomplet
- Pas de tables dédiées aux assignations
- Pas de CTA d'assignation sur les cartes

---

## ✅/❌ RLS/Policies

| Fonctionnalité | État | Détails |
|---|---|---|
| **Erreurs SQL** | ⚠️ | Quelques erreurs 42P17 sur formations (résolues) |
| **Policies formations** | ✅ | Fonctionnent correctement |
| **Policies parcours** | ❓ | **À vérifier** - Pas de données réelles |
| **Policies tests** | ❓ | **À vérifier** - Pas de données réelles |
| **Policies ressources** | ❓ | **À vérifier** - Pas de données réelles |

**Problèmes identifiés** :
- Besoin de vérifier les policies pour les nouvelles tables
- Possible besoin de migrations RLS

---

## ✅/❌ Runtime

| Fonctionnalité | État | Détails |
|---|---|---|
| **Routes API Node** | ✅ | Toutes les routes existantes ont `export const runtime = 'nodejs'` |
| **Server Actions Node** | ✅ | Actions existantes respectent la règle |
| **Nouvelles routes** | ❓ | **À vérifier** - Routes manquantes à créer |

**Problèmes identifiés** :
- Besoin de créer les routes manquantes avec runtime Node

---

## ✅/❌ Org context

| Fonctionnalité | État | Détails |
|---|---|---|
| **Formations** | ✅ | `getCurrentOrg()` utilisé correctement |
| **Parcours** | ❓ | **À vérifier** - Pas de données réelles |
| **Tests** | ❓ | **À vérifier** - Pas de données réelles |
| **Ressources** | ❓ | **À vérifier** - Pas de données réelles |

**Problèmes identifiés** :
- Besoin de s'assurer que toutes les nouvelles entités utilisent l'org_id de la session

---

## ✅/❌ Previews

| Fonctionnalité | État | Détails |
|---|---|---|
| **Formations preview** | ❌ | **MANQUANT** - `/admin/formations/[id]/preview` |
| **Parcours preview** | ❌ | **MANQUANT** - `/admin/parcours/[id]/preview` |
| **Tests preview** | ❌ | **MANQUANT** - `/admin/tests/[id]/preview` |
| **Ressources preview** | ❌ | **MANQUANT** - `/admin/ressources/[id]/preview` |

**Problèmes identifiés** :
- Aucune page de prévisualisation fonctionnelle
- Pas d'embed Typeform pour les tests
- Pas de viewer pour les ressources

---

## 🎯 Plan d'action prioritaire

### Phase 1 : CRUD minimal (Critique)
1. **Parcours** : Créer routes API + pages CRUD
2. **Tests** : Créer routes API + pages CRUD  
3. **Ressources** : Créer routes API + pages CRUD

### Phase 2 : Previews (Important)
1. **Formations preview** : Page de prévisualisation
2. **Parcours preview** : Liste des items + liens
3. **Tests preview** : Embed Typeform
4. **Ressources preview** : Viewer selon le type

### Phase 3 : Assignations (Important)
1. **Tables d'assignation** : Créer les tables manquantes
2. **CTA sur cartes** : Menu "..." avec assignations
3. **Routes d'assignation** : API pour assigner contenu

### Phase 4 : RLS & Optimisations (Nice to have)
1. **Vérifier policies** : Tester toutes les nouvelles tables
2. **Migrations RLS** : Corriger si nécessaire
3. **Optimistic UI** : Améliorer l'UX

---

## 📋 Fichiers à créer/modifier

### Routes API manquantes
- `app/api/pathways/route.ts`
- `app/api/pathways/[id]/route.ts`
- `app/api/pathways/[id]/items/route.ts`
- `app/api/pathways/[id]/assign/route.ts`
- `app/api/tests/route.ts`
- `app/api/tests/[id]/route.ts`
- `app/api/tests/[id]/assign/route.ts`
- `app/api/resources/route.ts`
- `app/api/resources/[id]/route.ts`
- `app/api/resources/[id]/assign/route.ts`

### Pages manquantes
- `app/(dashboard)/admin/parcours/new/page.tsx`
- `app/(dashboard)/admin/parcours/[id]/page.tsx`
- `app/(dashboard)/admin/parcours/[id]/preview/page.tsx`
- `app/(dashboard)/admin/tests/new/page.tsx`
- `app/(dashboard)/admin/tests/[id]/page.tsx`
- `app/(dashboard)/admin/tests/[id]/preview/page.tsx`
- `app/(dashboard)/admin/ressources/new/page.tsx`
- `app/(dashboard)/admin/ressources/[id]/page.tsx`
- `app/(dashboard)/admin/ressources/[id]/preview/page.tsx`
- `app/(dashboard)/admin/formations/[id]/preview/page.tsx`

### Composants manquants
- `components/admin/AssignmentMenu.tsx` (CTA sur cartes)
- `components/admin/PreviewEmbed.tsx` (Typeform, YouTube, etc.)

---

## 🚨 Blocages critiques

1. **Données mock** : Parcours, tests, ressources utilisent des données fictives
2. **Pas de CRUD** : Aucune création/modification possible
3. **Pas de preview** : Impossible de voir le contenu réel
4. **Pas d'assignation** : Impossible d'assigner du contenu aux apprenants

**Impact** : Le système n'est pas fonctionnel pour la production.
