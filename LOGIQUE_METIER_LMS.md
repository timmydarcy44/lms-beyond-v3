# 📚 Logique Métier du LMS - Documentation Complète

## Introduction

Ce document décrit la logique métier complète de votre Learning Management System (LMS) basé sur l'analyse de la structure réelle de votre base de données Supabase. Il explique comment les différentes entités interagissent, comment les permissions sont gérées, et comment les données circulent dans le système.

---

## 1. Architecture Multi-Organisation (Multi-Tenant)

### Principe Fondamental

Votre LMS est conçu selon un modèle **multi-tenant** où chaque organisation (`organizations`) représente une entité indépendante (école, entreprise, organisme de formation) qui possède son propre espace isolé de contenu et d'utilisateurs.

### Tables Principales

**`organizations`** : Représente une organisation (ex: "Beyond Learning", une école, une entreprise).
- Chaque organisation possède un identifiant unique (`id`)
- Peut avoir un `slug` pour l'URL
- Contient des membres via `org_memberships`

**`org_memberships`** : Table de liaison entre utilisateurs et organisations, définissant le rôle de chaque membre.
- Un utilisateur (`user_id`) appartient à une organisation (`org_id`)
- Chaque appartenance a un **rôle** : `learner`, `instructor`, `admin`, ou `tutor`
- Cette table est le **cœur du système de permissions** : elle définit ce qu'un utilisateur peut voir et modifier au sein d'une organisation

**Logique** : Un utilisateur peut appartenir à plusieurs organisations avec des rôles différents dans chacune. Par exemple, un formateur peut être `instructor` dans "Beyond Learning" et `learner` dans une autre organisation où il se forme.

---

## 2. Gestion des Utilisateurs et Rôles

### Table `profiles`

Chaque utilisateur authentifié a un profil qui contient ses informations personnelles :
- Informations d'identité : `email`, `first_name`, `last_name`, `full_name`, `phone`, `avatar_url`
- **Rôle global** : `role` (`student`, `instructor`, `admin`, `tutor`) - ce rôle est un indicateur global, mais les permissions réelles viennent de `org_memberships`

### Hiérarchie des Rôles

**Dans `org_memberships` :**
1. **`learner`** (Apprenant) : 
   - Peut consulter le contenu qui lui est assigné
   - Peut soumettre des devoirs dans le Drive
   - Peut passer des tests qui lui sont assignés
   - Peut suivre sa progression

2. **`instructor`** (Formateur) :
   - Peut créer et modifier les formations (`formations`), tests, ressources
   - Peut gérer les groupes d'apprenants
   - Peut consulter les résultats des apprenants
   - Peut créer des consignes dans le Drive
   - Peut créer des parcours (`pathways`)

3. **`admin`** (Administrateur) :
   - Toutes les permissions de `instructor`
   - Peut gérer les utilisateurs de l'organisation
   - Peut créer et gérer les groupes
   - Peut créer d'autres administrateurs ou formateurs
   - Accès complet à toutes les données de l'organisation

4. **`tutor`** (Tuteur) :
   - Suit un ou plusieurs apprenants en alternance
   - Peut consulter les résultats et la progression de ses apprenants
   - Peut remplir des formulaires de suivi
   - Peut créer des missions adaptées à l'entreprise de l'apprenant

### Fonctions de Vérification

Le système utilise des fonctions PostgreSQL pour vérifier les permissions :
- `user_has_role(user_id, roles[])` : Vérifie si un utilisateur a un rôle dans la liste donnée
- `is_admin(org_id)`, `is_instructor(org_id)`, `is_learner(org_id)`, `is_tutor(org_id)` : Vérifications spécifiques par organisation

---

## 3. Structure des Formations et Contenu

### Hiérarchie des Formations

Le système utilise une structure hiérarchique pour organiser le contenu pédagogique :

**`formations`** (Formation/Cours principal)
- Appartient à une organisation (`org_id`)
- Créée par un formateur (`created_by`)
- Possède un mode de visibilité : `private`, `catalog_only`, ou `public`
- Contient des sections

