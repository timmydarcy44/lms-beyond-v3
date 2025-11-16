# Guide : Corriger l'affichage de Beyond Care dans la sidebar

## Problème

Beyond Care n'apparaît pas dans la sidebar pour les apprenants même si la fonctionnalité est activée pour leur organisation.

## Cause

Les politiques RLS (Row Level Security) de la table `organization_features` ne permettent qu'aux admins de voir les fonctionnalités, pas aux apprenants.

## Solution

### 1. Exécuter le script SQL de correction

Exécutez le script suivant dans Supabase Studio (SQL Editor) :

```sql
-- Voir le fichier : supabase/FIX_ORGANIZATION_FEATURES_RLS_FOR_ALL_MEMBERS.sql
```

Ce script :
- Supprime l'ancienne politique qui limitait l'accès aux admins
- Crée une nouvelle politique qui permet à **tous les membres** de l'organisation de voir les fonctionnalités activées
- Maintient les permissions pour les super admins et les admins

### 2. Vérifier l'activation de Beyond Care

1. Connectez-vous en tant que Super Admin (`timdarcypro@gmail.com`)
2. Allez sur `/super/organisations`
3. Sélectionnez l'organisation de Jessica CONTENTIN
4. Cliquez sur "Fonctionnalités Premium"
5. Vérifiez que "Beyond Care" est bien activé (switch vert)

### 3. Vérifier les logs

Après avoir exécuté le script SQL, reconnectez-vous avec `j.contentin@laposte.net` et vérifiez les logs dans la console du navigateur :

- `[beyond-care-sidebar] Access check result:` devrait afficher `{ hasAccess: true }`
- `[beyond-care/check-access] Final result:` devrait afficher `true`

### 4. Si le problème persiste

Vérifiez dans Supabase :

1. **Vérifier que la fonctionnalité est bien activée** :
```sql
SELECT * FROM organization_features 
WHERE feature_key = 'beyond_care' 
AND is_enabled = true;
```

2. **Vérifier que l'utilisateur est bien membre de l'organisation** :
```sql
SELECT om.*, o.name as org_name 
FROM org_memberships om
JOIN organizations o ON o.id = om.org_id
WHERE om.user_id = (SELECT id FROM auth.users WHERE email = 'j.contentin@laposte.net');
```

3. **Vérifier les politiques RLS** :
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'organization_features';
```

Vous devriez voir la politique "All organization members can view enabled features".

## Test

1. Déconnectez-vous et reconnectez-vous avec `j.contentin@laposte.net`
2. La sidebar devrait maintenant afficher "Beyond Care" avec une icône cœur
3. Cliquez dessus pour accéder au dashboard Beyond Care

## Diagnostic

Si le problème persiste, exécutez le script de vérification :

```sql
-- Voir le fichier : supabase/VERIFY_BEYOND_CARE_SETUP.sql
```

Ce script vérifie :
- Que la fonctionnalité est bien activée
- Que l'utilisateur est bien membre de l'organisation
- Que la fonction RPC `has_feature` fonctionne
- Que les politiques RLS sont correctes

## Vérification dans la console du navigateur

Ouvrez la console du navigateur (F12) et vérifiez les logs :

1. `[beyond-care-sidebar] Access check result:` devrait afficher `{ hasAccess: true }`
2. `[beyond-care/check-access] RPC result:` devrait afficher `{ hasAccessRPC: true, error: null }`
3. `[beyond-care/check-access] Final result:` devrait afficher `true`

Si vous voyez des erreurs, notez-les et vérifiez :
- Que le script SQL a bien été exécuté
- Que l'utilisateur est bien dans l'organisation qui a Beyond Care activé
- Que la fonctionnalité est bien activée dans la table `organization_features`

