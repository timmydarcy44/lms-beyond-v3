# Rapport d'Analyse du Code Mort

**Date :** 2025-01-16  
**Objectif :** Identifier les fichiers et composants non utilisés pouvant être supprimés

---

## ⚠️ Fichiers Potentiellement Non Utilisés

### 🔴 À Vérifier et Supprimer si Confirmé

#### 1. Composants Super Admin
- **`src/components/super-admin/super-admin-sidebar-futuristic.tsx`**
  - **Statut :** Non importé nulle part
  - **Action :** Vérifier puis supprimer si non utilisé

#### 2. Fichiers de Queries
- **`src/lib/queries/catalogue-access.ts`**
  - **Statut :** Fonction `getOrganizationCatalogAccess` non importée
  - **Action :** Vérifier si cette fonction est utilisée via une autre route, sinon supprimer

---

## ✅ Fichiers Vérifiés et Utilisés

### Composants Admin
- ✅ `ActivityFeed.tsx` - Utilisé dans `AdminDashboardView.tsx`
- ✅ `QuickCreateSlider.tsx` - Utilisé dans `AdminDashboardView.tsx` et `formateur/page.tsx`
- ✅ `KPIGrid.tsx` - Utilisé dans plusieurs pages dashboard
- ✅ `content-card.tsx` - Utilisé dans pages admin (tests, ressources, parcours)
- ✅ `course-card.tsx` - Utilisé dans `admin/formations/page.tsx`

### Composants Super Admin
- ✅ `super-admin-sidebar-clean.tsx` - Utilisé dans `super-admin-sidebar-wrapper.tsx`
- ✅ `quick-actions-panel.tsx` - Utilisé dans pages organisations
- ✅ `ai-interactions-manager.tsx` - Utilisé dans `admin/super/ia/page.tsx`

### Fichiers de Queries
- ✅ `news.ts` - Utilisé dans `super/page.tsx`
- ✅ `tuteur.ts` - Utilisé dans plusieurs pages tuteur
- ✅ `catalog-categories.ts` - Utilisé dans `api/super-admin/categories/route.ts`
- ✅ `super-admin-branding.ts` - Utilisé dans de nombreuses pages

---

## 📊 Statistiques

- **Fichiers vérifiés :** 15+
- **Fichiers non utilisés identifiés :** 2
- **Fichiers utilisés confirmés :** 13+

---

## 🔍 Recommandations

### Phase 1 : Vérification Manuelle
1. Vérifier manuellement `super-admin-sidebar-futuristic.tsx` - peut-être une version alternative non utilisée
2. Vérifier `catalogue-access.ts` - peut-être utilisé indirectement

### Phase 2 : Analyse Approfondie
Pour une analyse plus complète, utiliser :
```bash
# Installer ts-prune
npm install -g ts-prune

# Analyser le projet
ts-prune

# Ou utiliser depcheck
npm install -g depcheck
depcheck
```

### Phase 3 : Vérification Supabase
- Vérifier les tables/colonnes non référencées dans le code
- Vérifier les fonctions SQL/triggers obsolètes
- Vérifier les RLS policies non utilisées

---

## ⚠️ Précautions

- **Ne pas supprimer** les fichiers sans vérification approfondie
- **Tester** après chaque suppression
- **Vérifier** les imports dynamiques (`import()`)
- **Vérifier** les références dans les fichiers de configuration

---

## 📝 Notes

- Certains fichiers peuvent être utilisés via des imports dynamiques
- Certains fichiers peuvent être référencés dans des fichiers de configuration
- Certains fichiers peuvent être utilisés dans des tests (non analysés ici)

