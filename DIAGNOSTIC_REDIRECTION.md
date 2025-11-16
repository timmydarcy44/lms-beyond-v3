# 🔍 Diagnostic - Redirection vers Dashboard Apprenant

## 🎯 Problème

Vous êtes connecté en tant qu'**instructeur** mais vous êtes redirigé vers le dashboard **apprenant**.

## 🔍 Causes Possibles

### 1. Le rôle dans la DB est NULL ou manquant

Si le rôle dans `profiles` est `NULL`, le mapping retourne `"apprenant"` par défaut.

**Vérification** : Exécutez dans Supabase Studio :

```sql
SELECT id, email, role, display_name, full_name
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';
```

**Solution** : Si le rôle est NULL, mettez-le à jour :
```sql
UPDATE public.profiles
SET role = 'instructor'
WHERE email = 'timmydarcy44@gmail.com';
```

### 2. Le mapping ne fonctionne pas

Vérifiez dans la console du navigateur (F12) si vous voyez des erreurs liées à `session` ou `role`.

### 3. Cache de session

La session peut être mise en cache. Déconnectez-vous et reconnectez-vous.

## ✅ Solutions Immédiates

### Étape 1 : Vérifier le Rôle dans la DB

Exécutez dans Supabase Studio :

```sql
-- Vérifier le rôle de Timmy
SELECT id, email, role, display_name, full_name
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';

-- Si le rôle est NULL, le mettre à jour
UPDATE public.profiles
SET role = 'instructor'
WHERE email = 'timmydarcy44@gmail.com';
```

### Étape 2 : Déconnecter/Reconnecter

1. Déconnectez-vous de l'application
2. Reconnectez-vous
3. Vérifiez où vous êtes redirigé

### Étape 3 : Vérifier les Logs

Ouvrez la console (F12) et cherchez :
- Messages `[session]`
- Erreurs liées à `role`
- Messages de redirection

## 🔧 Corrections Appliquées

J'ai modifié `src/app/page.tsx` pour utiliser `getDashboardRouteForRole()` qui gère mieux le mapping des rôles.

## 📝 Test

1. Vérifiez le rôle dans la DB (requête SQL ci-dessus)
2. Mettez-le à `instructor` si nécessaire
3. Déconnectez-vous/reconnectez-vous
4. Vous devriez être redirigé vers `/dashboard/formateur`




