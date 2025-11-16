# Guide d'Upload de Vidéos pour la Gamification

## 📋 Vue d'ensemble

Ce guide explique comment uploader et utiliser des vidéos pour la simulation de media training.

## 🚀 Étapes de Configuration

### 1. Créer le Bucket Supabase Storage

1. Allez dans votre **Supabase Dashboard**
2. Naviguez vers **Storage** dans le menu de gauche
3. Cliquez sur **"New bucket"**
4. Nommez-le : `gamification-videos`
5. Choisissez :
   - **Public bucket** : ✅ (pour que les vidéos soient accessibles publiquement)
   - OU **Private bucket** : (si vous préférez utiliser des signed URLs)

### 2. Exécuter les Migrations SQL

Exécutez les fichiers SQL suivants dans l'ordre :

1. **`supabase/CREATE_GAMIFICATION_VIDEOS_BUCKET.sql`**
   - Configure les policies RLS pour le bucket
   - À exécuter dans l'éditeur SQL de Supabase

2. **`supabase/CREATE_GAMIFICATION_VIDEOS_TABLE.sql`**
   - Crée la table pour stocker les métadonnées des vidéos
   - À exécuter dans l'éditeur SQL de Supabase

### 3. Uploader des Vidéos

#### Via l'Interface Super Admin

1. Connectez-vous en tant que **Super Admin** (`timdarcypro@gmail.com`)
2. Allez dans **Gamification > Gérer les vidéos** (`/super/gamification/videos`)
3. Utilisez le formulaire d'upload :
   - Sélectionnez votre fichier vidéo (max 100MB)
   - Choisissez le type : **Journaliste**, **Joueur**, **Fond**, ou **Autre**
   - Entrez un titre et une description
   - Cliquez sur **"Uploader la vidéo"**

#### Types de Vidéos Recommandés

- **Journaliste** (`journalist`) : Vidéo d'une journaliste pour les questions
- **Joueur** (`player`) : Vidéo du joueur PSG pour les réponses
- **Fond** (`background`) : Vidéo d'arrière-plan pour la scène
- **Autre** (`other`) : Autres vidéos nécessaires

### 4. Utilisation dans la Simulation

Les vidéos sont automatiquement chargées dans la simulation :
- La vidéo du **joueur** remplace l'image statique
- La vidéo du **journaliste** peut être utilisée (à implémenter)
- La vidéo de **fond** peut être utilisée (à implémenter)

## 📁 Structure des Fichiers

```
supabase/
  ├── CREATE_GAMIFICATION_VIDEOS_BUCKET.sql      # Policies RLS pour le bucket
  └── CREATE_GAMIFICATION_VIDEOS_TABLE.sql       # Table de métadonnées

src/
  ├── app/
  │   ├── api/
  │   │   └── gamification/
  │   │       └── videos/
  │   │           ├── route.ts                    # GET: Liste des vidéos
  │   │           └── upload/
  │   │               └── route.ts               # POST: Upload de vidéo
  │   └── super/
  │       └── gamification/
  │           └── videos/
  │               └── page.tsx                   # Page d'upload
  └── components/
      └── super-admin/
          ├── gamification-video-uploader.tsx    # Composant d'upload
          └── media-training-simulator.tsx        # Simulation (utilise les vidéos)
```

## 🎬 Formats Vidéo Recommandés

- **Format** : MP4 (H.264)
- **Résolution** : 1920x1080 (Full HD) ou 1280x720 (HD)
- **Taille max** : 100MB par vidéo
- **Durée** : Boucles courtes (5-30 secondes) pour les personnages
- **Codec** : H.264 pour compatibilité maximale

## 🔧 API Endpoints

### Upload une vidéo
```bash
POST /api/gamification/videos/upload
Content-Type: multipart/form-data

FormData:
- file: File (vidéo)
- video_type: "journalist" | "player" | "background" | "other"
- title: string
- description: string (optionnel)
- scenario_context: string (défaut: "media-training-psg")
```

### Récupérer les vidéos
```bash
GET /api/gamification/videos?video_type=player&scenario_context=media-training-psg
```

## ✅ Checklist de Configuration

- [ ] Bucket `gamification-videos` créé dans Supabase Storage
- [ ] Policies RLS exécutées (`CREATE_GAMIFICATION_VIDEOS_BUCKET.sql`)
- [ ] Table `gamification_videos` créée (`CREATE_GAMIFICATION_VIDEOS_TABLE.sql`)
- [ ] Test d'upload d'une vidéo via l'interface
- [ ] Vérification que la vidéo s'affiche dans la simulation

## 🐛 Dépannage

### Erreur "Bucket not found"
- Vérifiez que le bucket `gamification-videos` existe dans Supabase Storage
- Vérifiez que le nom est exactement `gamification-videos`

### Vidéo ne s'affiche pas
- Vérifiez que le bucket est **public** OU que vous utilisez des signed URLs
- Vérifiez la console du navigateur pour les erreurs CORS
- Vérifiez que l'URL de la vidéo est accessible

### Upload échoue
- Vérifiez la taille du fichier (max 100MB)
- Vérifiez le format (doit être une vidéo)
- Vérifiez les permissions RLS dans Supabase

## 📝 Notes

- Les vidéos sont stockées dans Supabase Storage
- Les métadonnées sont stockées dans la table `gamification_videos`
- Les vidéos peuvent être organisées par dossiers dans le bucket (ex: `player/video1.mp4`)
- Le système supporte plusieurs scénarios (via `scenario_context`)


