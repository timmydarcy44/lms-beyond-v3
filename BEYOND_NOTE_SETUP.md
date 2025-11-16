# Configuration Beyond Note

## Problème actuel : Erreur 500

L'erreur 500 est probablement due à :
1. **Table `beyond_note_documents` manquante**
2. **Bucket Supabase Storage `beyond-note` manquant**

## Étapes de configuration

### 1. Créer les tables dans Supabase

1. Aller dans **Supabase Dashboard > SQL Editor**
2. Exécuter le script : `supabase/CREATE_BEYOND_NOTE_TABLES.sql`
3. Vérifier que les tables sont créées :
   - `beyond_note_documents`
   - `beyond_note_ai_results`

### 2. Créer le bucket Storage

1. Aller dans **Supabase Dashboard > Storage**
2. Cliquer sur **"New bucket"**
3. Configurer :
   - **Nom** : `beyond-note`
   - **Public** : `Oui` (pour accès public aux fichiers)
   - **File size limit** : `52428800` (50 MB)
   - **Allowed MIME types** : `image/jpeg, image/png, image/gif, image/webp, application/pdf`

### 3. Configurer les policies RLS pour Storage

1. Aller dans **Supabase Dashboard > SQL Editor**
2. Exécuter le script : `supabase/CREATE_BEYOND_NOTE_STORAGE.sql`

Ce script configure les policies RLS pour :
- Permettre aux utilisateurs authentifiés d'uploader leurs propres fichiers
- Permettre la lecture publique des fichiers
- Permettre aux utilisateurs de supprimer leurs propres fichiers

## Vérification

Après avoir exécuté les scripts, vérifiez dans la console du navigateur que les erreurs ont disparu. Les messages d'erreur devraient maintenant être plus détaillés et indiquer exactement ce qui manque.

## Notes

- Les scripts SQL sont idempotents (peuvent être exécutés plusieurs fois sans problème)
- Si la table n'existe pas, l'upload fonctionnera mais le document ne sera pas enregistré en base de données
- Si le bucket n'existe pas, l'upload échouera avec un message explicite


