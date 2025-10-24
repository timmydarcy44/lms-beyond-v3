# Routage Multi-Organisation

## Schéma d'URL

### Structure des URLs

```
/admin/[org]/...     - Interface d'administration
/app/[org]/...       - Interface apprenant
/org-picker          - Sélecteur d'organisation
/switch-org          - API de changement d'org
/login               - Connexion (avec paramètres org/next)
```

### Exemples d'URLs

- `/admin/acme/dashboard` - Dashboard admin pour l'org "acme"
- `/admin/acme/formations/123` - Formation 123 dans l'org "acme"
- `/app/acme/courses/456` - Cours 456 pour apprenants de l'org "acme"
- `/org-picker` - Sélection d'organisation
- `/login?org=acme&next=/admin/acme/dashboard` - Login avec redirection

## Règles de routage

### 1. Redirections automatiques

- `/login/admin` → `/login` (redirection simple)
- `/admin` → `/admin/[org-default]` ou `/org-picker`
- `/admin/ACME` → `/admin/acme` (normalisation 308)

### 2. Validation des slugs

- Slug vide ou invalide → 404
- Slug inexistant → 404 (pas de fuite d'info)
- Utilisateur non membre → `/org-picker?denied=[slug]`

### 3. Authentification

- Non authentifié + chemin privé → `/login?org=[slug]&next=[path]`
- Authentifié + org valide → Accès normal
- Authentifié + org invalide → `/org-picker`

## Helpers d'URL

### `withOrg(path, orgSlug)`

Remplace ou ajoute le slug d'organisation dans une URL.

```typescript
withOrg('/admin/dashboard', 'acme')     // → '/admin/acme/dashboard'
withOrg('/admin/formations/123', 'demo') // → '/admin/demo/formations/123'
```

### `adminUrl(path, orgSlug)`

Construit une URL admin complète.

```typescript
adminUrl('dashboard', 'acme')           // → '/admin/acme/dashboard'
adminUrl('formations/123', 'demo')     // → '/admin/demo/formations/123'
```

### `appUrl(path, orgSlug)`

Construit une URL apprenant complète.

```typescript
appUrl('courses', 'acme')              // → '/app/acme/courses'
appUrl('courses/456', 'demo')          // → '/app/demo/courses/456'
```

## Edge Cases

### 1. Organisation inexistante

**Symptôme** : Utilisateur accède à `/admin/unknown-org/dashboard`
**Comportement** : 404 générique (pas de fuite d'information)
**Log** : Pas de log du nom de l'org pour éviter les fuites

### 2. Utilisateur non membre

**Symptôme** : Utilisateur authentifié accède à une org dont il n'est pas membre
**Comportement** : Redirection vers `/org-picker?denied=[slug]`
**Message** : "Vous n'avez pas accès à cette organisation"

### 3. Aucune organisation

**Symptôme** : Utilisateur authentifié sans aucune organisation
**Comportement** : Message "Contactez votre administrateur"
**Action** : Bouton "Retour à la connexion"

### 4. Organisation unique

**Symptôme** : Utilisateur avec une seule organisation
**Comportement** : Redirection automatique vers `/admin/[slug]`
**Skip** : Pas d'affichage du sélecteur

### 5. SINGLE_ORG_SLUG configuré

**Symptôme** : Variable d'environnement `SINGLE_ORG_SLUG` définie
**Comportement** : Redirection automatique vers cette org
**Skip** : Pas d'affichage du sélecteur

## Sécurité

### 1. Pas de fuite d'information

- Erreur 404 générique pour orgs inexistantes
- Pas de log des noms d'organisations dans les erreurs
- Messages d'erreur neutres

### 2. Validation des membreships

- Vérification côté serveur via `org_memberships`
- RLS (Row Level Security) sur les données
- Validation à chaque requête

### 3. Normalisation des slugs

- Conversion automatique en minuscules
- Redirection 308 pour préserver le SEO
- Validation des caractères autorisés

## Exemples de liens

### Navigation admin

```typescript
// ✅ Correct - utiliser les helpers
<Link href={adminUrl('dashboard', orgSlug)}>Dashboard</Link>
<Link href={adminUrl('formations', orgSlug)}>Formations</Link>

// ❌ Incorrect - assemblage manuel
<Link href={`/admin/${orgSlug}/dashboard`}>Dashboard</Link>
```

### Breadcrumbs

```typescript
const breadcrumbs = [
  { label: 'Admin', href: adminUrl('', orgSlug) },
  { label: 'Formations', href: adminUrl('formations', orgSlug) },
  { label: formation.title, href: adminUrl(`formations/${formation.id}`, orgSlug) }
];
```

### Changement d'organisation

```typescript
// Utiliser l'API switch-org
const switchOrg = (newOrgSlug: string) => {
  const currentPath = router.asPath;
  const nextUrl = withOrg(currentPath, newOrgSlug);
  window.location.href = `/switch-org?to=${newOrgSlug}&next=${encodeURIComponent(nextUrl)}`;
};
```

## Configuration

### Variables d'environnement

```bash
# Organisation unique (optionnel)
SINGLE_ORG_SLUG=acme

# Si non défini, affichage du sélecteur d'org
```

### Base de données

```sql
-- Table des organisations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- Table des membreships
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  org_id UUID REFERENCES organizations(id),
  role TEXT NOT NULL,
  UNIQUE(user_id, org_id)
);
```

## Tests

### Tests E2E

Voir `e2e/multi-org.spec.ts` pour les scénarios de test :

- Redirections automatiques
- Normalisation des slugs
- Gestion des erreurs d'auth
- Fonctionnalité switch-org
- Validation des slugs invalides

### Tests unitaires

```typescript
// Test des helpers d'URL
expect(withOrg('/admin/dashboard', 'ACME')).toBe('/admin/acme/dashboard');
expect(adminUrl('formations', 'demo')).toBe('/admin/demo/formations');
expect(extractOrgSlug('/admin/acme/dashboard')).toBe('acme');
```