**`sections`** (Sections/Modules)
- Appartient à une formation (`formation_id`)
- Appartient à une organisation (`org_id`) via la formation
- Contient des chapitres

**`chapters`** (Chapitres)
- Appartient à une section (`section_id`)
- Appartient à une organisation (`org_id`) via la section → formation
- Contient des sous-chapitres

**`subchapters`** (Sous-chapitres/Leçons)
- Appartient à un chapitre (`chapter_id`)
- Représente une leçon individuelle avec son contenu
- Peut contenir du contenu riche via `contents` ou `rich_contents`

**`contents`** (Contenu multimédia)
- Peut être lié à :
  - Une formation directement (`owner_formation_id`)
  - Un chapitre (`chapter_id`)
  - Un sous-chapitre (`subchapter_id`)
- Permet d'attacher des vidéos, audios, documents, textes enrichis

### Logique d'Accès au Contenu

Un apprenant peut accéder au contenu si :
1. Il est membre de l'organisation qui possède la formation (`org_memberships`)
2. **OU** la formation a une visibilité `public` ou `catalog_only`
3. **OU** la formation ou le contenu lui est explicitement assigné via `content_assignments`

**`content_assignments`** : Table de liaison permettant d'assigner du contenu à :
- Des apprenants individuels (`target_type = 'learner'`)
- Des groupes entiers (`target_type = 'group'`)

---

## 4. Système de Tests et Évaluations

### Table `tests`

Chaque test appartient à :
- Une organisation (`org_id`)
- Un propriétaire/créateur (`owner_id`)
- Peut avoir un mode de visibilité (`visibility_mode`)
- Peut être publié (`published = true/false`)

### Structure Avancée (via migration 002)

**`test_questions`** : Questions d'un test
- Type de question : `multiple` (choix multiples), `single` (choix unique), `open` (ouverte), `scale` (échelle)
- Chaque question peut avoir :
  - Des options (`test_question_options`)
  - Des règles de score par échelle (`test_question_scale_scores`)
  - Des règles de mots-clés pour questions ouvertes (`test_question_keyword_rules`)

**`test_assignments`** : Permet d'assigner un test à des apprenants ou groupes

**`test_sessions`** : Suit une tentative de test par un apprenant
- Enregistre le score obtenu, le score max, la durée, la durée active
- Statut : `in_progress`, `completed`, `abandoned`

**`test_responses`** : Stocke les réponses individuelles d'un apprenant pour chaque question
- Pour questions à choix : `selected_option_ids`
- Pour questions ouvertes : `open_answer`
- Pour questions échelle : `scale_value`

### Logique de Scoring

- **Questions à choix** : Score basé sur les options correctes sélectionnées
- **Questions échelle** : Score personnalisé selon la valeur choisie (ex: 1→1pt, 2→2pts, 3→3pts, ou 3→2pts, 2→1pt, 1→0pt)
- **Questions ouvertes** : Score basé sur la présence de mots-clés définis par le formateur

---

## 5. Système de Parcours (Pathways)

### Table `pathways`

Un parcours est un assemblage de formations, tests et ressources dans un ordre défini, créé par un formateur pour un objectif pédagogique précis.

**`pathway_items`** : Chaque élément du parcours
- Peut être une formation (`item_type = 'formation'`)
- Peut être un test (`item_type = 'test'`)
- Peut être une ressource (`item_type = 'resource'`)
- A un ordre dans le parcours

**`pathway_assignments`** : Permet d'assigner un parcours complet à :
- Des apprenants individuels
- Des groupes

**Logique** : Un parcours permet de structurer un parcours de formation complet (ex: "Négociateur Techno Commercial") en enchaînant plusieurs formations, tests de validation, et ressources complémentaires.

---

## 6. Système de Drive et Consignes

### Principe

Le Drive permet aux apprenants de créer et partager des documents avec leurs formateurs, et aux formateurs de créer des consignes (devoirs) pour leurs apprenants.

### Tables Principales

**`drive_consigne`** : Une consigne créée par un formateur
- Contient les instructions, attentes, date limite (`due_at`)
- Créée dans une organisation (`org_id`)
- Peut avoir un nom de dossier (`folder_name`)

