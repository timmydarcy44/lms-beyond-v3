# Accès à la page d'onboarding Beyond Connect

## 🔗 Liens d'accès

### Page d'onboarding complète
**URL locale :** `http://localhost:3000/beyond-connect-app/onboarding?force=true`

**URL production :** `https://votre-domaine.com/beyond-connect-app/onboarding?force=true`

> **Note :** Le paramètre `?force=true` permet d'accéder à la page même si le profil est déjà complété.

### Flux normal (sans force)
1. **Inscription :** `/beyond-connect/inscription`
2. **Confirmation email :** `/beyond-connect/confirmer?token=XXX&email=XXX`
3. **Onboarding automatique :** Redirection vers `/beyond-connect-app/onboarding`
4. **Espace candidat :** `/beyond-connect-app` (après complétion du profil)

## 📋 Fonctionnalités de la page d'onboarding

### Étape 1 : Informations personnelles
- Photo de profil (upload)
- Prénom *
- Nom *
- Email (pré-rempli, non modifiable)
- Numéro de téléphone
- Ville de résidence
- Date de naissance
- Bio

### Étape 2 : Études
- Études actuelles
- Niveau d'études

### Étape 3 : Expériences professionnelles
- Ajout/modification/suppression d'expériences
- Titre, entreprise, description, dates, localisation

### Étape 4 : Diplômes
- Ajout/modification/suppression de formations
- Diplôme, institution, domaine, dates, note

### Étape 5 : Type d'emploi recherché *
- CDI, CDD, Freelance, Alternance, Stage, Intérim, Temps partiel, Temps plein

### Étape 6 : Passions et jauge de qualification
- Passions et centres d'intérêt
- **Jauge de qualification** (0-100%) avec :
  - Barre de progression
  - Détails par élément (✅/❌)
  - Points obtenus / Points maximum
  - Message d'encouragement si score < 50%

## 🎯 Jauge de qualification

Le score est calculé sur 100 points :
- Photo de profil : 5 pts
- Prénom : 10 pts
- Nom : 10 pts
- Email : 5 pts
- Téléphone : 5 pts
- Ville : 5 pts
- Bio : 10 pts
- CV uploadé : 10 pts
- Expériences : 5 pts par expérience (max 15 pts)
- Formations : 5 pts par formation (max 15 pts)
- Type d'emploi : 5 pts

## 🚀 Espace candidat

Après complétion de l'onboarding, l'utilisateur accède à `/beyond-connect-app` avec :

### Actions rapides
- **Voir les annonces** → `/beyond-connect-app/jobs`
- **Modifier mon compte** → `/beyond-connect-app/profile`
- **Partager sur LinkedIn** → Ouvre le partage LinkedIn
- **Voir mon profil public** → `/beyond-connect-app/profile/public`

### Formations Beyond No School
- Section avec formations recommandées
- Lien vers le catalogue complet

### Tests Beyond No School
- Liste des tests disponibles (notamment Soft Skills)
- Affichage des tests complétés avec scores
- Lien direct pour passer les tests

## 📝 Script SQL à exécuter

Avant d'utiliser la page d'onboarding, exécutez le script SQL :
`supabase/ADD_BEYOND_CONNECT_PROFILE_FIELDS.sql`

Ce script ajoute les colonnes suivantes à la table `profiles` :
- `city` (TEXT) - Ville de résidence
- `cv_url` (TEXT) - URL du CV uploadé
- `cv_file_name` (TEXT) - Nom du fichier CV
- `cv_uploaded_at` (TIMESTAMPTZ) - Date d'upload
- `employment_type` (TEXT) - Type d'emploi recherché

## 🔧 Configuration requise

### Variables d'environnement
- `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_BEYOND_CONNECT_URL` pour les liens de confirmation
- `BREVO_API_KEY` pour l'envoi d'emails
- Configuration Supabase Storage pour l'upload de CV (bucket `beyond-connect` ou `public`)

### Buckets Supabase Storage
- Avatar : bucket `public` ou `uploads`
- CV : bucket `beyond-connect`, `public` ou `uploads`

