# Configuration des Policies RLS pour Jessica CONTENTIN Storage

## Problème de permissions

Si vous obtenez l'erreur `ERROR: 42501: must be owner of relation objects`, cela signifie que vous n'avez pas les permissions nécessaires pour créer des policies directement via SQL.

## Solution : Utiliser l'interface Supabase

### Étape 1 : Vérifier que le bucket est public

1. Aller dans **Supabase Dashboard > Storage**
2. Cliquer sur le bucket **"jessica-contentin"**
3. Aller dans l'onglet **"Settings"** ou **"Configuration"**
4. Vérifier que **"Public bucket"** est activé (toggle ON)
5. Si ce n'est pas le cas, activez-le et sauvegardez

### Étape 2 : Créer les policies via l'interface

1. Dans le bucket **"jessica-contentin"**, aller dans l'onglet **"Policies"**
2. Cliquer sur **"New Policy"** ou **"Create Policy"**

#### Policy 1 : Lecture publique (OBLIGATOIRE)

- **Policy name** : `Public can view jessica contentin images`
- **Allowed operation** : `SELECT` (Read)
- **Target roles** : `public`
- **USING expression** :
  ```sql
  bucket_id = 'jessica-contentin'
  ```
- Cliquer sur **"Save"** ou **"Create"**

#### Policy 2 : Upload pour super admins (Optionnel)

- **Policy name** : `Super admins can upload jessica contentin images`
- **Allowed operation** : `INSERT` (Create)
- **Target roles** : `authenticated`
- **WITH CHECK expression** :
  ```sql
  bucket_id = 'jessica-contentin' AND
  EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE super_admins.user_id = auth.uid()
    AND super_admins.is_active = true
  )
  ```
- Cliquer sur **"Save"**

#### Policy 3 : Suppression pour super admins (Optionnel)

- **Policy name** : `Super admins can delete jessica contentin images`
- **Allowed operation** : `DELETE`
- **Target roles** : `authenticated`
- **USING expression** :
  ```sql
  bucket_id = 'jessica-contentin' AND
  EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE super_admins.user_id = auth.uid()
    AND super_admins.is_active = true
  )
  ```
- Cliquer sur **"Save"**

## Vérification

Après avoir créé les policies :

1. Testez l'URL de l'image directement dans votre navigateur :
   ```
   https://[VOTRE_PROJECT_ID].supabase.co/storage/v1/object/public/jessica-contentin/Copie%20de%20Copie%20de%20Copie%20de%20Copie%20de%20Sans%20titre.png
   ```

2. Si l'image s'affiche, les policies sont correctement configurées ✅

3. Si vous obtenez une erreur 403 ou 404, vérifiez :
   - Que le bucket est bien public
   - Que la policy de lecture publique existe
   - Que le nom du fichier correspond exactement

## Note importante

La **Policy 1 (lecture publique)** est **OBLIGATOIRE** pour que les images soient accessibles sur le site. Sans elle, les images ne se chargeront pas même si le bucket est marqué comme public.

