# Dépannage : Image du header Jessica CONTENTIN ne se charge pas

## Erreur : "Bucket not found"

Si vous obtenez l'erreur `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`, cela signifie que l'ID du bucket utilisé dans le code ne correspond pas à l'ID réel du bucket dans Supabase.

## Solution : Trouver l'ID exact du bucket

### Étape 1 : Trouver l'ID du bucket

1. Allez dans **Supabase Dashboard > Storage**
2. Cliquez sur le bucket **"Jessica CONTENTIN"**
3. Allez dans l'onglet **"Settings"** ou **"Configuration"**
4. Cherchez le champ **"Bucket ID"** ou **"ID"** (différent du nom affiché)
5. Copiez cet ID exact

### Étape 2 : Mettre à jour le code

Une fois que vous avez l'ID exact du bucket, modifiez le fichier `src/components/jessica-contentin/header.tsx` :

```typescript
// Ligne ~39, remplacez :
const BUCKET_NAME = "jessica-contentin"; // ⚠️ ID actuel (incorrect)

// Par l'ID exact que vous avez trouvé, par exemple :
const BUCKET_NAME = "jessica_contentin"; // Si l'ID est avec underscore
// ou
const BUCKET_NAME = "jessica-contentin"; // Si l'ID est avec tiret
// ou tout autre ID que vous avez trouvé
```

### Étape 3 : Vérifier que le bucket est public

1. Dans les **Settings** du bucket
2. Vérifiez que **"Public bucket"** est activé (toggle ON)
3. Si ce n'est pas le cas, activez-le et sauvegardez

### Étape 4 : Créer la policy RLS (si pas déjà fait)

1. Dans le bucket, allez dans l'onglet **"Policies"**
2. Créez une policy :
   - **Name** : `Public can view jessica contentin images`
   - **Operation** : `SELECT`
   - **Target roles** : `public`
   - **USING** : `bucket_id = '[ID_EXACT_DU_BUCKET]'` (remplacez par l'ID exact)

### Étape 5 : Tester

1. Redémarrez le serveur de développement
2. Vérifiez la console du navigateur
3. L'image devrait maintenant se charger

## Note

Le nom affiché dans l'interface Supabase ("Jessica CONTENTIN") peut être différent de l'ID utilisé dans les URLs. C'est l'ID qui compte, pas le nom affiché.


