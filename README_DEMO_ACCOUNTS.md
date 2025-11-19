# 📚 Guide de création des comptes de démonstration

Ce guide explique comment créer les comptes de démonstration avec des données fictives pour tester l'application.

## 🎯 Comptes à créer

1. **Formateur** : `formateur@beyond.fr` (Tony Starck) - avec toutes les données fictives
2. **Apprenant** : `apprenant@beyond.fr` (Bruce Wayne)
3. **Tuteur** : `tuteur@beyond.fr` (Jean tutorat)

## 📋 Étapes

### Exécuter le script SQL (tout-en-un)

Le script SQL crée automatiquement tous les utilisateurs ET toutes les données fictives en une seule fois.

1. Allez sur **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `supabase/CREATE_DEMO_ACCOUNTS_AND_DATA.sql`
3. Copiez-collez le contenu dans l'éditeur SQL
4. Cliquez sur **Run**

**C'est tout !** Le script va :
- ✅ Créer tous les utilisateurs dans `auth.users` avec les mots de passe hashés
- ✅ Créer tous les profils
- ✅ Créer l'organisation et les membreships
- ✅ Créer toutes les données fictives (formations, parcours, groupes, etc.)

> **Note** : Si vous préférez créer les utilisateurs manuellement via l'interface Supabase, le script détectera les utilisateurs existants et créera uniquement les données manquantes.

## 🔑 Identifiants de connexion

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Formateur | `formateur@beyond.fr` | `formateur123` |
| Apprenant | `apprenant@beyond.fr` | `apprenant123` |
| Tuteur | `tuteur@beyond.fr` | `tuteur123` |
| Apprenant fictif 1 | `learner1@beyond.fr` | `learner123` |
| Apprenant fictif 2 | `learner2@beyond.fr` | `learner123` |
| Apprenant fictif 3 | `learner3@beyond.fr` | `learner123` |

## 📊 Données créées pour le formateur

### Apprenants fictifs
- Alice Martin (learner1@beyond.fr)
- Bob Dupont (learner2@beyond.fr)
- Clara Bernard (learner3@beyond.fr)

### Formations
1. **Introduction au Design Thinking**
   - Slug: `introduction-design-thinking`
   - Statut: Publié
   - Contenu: Sections et chapitres de démonstration

2. **UX Research Avancé**
   - Slug: `ux-research-avance`
   - Statut: Publié
   - Contenu: Sections et chapitres de démonstration

### Parcours
- **Parcours UX Complet**
  - Slug: `parcours-ux-complet`
  - Contient les 2 formations, 2 ressources et 2 tests

### Groupe
- **Groupe Débutants 2024**
  - Contient les 3 apprenants fictifs
  - Le parcours est assigné au groupe

### Ressources
1. Guide Complet du Design Thinking (PDF)
2. Fiche : Comment mener une interview utilisateur (PDF)

### Tests
1. Quiz : Les bases du Design Thinking (30 min)
2. Évaluation : Techniques de UX Research (45 min)

### Drive
- Dossier "Mes Documents"
  - Présentation Design Thinking.pdf
  - Notes de cours UX Research.docx

### Messages
1. Consigne de la semaine (envoyée aux 3 apprenants)
2. Message de félicitations (envoyé à Alice)

### Progrès
- Alice : 45% sur Formation 1, 35% sur Parcours, 85% au Test 1
- Bob : 30% sur Formation 1, 72% au Test 1

## 🔄 Réexécution

Pour réexécuter le script SQL :
- Les données existantes seront supprimées (sauf les utilisateurs)
- Les nouvelles données seront recréées
- Les utilisateurs ne seront pas supprimés

## ⚠️ Notes importantes

- Le script crée automatiquement tous les utilisateurs dans `auth.users` avec les mots de passe hashés
- Les utilisateurs existants seront détectés et réutilisés (pas de duplication)
- Les mots de passe sont simples pour faciliter les tests (à changer en production)
- Toutes les données sont fictives et uniquement pour la démonstration

## 🐛 Dépannage

### Erreur : "Permission denied" lors de l'insertion dans auth.users
- Vérifiez que vous êtes connecté en tant qu'admin dans Supabase SQL Editor
- Vérifiez que vous avez les permissions nécessaires pour insérer dans `auth.users`
- Si l'erreur persiste, créez les utilisateurs manuellement via l'interface Supabase Auth, puis réexécutez le script

### Erreur : "Extension pgcrypto does not exist"
- Le script active automatiquement l'extension `pgcrypto`
- Si l'erreur persiste, activez-la manuellement : `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

### Les données ne s'affichent pas
- Vérifiez que les RLS policies permettent l'accès
- Vérifiez que les utilisateurs sont bien membres de l'organisation
- Vérifiez que vous êtes connecté avec le bon compte

