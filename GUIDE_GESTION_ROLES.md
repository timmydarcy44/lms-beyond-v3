# 👥 Guide de Gestion des Rôles

## 🎯 Mapping des Rôles

**Frontend (français)** → **Base de données (anglais)**
- `formateur` → `instructor`
- `apprenant` → `student`
- `admin` → `admin`
- `tuteur` → `tutor`

## 📝 Changer le Rôle d'un Utilisateur

### Option 1 : Via SQL (Recommandé)

Exécutez dans **Supabase Studio → SQL Editor** :

```sql
-- Pour donner le rôle formateur
UPDATE public.profiles
SET role = 'instructor'
WHERE email = 'email_utilisateur@exemple.com';

-- Pour donner le rôle apprenant
UPDATE public.profiles
SET role = 'student'
WHERE email = 'email_utilisateur@exemple.com';

-- Pour donner le rôle admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'email_utilisateur@exemple.com';

-- Pour donner le rôle tuteur
UPDATE public.profiles
SET role = 'tutor'
WHERE email = 'email_utilisateur@exemple.com';
```

### Option 2 : Via Supabase Studio (Interface)

1. Allez dans **Supabase Studio → Table Editor**
2. Cliquez sur la table **`profiles`**
3. Trouvez l'utilisateur (via email ou nom)
4. Modifiez la colonne **`role`**
5. Entrez la valeur en **anglais** : `instructor`, `student`, `admin`, ou `tutor`
6. Sauvegardez

## 🔍 Vérifier le Rôle d'un Utilisateur

```sql
SELECT id, email, display_name, full_name, role
FROM public.profiles
WHERE email = 'email_utilisateur@exemple.com';
```

## ⚠️ Important

- Les rôles dans la base de données sont **toujours en anglais**
- Le mapping vers le français est automatique dans le code frontend (`session.ts`)
- Utilisez toujours les valeurs anglaises dans la DB









