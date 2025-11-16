#!/bin/bash

echo "========================================"
echo "Déploiement sur GitHub"
echo "========================================"
echo ""

# Vérifier si git est initialisé
if [ ! -d .git ]; then
    echo "Initialisation de Git..."
    git init
fi

# Vérifier et configurer le remote
echo "Configuration du remote GitHub..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/timmydarcy44/lms-beyond-v3.git

# Ajouter tous les fichiers
echo "Ajout des fichiers..."
git add .

# Faire le commit
echo "Création du commit..."
git commit -m "Initial commit: LMS Beyond v3 with Vercel configuration" || echo "Aucun changement à commiter ou commit déjà fait."

# Pousser sur GitHub
echo "Poussage sur GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "========================================"
echo "Terminé!"
echo "========================================"
echo ""
echo "Prochaines étapes:"
echo "1. Aller sur https://vercel.com"
echo "2. Cliquer sur 'Add New Project'"
echo "3. Importer le repository timmydarcy44/lms-beyond-v3"
echo "4. Configurer les variables d'environnement"
echo "5. Déployer!"
echo ""

