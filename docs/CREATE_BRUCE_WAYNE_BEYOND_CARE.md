# Création du compte de test Bruce Wayne pour Beyond Care

Ce guide explique comment créer le compte de test **Bruce Wayne** (`demo@beyondcenter.fr`) avec des données mockées pour Beyond Care, à la fois pour l'apprenant et pour l'entreprise.

## 📋 Prérequis

- Avoir `NEXT_PUBLIC_SUPABASE_URL` dans `.env.local`
- Avoir `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`
- Avoir Node.js installé

## 🚀 Étapes

### 1. Créer les comptes utilisateurs et l'organisation

Exécutez le script Node.js pour créer :
- Le compte apprenant : **Bruce Wayne** (`demo@beyondcenter.fr`)
- Le compte admin : **Alfred Pennyworth** (`admin@beyondcenter.fr`)
- L'organisation : **Beyond Center Demo**

```bash
node scripts/create-bruce-wayne-beyond-care.js
```

Ce script va :
- ✅ Créer les utilisateurs dans Supabase Auth
- ✅ Créer les profils dans la table `profiles`
- ✅ Créer l'organisation "Beyond Center Demo"
- ✅ Ajouter les utilisateurs à l'organisation (apprenant et admin)
- ✅ Activer Beyond Care pour l'organisation

### 2. Créer les données mockées

Exécutez le script SQL dans Supabase pour créer :
- 2 questionnaires (hebdomadaire et mensuel)
- 6 questions
- 9 réponses (2 semaines de données)
- 3 assessments
- 12 indicateurs (4 semaines de données)

**Option A : Via l'interface Supabase**
1. Allez dans votre projet Supabase
2. Allez dans "SQL Editor"
3. Copiez-collez le contenu de `supabase/CREATE_BRUCE_WAYNE_BEYOND_CARE_DATA.sql`
4. Cliquez sur "Run"

**Option B : Via la CLI Supabase**
```bash
supabase db execute -f supabase/CREATE_BRUCE_WAYNE_BEYOND_CARE_DATA.sql
```

## 🔑 Identifiants de connexion

### Apprenant (Bruce Wayne)
- **Email** : `demo@beyondcenter.fr`
- **Mot de passe** : `Demo123!@#`
- **Rôle** : Apprenant
- **Accès** : Dashboard apprenant → Beyond Care

### Admin (Alfred Pennyworth)
- **Email** : `admin@beyondcenter.fr`
- **Mot de passe** : `Admin123!@#`
- **Rôle** : Admin
- **Accès** : Dashboard formateur → Beyond Care (vue entreprise)

## 📊 Données mockées créées

### Questionnaires
1. **Questionnaire hebdomadaire de bien-être**
   - Fréquence : Hebdomadaire (vendredi 18h)
   - 3 questions (bien-être, stress, motivation)

2. **Évaluation mensuelle approfondie**
   - Fréquence : Mensuelle (lundi 8h)
   - 3 questions (bien-être général, gestion du stress, relations sociales)

### Réponses
- **Semaine 1** (il y a 1 semaine) : Réponses modérées
- **Semaine 2** (cette semaine) : Réponses améliorées
- **Mois dernier** : Réponses pour le questionnaire mensuel

### Assessments
- 3 assessments avec scores et analyses détaillées
- Tendances d'amélioration visibles

### Indicateurs
- 4 semaines de données historiques
- Indicateurs : Stress, Bien-être, Motivation
- Évolution visible sur les graphiques

## ✨ Utilisation

Une fois les scripts exécutés, vous pouvez :

1. **Se connecter en tant qu'apprenant** (`demo@beyondcenter.fr`)
   - Accéder au dashboard apprenant
   - Voir les questionnaires disponibles
   - Consulter vos résultats et indicateurs
   - Voir l'évolution de votre bien-être

2. **Se connecter en tant qu'admin** (`admin@beyondcenter.fr`)
   - Accéder au dashboard formateur
   - Voir le dashboard Beyond Care (vue entreprise)
   - Consulter les statistiques globales
   - Voir la liste des apprenants et leurs indicateurs
   - Identifier les apprenants à risque

## 🔄 Réexécution

Si vous devez réexécuter les scripts :
- Le script JS mettra à jour les comptes existants (mots de passe, etc.)
- Le script SQL peut être réexécuté, mais il créera des doublons si les données existent déjà
- Pour repartir de zéro, supprimez manuellement les données dans Supabase avant de réexécuter

## 📝 Notes

- Les mots de passe sont définis dans le script JS et peuvent être modifiés
- Les données mockées sont réalistes et montrent une évolution positive
- Les indicateurs sont calculés sur 4 semaines pour avoir un historique visible
- Les assessments incluent des analyses détaillées avec forces et axes d'amélioration

