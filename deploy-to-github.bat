@echo off
echo ========================================
echo Deploiement sur GitHub
echo ========================================
echo.

REM Vérifier si git est initialisé
git status >nul 2>&1
if errorlevel 1 (
    echo Initialisation de Git...
    git init
)

REM Vérifier et configurer le remote
echo Configuration du remote GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/timmydarcy44/lms-beyond-v3.git

REM Ajouter tous les fichiers
echo Ajout des fichiers...
git add .

REM Faire le commit
echo Creation du commit...
git commit -m "Initial commit: LMS Beyond v3 with Vercel configuration" 2>nul
if errorlevel 1 (
    echo Aucun changement a commiter ou commit deja fait.
)

REM Pousser sur GitHub
echo Poussage sur GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo Termine!
echo ========================================
echo.
echo Prochaines etapes:
echo 1. Aller sur https://vercel.com
echo 2. Cliquer sur "Add New Project"
echo 3. Importer le repository timmydarcy44/lms-beyond-v3
echo 4. Configurer les variables d'environnement
echo 5. Deployer!
echo.
pause