**`drive_consigne_targets`** : Définit qui doit réaliser la consigne
- Peut cibler des apprenants individuels (`target_type = 'learner'`)
- Peut cibler des groupes (`target_type = 'group'`)

**`drive_folders`** : Dossier créé automatiquement pour chaque consigne
- Permet d'organiser les documents soumis
- Lié à une consigne (`consigne_id`)

**`drive_documents`** : Document créé par un apprenant
- Peut être un brouillon (`status = 'draft'`) - visible uniquement par l'auteur
- Peut être partagé (`status = 'shared'`) - visible par l'auteur et le formateur
- Stocke le score d'usage d'IA (`ai_usage_score`) pour aider le formateur à évaluer le travail réel de l'apprenant
- Stocke le nombre de mots (`word_count`)
- Peut être marqué comme lu (`is_read`) par le formateur
- Peut être en retard (`submitted_at > due_at`)

**Logique d'Affichage** :
- Un apprenant voit ses propres documents ET les consignes qui lui sont assignées
- Un formateur voit tous les documents partagés par ses apprenants, organisés par consigne/dossier
- Les documents en retard sont affichés en rouge, ceux à l'heure en vert

---

## 7. Système de Groupes

### Table `groups`

Un groupe représente un ensemble d'apprenants dans une organisation, souvent une classe ou une promotion.

**`group_members`** : Table de liaison entre apprenants et groupes
- Un apprenant peut appartenir à plusieurs groupes
- Permet d'assigner facilement du contenu, tests, ou consignes à tout un groupe d'un coup

**Logique** : Au lieu d'assigner individuellement une formation à 30 apprenants, on assigne la formation au groupe, et tous les membres y ont automatiquement accès.

---

## 8. Suivi de Progression et Badges

### Tables de Progression

**`course_progress`** : Suit la progression d'un apprenant dans un cours
- Pourcentage de complétion (`progress_percent`)
- Dernière date d'accès (`last_accessed_at`)

**`course_activity`** : Journal détaillé de l'activité d'un apprenant
- Enregistre les interactions avec le contenu
- Permet d'analyser l'engagement

