# Système CMS - Documentation

## Vue d'ensemble

Un système de gestion de contenu (CMS) complet a été intégré dans le Super Admin, permettant de créer et gérer les pages du site avec un éditeur drag and drop, une gestion SEO avancée, et l'upload de médias.

## Fonctionnalités

### 1. Navigation
- **Onglet CMS dans le header** : Icône Globe uniquement (pas de texte)
- **Route** : `/super/pages`

### 2. Liste des pages
- **Route** : `/super/pages`
- Affichage de toutes les pages créées
- Statut de publication (Publiée / Brouillon)
- Actions : Publier/Dépublier, Éditer, Supprimer
- Création de nouvelles pages

### 3. Builder Drag & Drop
- **Route création** : `/super/pages/new`
- **Route édition** : `/super/pages/[pageId]/edit`

#### Types de blocs disponibles :
- **H1** : Titre principal
- **H2** : Sous-titre
- **Texte** : Zone de texte éditable
- **Image** : Upload et affichage d'images
- **Vidéo** : Upload et affichage de vidéos

#### Fonctionnalités :
- Drag and drop pour réorganiser les blocs
- Ajout/suppression de blocs
- Édition inline de chaque bloc
- Sauvegarde automatique

### 4. Gestion SEO
- **Meta Title** : Titre pour les moteurs de recherche (60 caractères max)
- **Meta Description** : Description pour les moteurs de recherche (160 caractères max)
- **H1** : Titre principal de la page
- **H2** : Sous-titre de la page
- Compteurs de caractères en temps réel

### 5. Upload de médias
- Support images (tous formats)
- Support vidéos (tous formats)
- Stockage dans Supabase Storage
- Prévisualisation avant upload
- Gestion des métadonnées (dimensions, taille, etc.)

## Structure de base de données

### Table `cms_pages`
```sql
- id: UUID (PK)
- slug: TEXT (UNIQUE) - URL de la page
- title: TEXT - Titre de la page
- meta_title: TEXT - Meta title SEO
- meta_description: TEXT - Meta description SEO
- h1: TEXT - Titre H1
- h2: TEXT - Titre H2
- content: JSONB - Structure des blocs (drag & drop)
- is_published: BOOLEAN - Statut de publication
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
- created_by: UUID (FK -> auth.users)
```

### Table `cms_media`
```sql
- id: UUID (PK)
- filename: TEXT - Nom du fichier original
- file_path: TEXT - Chemin dans le storage
- file_type: TEXT - 'image' ou 'video'
- mime_type: TEXT - Type MIME
- file_size: BIGINT - Taille en octets
- width: INTEGER - Largeur (images)
- height: INTEGER - Hauteur (images)
- duration: INTEGER - Durée en secondes (vidéos)
- created_at: TIMESTAMPTZ
- created_by: UUID (FK -> auth.users)
```

## API Routes

### Pages
- `POST /api/cms/pages` - Créer une page
- `GET /api/cms/pages` - Lister toutes les pages
- `GET /api/cms/pages/[pageId]` - Récupérer une page
- `PUT /api/cms/pages/[pageId]` - Mettre à jour une page
- `PATCH /api/cms/pages/[pageId]` - Mettre à jour partiellement
- `DELETE /api/cms/pages/[pageId]` - Supprimer une page

### Médias
- `POST /api/cms/media/upload` - Upload d'un fichier (image ou vidéo)

## Sécurité

- **RLS (Row Level Security)** : Seuls les super admins peuvent accéder
- **Vérification d'accès** : Toutes les routes API vérifient `isSuperAdmin()`
- **Storage** : Fichiers stockés dans le bucket `public` de Supabase

## Installation

1. **Exécuter la migration SQL** :
```sql
-- Exécuter le fichier : supabase/CREATE_CMS_PAGES_TABLE.sql
```

2. **Vérifier les permissions** :
- S'assurer que l'utilisateur est bien super admin
- Vérifier que le bucket `public` existe dans Supabase Storage

## Utilisation

1. **Accéder au CMS** : Cliquer sur l'icône Globe dans le header Super Admin
2. **Créer une page** : Cliquer sur "Créer une page"
3. **Construire la page** :
   - Ajouter des blocs depuis la sidebar gauche
   - Réorganiser avec drag & drop
   - Éditer chaque bloc
4. **Configurer le SEO** : Onglet "SEO"
5. **Paramètres** : Onglet "Paramètres" pour le slug et la publication
6. **Sauvegarder** : Bouton "Sauvegarder" en haut à droite

## Structure des blocs (JSON)

```json
[
  {
    "id": "block-1234567890-abc",
    "type": "heading1",
    "content": "Mon titre principal",
    "metadata": {}
  },
  {
    "id": "block-1234567891-def",
    "type": "text",
    "content": "Mon texte ici...",
    "metadata": {}
  },
  {
    "id": "block-1234567892-ghi",
    "type": "image",
    "content": "https://...",
    "metadata": {
      "url": "https://...",
      "width": 1920,
      "height": 1080,
      "alt": "Description"
    }
  }
]
```

## Prochaines étapes possibles

- [ ] Prévisualisation en temps réel
- [ ] Templates de pages prédéfinis
- [ ] Historique des versions
- [ ] Éditeur de texte riche (WYSIWYG)
- [ ] Gestion des liens internes/externes
- [ ] Intégration avec le système de routing Next.js
- [ ] Export/Import de pages
- [ ] Collaboration en temps réel




