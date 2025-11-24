# Configuration du Storage pour Jessica CONTENTIN

## Création du bucket Supabase

### Étape 1 : Créer le bucket via l'interface Supabase

1. Aller dans **Supabase Dashboard > Storage**
2. Cliquer sur **"New bucket"**
3. Configurer le bucket :
   - **Nom** : `jessica-contentin`
   - **Public** : `Oui` ✅ (pour accès public aux images)
   - **File size limit** : `10485760` (10 MB)
   - **Allowed MIME types** : `image/jpeg, image/png, image/webp, image/gif`
4. Cliquer sur **"Create bucket"**

### Étape 2 : Configurer les policies RLS

1. Aller dans **Supabase Dashboard > SQL Editor**
2. Exécuter le script : `supabase/CREATE_JESSICA_CONTENTIN_STORAGE.sql`
3. Ce script configure les policies RLS pour :
   - Permettre la lecture publique des images
   - Permettre aux super admins d'uploader des images
   - Permettre aux super admins de supprimer des images

## Structure des dossiers dans le bucket

Une fois le bucket créé, créez les dossiers suivants :

```
jessica-contentin/
├── hero/
│   └── jessica-contentin-hero.jpg
├── cta/
│   ├── consultations.jpg
│   ├── formations.jpg
│   └── ressources.jpg
└── pillars/
    ├── confiance.jpg
    ├── stress.jpg
    ├── tnd.jpg
    ├── neuroeducation.jpg
    ├── strategie.jpg
    └── orientation.jpg
```

## URLs des images

Une fois les images uploadées, les URLs seront au format :
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/jessica-contentin/hero/jessica-contentin-hero.jpg
https://[PROJECT_ID].supabase.co/storage/v1/object/public/jessica-contentin/cta/consultations.jpg
```

## Utilisation dans le code

Le code utilise actuellement des chemins locaux (`/jessica-contentin-hero.jpg`) avec des fallbacks vers Unsplash. Une fois les images uploadées dans Supabase Storage, vous pouvez :

1. Récupérer l'URL publique de chaque image depuis le dashboard Supabase
2. Mettre à jour les constantes dans `src/components/jessica-contentin/header.tsx` :
   ```typescript
   const HERO_IMAGE_SRC = "https://[PROJECT_ID].supabase.co/storage/v1/object/public/jessica-contentin/hero/jessica-contentin-hero.jpg";
   ```

## Notes

- Les images doivent être optimisées avant l'upload (compression, redimensionnement)
- Format recommandé : JPG pour les photos, PNG pour les logos/icônes
- Dimensions recommandées :
  - Hero : 1920x1080px minimum
  - CTA : 800x600px
  - Pillars : 1200x800px