**`learning_sessions`** : Sessions d'apprentissage détaillées
- Suit la durée totale et la durée active (temps réel d'attention)
- Permet de mesurer l'engagement réel vs le temps passé

**`learning_session_events`** : Événements dans une session
- Mouvements de souris, pauses, reprises, focus/blur
- Permet de détecter les périodes d'inactivité et calculer le "temps actif"

### Système de Badges

**`badges`** : Badges disponibles dans le système
- Code unique, label, description

**`learner_badges`** : Badges obtenus par un apprenant
- Lié à un cours (`course_id`)
- Délivré par un formateur (`issuer_id`)
- Date d'obtention

**Logique** : Les badges récompensent les accomplissements (completion de parcours, bons scores, etc.) et sont visibles dans le profil de l'apprenant.

---

## 9. Système de Messagerie

### Tables

**`messages`** : Messages envoyés
- Envoyé par un formateur ou apprenant (`sender_id`)

**`message_recipients`** : Destinataires d'un message
- Permet d'envoyer un message à plusieurs destinataires
- Chaque destinataire voit le message dans sa boîte de réception

**Logique** : Système de messagerie interne permettant aux apprenants de communiquer avec leurs formateurs et vice-versa, similaire à iMessage/WhatsApp.

---

## 10. Notifications

### Table `notifications`

Système de notifications pour informer les utilisateurs d'événements importants :
- Nouvelle consigne assignée
- Nouveau contenu disponible
- Nouvelle message reçu
- Badge obtenu
- etc.

Chaque notification :
- A un destinataire (`recipient_id`)
- Appartient à une organisation (`org_id`)
- Peut être marquée comme lue

---

## 11. Système de Ressources

### Table `resources`

Ressources pédagogiques indépendantes (guides, PDFs, vidéos, etc.) :
- Appartient à une organisation (`org_id`)
- Créée par un formateur (`owner_id`)
- Type : `guide`, `fiche`, `audio`, `video`, `autre`
- Mode de visibilité comme les formations

**`resource_assignments`** : Permet d'assigner des ressources à des apprenants ou groupes

**Logique** : Les ressources peuvent être utilisées seules ou intégrées dans des parcours.

---

## 12. Système Tuteur / Suivi Alternance

### Tables Principales

**`tutor_assignments`** : Association entre un tuteur et un apprenant
- Un tuteur peut suivre plusieurs apprenants
- Un apprenant peut avoir plusieurs tuteurs (selon les matières)
- Chaque assignment peut avoir un référentiel (`referential_id`) - ex: "Titre Pro NTC"

**`tutor_company_profiles`** : Profil de l'entreprise de l'apprenant
- Secteur, produits, services, clients, objectifs
- Permet au système d'IA de suggérer des missions adaptées

**`tutor_referential_library`** : Bibliothèque de référentiels
- Référentiels officiels (ex: Titre Pro, certifications)
- Contient les compétences, domaines, niveaux

**`tutor_mission_templates`** : Modèles de missions
- Missions types liées à un référentiel
- Difficulté, objectifs, timeline suggérée

**`tutor_generated_missions`** : Missions suggérées par l'IA
- Basées sur le profil entreprise et le référentiel
- Le tuteur peut accepter ou rejeter les suggestions

**`tutor_missions`** : Missions assignées à un apprenant
- Statut : `todo`, `in_progress`, `done`
- Date limite
- Suivi via `tutor_mission_logs`

**`tutor_followup_forms`** : Formulaires de suivi périodique
- Questions prédéfinies pour le suivi régulier
- Réponses stockées dans `tutor_followup_responses`

**Logique** : Le système permet au tuteur de suivre la progression de l'apprenant en entreprise, d'adapter les missions selon le contexte de l'entreprise, et de remplir les obligations de suivi de l'alternance.

---

## 13. Row Level Security (RLS) - Permissions au Niveau Base de Données

### Principe

Toutes les tables ont des **RLS policies** qui définissent ce qu'un utilisateur peut voir/modifier directement au niveau SQL, sans passer par la logique applicative.

### Exemples de Logique RLS

**Pour `courses`** :
- Un utilisateur peut voir un cours si : il en est le propriétaire (`owner_id = auth.uid()`) OU il est membre de l'organisation
- Un utilisateur peut modifier un cours seulement s'il en est le propriétaire

**Pour `drive_documents`** :
- Un apprenant peut voir/modifier ses propres documents
- Un formateur peut voir les documents partagés avec lui OU les documents de consignes qu'il a créées
- Les documents en brouillon sont invisibles aux formateurs

**Pour `tests`** :
- Les apprenants peuvent voir les tests qui leur sont assignés OU qui sont publics
- Les formateurs peuvent voir tous les tests de leur organisation
- Seuls les propriétaires peuvent modifier

**Logique générale** : Les RLS policies garantissent que même si une requête malveillante contourne l'application, un utilisateur ne peut jamais accéder à des données qui ne lui appartiennent pas.

---

## 14. Flux de Données Principaux

### Flux 1 : Création d'une Formation par un Formateur

1. Formateur crée une `formation` dans son organisation
2. Formateur ajoute des `sections` à la formation
3. Formateur ajoute des `chapters` dans chaque section
4. Formateur ajoute des `subchapters` dans chaque chapter
5. Formateur attache du contenu (`contents`) aux subchapters
6. Formateur peut créer des `flashcards` liées au cours
7. Formateur assigne la formation à des apprenants ou groupes via `content_assignments`
8. Les apprenants voient la formation dans leur dashboard
9. Les apprenants progressent, la progression est enregistrée dans `course_progress`

### Flux 2 : Passage d'un Test par un Apprenant

1. Apprenant voit un test assigné dans son dashboard
2. Apprenant clique "Commencer le test"
3. Système crée une `test_sessions` avec statut `in_progress`
4. Apprenant répond aux questions, système enregistre dans `test_responses`
5. Système calcule le score en temps réel
6. Apprenant soumet le test
7. Système met à jour `test_sessions` avec le score final et statut `completed`
8. Résultat visible par l'apprenant, le formateur, et le tuteur (si assigné)

### Flux 3 : Soumission d'un Document dans le Drive

1. Formateur crée une `drive_consigne` avec instructions et date limite
2. Formateur assigne la consigne à des apprenants ou groupes via `drive_consigne_targets`
3. Système crée automatiquement un `drive_folder` pour la consigne
4. Les apprenants assignés voient la consigne dans leur Drive
5. Apprenant crée un `drive_documents` avec statut `draft`
6. Apprenant écrit son document, système calcule `word_count` et `ai_usage_score`
7. Apprenant partage le document (`status = 'shared'`, `shared_with = formateur_id`)
8. Formateur voit le document avec badge "Non lu"
9. Formateur marque comme lu (`is_read = true`)
10. Si `submitted_at > due_at`, document affiché en rouge "En retard"

### Flux 4 : Création d'un Parcours par un Formateur

1. Formateur crée un `pathway` dans son organisation
2. Formateur ajoute des `pathway_items` (formations, tests, ressources) dans l'ordre
3. Formateur assigne le parcours à des apprenants ou groupes via `pathway_assignments`
4. Les apprenants voient le parcours dans leur dashboard avec progression globale
5. Le système calcule la progression du parcours basée sur la complétion de chaque item

---

## 15. Isolation Multi-Organisation

### Principe Clé

**Toutes les données sont isolées par organisation** :
- Un formateur de "Beyond Learning" ne peut pas voir les formations de "Autre École"
- Un apprenant ne voit que le contenu de ses organisations
- Les groupes sont isolés par organisation

**Mécanisme** :
- Chaque entité (formation, test, ressource, groupe) a un `org_id`
- Les RLS policies vérifient systématiquement l'appartenance à l'organisation via `org_memberships`
- Un utilisateur doit être membre d'une organisation pour voir son contenu

---

## 16. Calcul de Progression

### Pour un Cours

La progression d'un apprenant dans un cours est calculée en fonction :
- Du nombre de sous-chapitres complétés
- Du nombre de ressources consultées
- Des tests passés avec succès

Stockée dans `course_progress.progress_percent` (0-100).

### Pour un Parcours

La progression globale d'un parcours est calculée en fonction :
- De la complétion de chaque élément (formation, test, ressource)
- Chaque élément a un poids (peut être défini dans `pathway_items`)

---

## 17. Tracking d'Engagement

### Temps Actif vs Temps Total

Le système distingue :
- **Temps total** : Temps écoulé depuis le début de la session
- **Temps actif** : Temps réellement passé à interagir (souris, clavier, focus)

**Calcul** :
- Détection d'inactivité après 5 minutes sans interaction
- Pause automatique du timer
- Reprise lors de la reprise d'interaction

Stocké dans `learning_sessions.duration_active_seconds`.

---

## 18. Logique d'Affectation de Contenu

### Mécanisme Flexible

Le contenu peut être accessible via trois canaux :

1. **Par organisation** : Tous les membres d'une organisation voient le contenu avec visibilité `public` ou `catalog_only`

2. **Par affectation directe** :
   - `content_assignments` pour formations/contenu
   - `test_assignments` pour tests
   - `resource_assignments` pour ressources
   - `pathway_assignments` pour parcours complets

3. **Par groupe** : Affectation à un groupe, tous les membres y ont accès

**Priorité** : Si un contenu est explicitement assigné ET a une visibilité publique, l'apprenant y a accès. La visibilité publique permet la découverte, l'affectation garantit la visibilité même si privé.

---

## Conclusion

Cette architecture permet un LMS flexible, sécurisé, et scalable qui supporte :
- Plusieurs organisations indépendantes
- Plusieurs rôles avec permissions granulaires
- Contenu structuré hiérarchiquement
- Suivi détaillé de la progression et de l'engagement
- Collaboration via Drive et Messagerie
- Suivi personnalisé via le système Tuteur

Tous ces éléments sont orchestrés par les **RLS policies** qui garantissent la sécurité et l'isolation des données au niveau base de données, rendant le système robuste même en cas de failles applicatives.




