# Flux d'Organisation - Slug comme Source de Vérité

## 🎯 Principe Fondamental

**Le slug d'organisation dans l'URL est la seule source de vérité.** Aucune "org active" globale via cookie/localStorage.

## 🔄 Flux de Connexion

### 1. Login (`/login/admin`)
- Formulaire simple : email + password
- Après connexion réussie → `router.replace('/admin')`
- Pas de sélection d'organisation ici

### 2. Dispatcher (`/admin`)
- **Server Component** qui lit la session
- Si non connecté → `redirect('/login/admin')`
- Récupère les organisations de l'utilisateur
- **0 org** → Message d'aide + CTA "Changer de compte"
- **1 org** → `redirect('/admin/<slug>/formations')`
- **>1 org** → `redirect('/admin/select-org')`

### 3. Sélecteur Netflix (`/admin/select-org`)
- **Server Component** qui charge les organisations
- **Client Component** `OrgPicker` avec grille Netflix-style
- Cartes avec animations hover, gradients, effets de brillance
- Click → `router.push('/admin/<slug>/formations')`

## 🛠️ Helper Canonique

### `lib/org-server.ts`

```typescript
export async function resolveOrgFromSlugOrThrow(slug: string): Promise<OrgContext> {
  // 1. Vérifier l'authentification
  // 2. Récupérer l'organisation par slug
  // 3. Vérifier le membership
  // 4. Retourner le contexte complet
}
```

**Utilisé partout** dans `/admin/[org]/**` pour :
- Valider l'organisation
- Obtenir `orgId` pour les requêtes
- Empêcher les 403/loops

## 📋 Pages /admin/[org]

Toutes les pages utilisent le pattern :

```typescript
export default async function Page({ params }: { params: Promise<{ org: string }> }) {
  const { org: orgSlug } = await params;
  
  try {
    const { orgId, orgName, role } = await resolveOrgFromSlugOrThrow(orgSlug);
    // Utiliser orgId pour les requêtes
    // Afficher orgName dans l'UI
  } catch (error) {
    redirect('/admin'); // Retour au dispatcher
  }
}
```

## 🔧 API Routes & Server Actions

Pour chaque route API sous `/admin/[org]/...` :

```typescript
export async function POST(req: NextRequest, { params }: { params: Promise<{ org: string }> }) {
  const { org: orgSlug } = await params;
  const { orgId, role } = await resolveOrgFromSlugOrThrow(orgSlug);
  
  // Vérifier les permissions (admin/instructor pour write)
  // Utiliser orgId pour les inserts/updates
}
```

## 🎨 UX & Style

### Picker Netflix
- **Grille responsive** : 2-4 colonnes selon l'écran
- **Cartes avec animations** : hover scale, shadow glow, effet de brillance
- **Placeholders intelligents** : initiales + gradients si pas de cover
- **Thème dark premium** : #252525, glass, gradients subtils

### Middleware
- **Laisse passer** `/admin`, `/admin/select-org`, `/admin/[org]`
- **Pas de redirection** vers login pour les utilisateurs authentifiés
- **Contrôles fins** côté Server Component

## ✅ Scénarios de Test

### Jessica (1 organisation)
1. `/login/admin` → login → `/admin` → `redirect('/admin/jessica-contentin/formations')`
2. Création formation → `org_id` correct automatiquement
3. Reload → formation visible dans la grille

### Timmy (2 organisations)
1. `/login/admin` → login → `/admin` → `redirect('/admin/select-org')`
2. Picker montre "beyond" et "centre-jessica"
3. Click "beyond" → `/admin/beyond/formations`
4. Créer formation → `org_id = beyond`
5. Switcher d'org = changement d'URL (pas de cookies)

### URL Directe
- `/admin/beyond/formations` → Si membre : page OK
- Si pas membre : Server Component renvoie 403 ou page d'erreur

### Pas de Loop
- Navigation entre login → admin/select-org → admin/[org] → refresh
- Aucune redirection vers login si session présente

## 🚫 Interdictions

- ❌ Pas de "org active" globale
- ❌ Pas de cookies/localStorage pour l'organisation
- ❌ Pas de redirection middleware vers login pour `/admin/[org]`
- ❌ Pas de champ organisation dans les formulaires
- ❌ Pas de logique d'organisation côté client

## ✅ Règles d'Or

1. **URL = Source de vérité** : Le slug dans l'URL détermine l'organisation
2. **Server Components** : Tous les contrôles d'accès côté serveur
3. **Helper canonique** : `resolveOrgFromSlugOrThrow` partout
4. **Pas de state global** : Aucune organisation "active" en mémoire
5. **UX fluide** : Picker Netflix pour les multi-orgs
