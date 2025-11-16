# 🔧 Correction du Problème de Redirection

## 🎯 Problème

Vous êtes **instructeur** mais redirigé vers le dashboard **apprenant**.

## 🔍 Cause Probable

Le **rôle dans la base de données est NULL** ou n'a pas été défini. Quand le rôle est NULL, le système vous redirige vers le dashboard apprenant par défaut.

## ✅ Solution Immédiate

### Étape 1 : Vérifier le Rôle dans Supabase

Exécutez dans **Supabase Studio → SQL Editor** :

```sql
-- Vérifier le rôle actuel
SELECT id, email, role, display_name, full_name
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';
```

**Si le rôle est `NULL`**, exécutez :

```sql
-- Mettre le rôle à instructor (formateur en frontend)
UPDATE public.profiles
SET role = 'instructor'
WHERE email = 'timmydarcy44@gmail.com';

-- Vérification
SELECT id, email, role
FROM public.profiles
WHERE email = 'timmydarcy44@gmail.com';
```

### Étape 2 : Déconnecter/Reconnecter

1. **Déconnectez-vous** de l'application (`/logout`)
2. **Reconnectez-vous** avec `timmydarcy44@gmail.com`
3. Vous devriez être redirigé vers `/dashboard/formateur`

### Étape 3 : Vérifier

Une fois reconnecté, vous devriez :
- ✅ Être redirigé vers `/dashboard/formateur`
- ✅ Voir le dashboard formateur avec les KPIs
- ✅ Ne plus voir les données mock (si vous avez du contenu)

## 🔧 Corrections Appliquées

J'ai modifié :
1. ✅ `src/app/page.tsx` : Utilise maintenant `getDashboardRouteForRole()` correctement
2. ✅ `src/lib/auth/session.ts` : Affiche un warning si le rôle est NULL

## ⚠️ Note Importante

Si après avoir mis le rôle à `instructor` vous êtes toujours redirigé vers apprenant :
1. Vérifiez la console (F12) pour les messages `[session]`
2. Vérifiez que la session est bien récupérée
3. Dites-moi ce que vous voyez dans la console

## 📝 Mapping des Rôles (Rappel)

- DB: `instructor` → Frontend: `formateur` → Route: `/dashboard/formateur`
- DB: `student` → Frontend: `apprenant` → Route: `/dashboard/apprenant`
- DB: `admin` → Frontend: `admin` → Route: `/admin`
- DB: `tutor` → Frontend: `tuteur` → Route: `/dashboard/tuteur`



