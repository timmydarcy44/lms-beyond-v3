# Guide de déploiement GitHub - Résolution du problème

## Problème
Le repository GitHub est vide, donc Vercel ne peut pas le déployer. Il faut d'abord pousser le code sur GitHub.

## Solution : Pousser le code sur GitHub

### Étape 1 : Vérifier que Git est installé

Ouvrez PowerShell ou CMD et exécutez :
```bash
git --version
```

Si Git n'est pas installé, téléchargez-le depuis : https://git-scm.com/download/win

### Étape 2 : Configurer Git (si pas déjà fait)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"
```

### Étape 3 : Initialiser le repository Git

Dans le dossier du projet (`C:\Users\ISPN Le Havre 1\Desktop\LMS`), exécutez :

```bash
# Initialiser Git
git init

# Vérifier le .gitignore (doit exclure node_modules, .next, .env.local, etc.)
# Le fichier .gitignore existe déjà dans le projet
```

### Étape 4 : Ajouter le remote GitHub

```bash
# Ajouter le remote (ou le mettre à jour s'il existe déjà)
git remote add origin https://github.com/timmydarcy44/lms-beyond-v3.git

# Si le remote existe déjà, le mettre à jour :
git remote set-url origin https://github.com/timmydarcy44/lms-beyond-v3.git
```

### Étape 5 : Ajouter tous les fichiers

```bash
git add .
```

### Étape 6 : Faire le commit initial

```bash
git commit -m "Initial commit: LMS Beyond v3 with Vercel configuration"
```

### Étape 7 : Pousser sur GitHub

```bash
# Créer et basculer sur la branche main
git branch -M main

# Pousser sur GitHub (vous devrez peut-être vous authentifier)
git push -u origin main
```

**Note** : Si vous êtes demandé de vous authentifier :
- Utilisez un **Personal Access Token** (pas votre mot de passe)
- Créez-en un ici : https://github.com/settings/tokens
- Sélectionnez les permissions : `repo` (accès complet aux repositories)

## Alternative : Utiliser GitHub Desktop

Si les commandes Git ne fonctionnent pas, utilisez **GitHub Desktop** :

1. Téléchargez GitHub Desktop : https://desktop.github.com/
2. Installez-le et connectez-vous avec votre compte GitHub
3. Cliquez sur "File" > "Add Local Repository"
4. Sélectionnez le dossier `C:\Users\ISPN Le Havre 1\Desktop\LMS`
5. Cliquez sur "Publish repository"
6. Sélectionnez `timmydarcy44/lms-beyond-v3`
7. Cliquez sur "Publish repository"

## Après avoir poussé le code

Une fois le code sur GitHub :

1. **Aller sur Vercel** : https://vercel.com
2. **Cliquer sur "Add New Project"**
3. **Importer le repository** `timmydarcy44/lms-beyond-v3`
4. **Configurer les variables d'environnement** (voir `GITHUB_VERCEL_SETUP.md`)
5. **Cliquer sur "Deploy"**

## Vérification

Pour vérifier que le code est bien sur GitHub :
- Allez sur : https://github.com/timmydarcy44/lms-beyond-v3
- Vous devriez voir tous les fichiers du projet

## Dépannage

### Erreur : "fatal: not a git repository"
→ Exécutez `git init` d'abord

### Erreur : "remote origin already exists"
→ Exécutez `git remote set-url origin https://github.com/timmydarcy44/lms-beyond-v3.git`

### Erreur : "Authentication failed"
→ Créez un Personal Access Token sur GitHub et utilisez-le comme mot de passe

### Erreur : "nothing to commit"
→ Vérifiez que vous avez des fichiers à commiter avec `git status`


