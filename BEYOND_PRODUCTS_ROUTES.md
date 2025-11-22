# Listing des pages d'accès direct - Produits Beyond

## 📚 Beyond No School (Catalogue public)

### Pages publiques (sans authentification)
- **Catalogue principal** : `/dashboard/catalogue`
- **Catalogue par type** :
  - Modules : `/dashboard/catalogue?type=modules`
  - Parcours : `/dashboard/catalogue?type=parcours`
  - Ressources : `/dashboard/catalogue?type=ressources`
  - Tests : `/dashboard/catalogue?type=tests`
- **Détails d'un contenu** :
  - Module : `/dashboard/catalogue/module/[id]`
  - Parcours : `/dashboard/catalogue/parcours/[id]`
  - Ressource : `/dashboard/catalogue/ressource/[id]`
  - Test : `/dashboard/catalogue/test/[id]`
- **Bibliothèque** : `/dashboard/catalogue/library`
- **Recherche** : `/dashboard/catalogue/search`
- **Assistance** : `/dashboard/catalogue/help`
- **Compte** : `/dashboard/catalogue/account`

### Pages authentifiées
- **Mon compte** : `/dashboard/catalogue/account`
- **Bibliothèque personnelle** : `/dashboard/catalogue/library`

---

## 📝 Beyond Note (Scanner de documents avec IA)

### Application dédiée
- **Page principale** : `/beyond-note-app`
- **Document spécifique** : `/beyond-note-app/[documentId]`

### Pages publiques (landing)
- **Page de présentation** : `/pages/beyond-note`
- **Page alternative** : `/beyond-note`

### Pages Super Admin
- **Gestion Beyond Note** : `/super/premium/beyond-note`

---

## 🎮 Beyond Play (Apprentissage par immersion)

### Pages Super Admin
- **Gestion Beyond Play** : `/super/premium/beyond-play`

### Pages publiques (landing)
- **Page de présentation** : `/pages/fonctionnalites#beyond-play`

---

## ❤️ Beyond Care (Santé mentale et questionnaires)

### Pages apprenant (authentifiées)
- **Dashboard apprenant** : `/dashboard/apprenant/beyond-care`
- **Questionnaires** : `/dashboard/apprenant/questionnaires`
- **Questionnaire spécifique** : `/dashboard/apprenant/questionnaires/[questionnaireId]`

### Pages formateur/admin (authentifiées)
- **Dashboard formateur** : `/dashboard/formateur/beyond-care`
- **Dashboard admin** : `/admin/beyond-care`

### Pages Super Admin
- **Gestion Beyond Care** : `/super/premium/beyond-care`
- **Créer un questionnaire** : `/super/premium/beyond-care/questionnaires/new`
- **Questionnaire spécifique** : `/super/premium/beyond-care/questionnaires/[questionnaireId]`

### Pages publiques (landing)
- **Page de présentation** : `/pages/beyond-care`

---

## 🎓 Beyond LMS (Plateforme principale)

### Dashboard principal
- **Page d'accueil** : `/` (redirige vers `/loading` puis dashboard selon le rôle)
- **Page de chargement** : `/loading`
- **Dashboard général** : `/dashboard`
- **Landing page** : `/landing`

### Dashboard apprenant
- **Dashboard apprenant** : `/dashboard/apprenant`
- **Formations** : `/dashboard/formations`
- **Parcours** : `/dashboard/parcours`
- **Ressources** : `/dashboard/ressources`
- **Tests** : `/dashboard/tests`
- **Drive** : `/dashboard/drive`
- **To-Do List** : `/dashboard/apprenant/todo`
- **Communauté** : `/dashboard/communaute`
- **Mon compte** : `/dashboard/mon-compte`
- **Paramètres** : `/dashboard/parametres`

### Dashboard formateur
- **Dashboard formateur** : `/dashboard/formateur`
- **Formations** : `/dashboard/formateur/formations`
- **Créer une formation** : `/dashboard/formateur/formations/new`
- **Parcours** : `/dashboard/formateur/parcours`
- **Ressources** : `/dashboard/formateur/ressources`
- **Tests** : `/dashboard/formateur/tests`
- **Apprenants** : `/dashboard/formateur/apprenants`
- **Drive** : `/dashboard/formateur/drive`
- **Communauté** : `/dashboard/communaute`

### Dashboard tuteur
- **Mes alternants** : `/dashboard/tuteur`
- **Formulaires** : `/dashboard/tuteur/formulaires`
- **Missions** : `/dashboard/tuteur/missions`
- **To-Do List** : `/dashboard/tuteur/todo`
- **Messagerie** : `/dashboard/communaute`

