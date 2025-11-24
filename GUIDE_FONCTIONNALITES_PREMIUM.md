# Guide : Système de Fonctionnalités Premium

## Vue d'ensemble

Le système de fonctionnalités premium permet de gérer l'accès à des fonctionnalités avancées (comme la gamification) par organisation. Seules les organisations ayant une fonctionnalité activée peuvent y accéder.

## Installation

### 1. Créer la table dans Supabase

Exécutez le script SQL suivant dans Supabase Studio :

```sql
-- Voir le fichier : supabase/CREATE_ORGANIZATION_FEATURES_TABLE.sql
```

Ce script crée :
- La table `organization_features` pour stocker les fonctionnalités activées
- Les fonctions helper `has_feature()` et `get_organization_features()`
- Les politiques RLS pour la sécurité

### 2. Fonctionnalités disponibles

Actuellement, les fonctionnalités suivantes sont disponibles :
- **gamification** : Accès aux simulations immersives et fonctionnalités de gamification
- **ai_advanced** : Accès aux fonctionnalités d'IA avancées
- **analytics_pro** : Statistiques détaillées et rapports avancés

## Utilisation

### Pour les Super Admins

1. **Accéder à la gestion des fonctionnalités** :
   - Allez sur `/super/organisations`
   - Cliquez sur une organisation
   - Dans le panneau "Actions Rapides" → "Paramètres" → "Fonctionnalités Premium"

2. **Activer/Désactiver une fonctionnalité** :
   - Utilisez le switch à côté de chaque fonctionnalité
   - L'activation est immédiate

### Pour les développeurs

#### Vérifier l'accès à une fonctionnalité

```typescript
import { hasUserFeature } from "@/lib/queries/organization-features";

// Dans un composant serveur
const hasAccess = await hasUserFeature("gamification");
if (!hasAccess) {
  redirect("/dashboard");
}
```

#### Vérifier l'accès pour une organisation spécifique

```typescript
import { hasOrganizationFeature } from "@/lib/queries/organization-features";

const hasAccess = await hasOrganizationFeature(orgId, "gamification");
```

#### Activer une fonctionnalité programmatiquement

```typescript
import { enableOrganizationFeature } from "@/lib/queries/organization-features";

await enableOrganizationFeature(orgId, "gamification", {
  plan: "premium",
  price: 99.99
});
```

## Structure de la base de données

### Table `organization_features`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `org_id` | UUID | ID de l'organisation |
| `feature_key` | TEXT | Clé de la fonctionnalité (ex: "gamification") |
| `is_enabled` | BOOLEAN | Si la fonctionnalité est activée |
| `enabled_at` | TIMESTAMPTZ | Date d'activation |
| `enabled_by` | UUID | ID de l'utilisateur qui a activé |
| `expires_at` | TIMESTAMPTZ | Date d'expiration (optionnel) |
| `metadata` | JSONB | Métadonnées flexibles (plan, prix, etc.) |

## API Routes

### GET `/api/super-admin/organizations/[orgId]/features`
Récupère toutes les fonctionnalités d'une organisation.

### POST `/api/super-admin/organizations/[orgId]/features/[featureKey]`
Active une fonctionnalité pour une organisation.

### DELETE `/api/super-admin/organizations/[orgId]/features/[featureKey]`
Désactive une fonctionnalité pour une organisation.

## Sécurité

- Seuls les super admins peuvent activer/désactiver les fonctionnalités
- Les admins d'organisation peuvent voir les fonctionnalités de leur organisation
- Les politiques RLS garantissent que les utilisateurs ne peuvent voir que les fonctionnalités de leur organisation

## Exemple : Masquer la gamification dans la navigation

Pour masquer la section "Gamification" dans la navigation si l'utilisateur n'y a pas accès :

```typescript
// Dans un composant serveur
const hasGamification = await hasUserFeature("gamification");

// Dans le rendu
{hasGamification && (
  <NavItem label="Gamification" href="/super/gamification" />
)}
```

## Notes importantes

- Les super admins ont toujours accès à toutes les fonctionnalités
- Les fonctionnalités peuvent avoir une date d'expiration pour les abonnements temporaires
- Les métadonnées permettent de stocker des informations supplémentaires (plan, prix, etc.)