### Dashboard admin
- **Dashboard admin** : `/admin`
- **Apprenants** : `/admin/apprenants`
- **Créer un apprenant** : `/admin/apprenants/new`
- **Groupes** : `/admin/groupes`
- **Créer un groupe** : `/admin/groupes/new`
- **Formations** : `/admin/formations`
- **Formation spécifique** : `/admin/formations/[slug]`
- **Parcours** : `/admin/parcours`
- **Parcours spécifique** : `/admin/parcours/[slug]`
- **Ressources** : `/admin/ressources`
- **Ressource spécifique** : `/admin/ressources/[slug]`
- **Tests** : `/admin/tests`
- **Test spécifique** : `/admin/tests/[slug]`
- **To-Do** : `/admin/todo`
- **Catalogue** : `/admin/catalogue`
- **Beyond Care** : `/admin/beyond-care`
- **Super Admin** : `/admin/super`

### Dashboard Super Admin
- **Dashboard Super Admin** : `/super`
- **Studio** : `/super/studio`
- **Modules** : `/super/studio/modules`
- **Créer un module** : `/super/studio/modules/new`
- **Créer un module (choix)** : `/super/studio/modules/new/choose`
- **Créer un module (validation)** : `/super/studio/modules/new/validate`
- **Créer un module (métadonnées)** : `/super/studio/modules/new/metadata`
- **Formations** : `/super/studio/formations`
- **Organisations** : `/super/organisations`
- **Utilisateurs** : `/super/utilisateurs`
- **Statistiques** : `/super/statistiques`
- **Chiffre d'affaires** : `/super/chiffre-affaires`
- **Agenda** : `/super/agenda`
- **Alertes** : `/super/alertes`
- **Gamification** : `/super/gamification`
- **IA** : `/super/ia`
- **Pages CMS** : `/super/pages`
- **Paramètres** : `/super/parametres`
- **Catalogue** : `/super/catalogue`
- **Premium** :
  - Beyond Care : `/super/premium/beyond-care`
  - Beyond Note : `/super/premium/beyond-note`
  - Beyond Play : `/super/premium/beyond-play`

### Authentification
- **Login** : `/login`
- **Signup** : `/signup`
- **Mot de passe oublié** : `/forgot-password`
- **Réinitialiser le mot de passe** : `/reset-password`
- **Callback auth** : `/auth/callback`

---

## 🔗 Beyond Connect (CV numérique et recrutement)

### Application dédiée (authentifiée)
- **Page principale** : `/beyond-connect-app`
- **Mon CV** : `/beyond-connect-app` (onglets : Vue d'ensemble, Expériences, Formation, Compétences, Certifications, Projets, Langues, Badges, Résultats)

### Espace apprenant
- **CV numérique** : `/beyond-connect-app`
- **Offres d'emploi** : `/beyond-connect-app/jobs`
- **Détail d'une offre** : `/beyond-connect-app/jobs/[id]`

### Espace professionnel (entreprises)
- **Dashboard entreprises** : `/beyond-connect-app/companies`
- **Vue d'ensemble** : `/beyond-connect-app/companies?tab=overview`
- **Offres d'emploi** : `/beyond-connect-app/companies?tab=jobs`
- **CVthèque** : `/beyond-connect-app/companies?tab=cv-library`
- **Matchings** : `/beyond-connect-app/companies?tab=matches`
- **Créer une offre** : `/beyond-connect-app/companies/jobs/new`
- **Détail d'une offre** : `/beyond-connect-app/companies/jobs/[id]`

### Pages publiques
- **Offres d'emploi publiques** : `/beyond-connect-app/jobs` (accessible sans authentification pour consulter)

---

## 📋 Résumé par produit

| Produit | Route principale | Authentification requise |
|---------|-----------------|-------------------------|
| **Beyond No School** | `/dashboard/catalogue` | Non (publique) |
| **Beyond Note** | `/beyond-note-app` | Oui |
| **Beyond Play** | `/super/premium/beyond-play` | Oui (Super Admin) |
| **Beyond Care** | `/dashboard/apprenant/beyond-care` | Oui |
| **Beyond LMS** | `/dashboard` | Oui |
| **Beyond Connect** | `/beyond-connect-app` | Oui |

---

## 🔐 Notes importantes

1. **Authentification** : La plupart des pages nécessitent une authentification. Les redirections se font automatiquement vers `/login` avec le paramètre `next` pour revenir à la page demandée après connexion.

2. **Rôles** : Certaines pages sont accessibles uniquement selon le rôle :
   - **Apprenant** : `/dashboard/apprenant/*`
   - **Formateur** : `/dashboard/formateur/*`
   - **Tuteur** : `/dashboard/tuteur/*`
   - **Admin** : `/admin/*`
   - **Super Admin** : `/super/*`

3. **Multi-tenant** : Beyond No School peut être accessible via différents domaines selon la configuration tenant (voir `src/lib/tenant/config.ts`).

4. **Beyond Connect** : L'espace professionnel nécessite d'être membre d'une organisation avec les droits admin/instructor.

---

*Dernière mise à jour : 2025-01-21*

