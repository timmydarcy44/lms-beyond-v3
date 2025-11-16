# Beyond LMS – Dossier de présentation

## 1. Vision générale du Beyond LMS

Beyond LMS est une plateforme d’apprentissage unifiée qui aide les organisations à concevoir, distribuer et animer des expériences pédagogiques complètes. L’architecture s’appuie sur quatre piliers :

- **Expérience apprenante personnalisée** : parcours contextualisés, recommandations intelligentes et outils d’accompagnement (focus mode, pomodoro, accessibilité DYS, assistant IA).
- **Productivité pédagogique** : builder modulaire pour créer sections, chapitres et sous-chapitres, glisser-déposer, historique des générations IA, bibliothèque de transformations réutilisables.
- **Pilotage temps réel** : tableaux de bord role-based, suivi des progrès, assignation de parcours, historique des transformations IA et journalisation des coûts d’API.
- **Écosystème extensible** : modules métiers (Beyond Care, Beyond Note, Beyond Play, Beyond No School) activables selon les besoins, intégrations IA (OpenAI, Anthropic) et Supabase pour la donnée.

L’objectif est d’offrir une plateforme unique où l’apprenant retrouve son contenu, le formateur dispose d’outils de création et d’animation, et l’organisation suit la valeur créée par les expériences proposées.

---

## 2. Beyond Care – Bien-être et engagement apprenant

Beyond Care place la santé mentale et l’équilibre personnel au cœur du parcours. Les apprenants bénéficient d’un espace immersif aux couleurs `#c91459`, pensé comme un univers à part entière.

**Fonctionnalités clés**
- Questionnaires neuroscientifiques (Likert, QCU, ouvert) avec analyse IA experte en psychopédagogie.
- Visualisation claire des résultats : radar interactif, badges d’interprétation du score, synthèse structurée (profil, points forts, axes d’amélioration, pistes métiers).
- Historique des bilans, alertes sur les variations fortes et exports PDF brandés Beyond Care.
- Tableau de bord organisationnel agrégé : tendances, moyennes par dimension, alertes comportementales.

**Bénéfices**
- Transformer un questionnaire en un véritable outil d’accompagnement.
- Offrir un retour exploitable immédiatement à l’apprenant comme à l’équipe pédagogique.
- Inscrire le suivi du bien-être dans la continuité des apprentissages plutôt qu’à côté.

---

## 3. Beyond Note – IA au service des contenus

Beyond Note digitalise et enrichit les documents pédagogiques. L’utilisateur importe un PDF ou un support, l’IA analyse et propose plusieurs transformations réutilisables.

**Fonctionnalités clés**
- Extraction de texte fiable (Vision + OCR) et normalisation automatique.
- 6 transformations IA : reformulation multi-styles, audio multivoix OpenAI, carte mentale, schéma timeline, synthèse structurée, etc.
- Mise en cache des productions pour éviter les appels doublons et bâtir une bibliothèque personnelle.
- Interface responsive avec lecteur audio intégré, vue mind map (React D3 Tree) et timeline “tube”.
- Journalisation des dépenses IA pour piloter les budgets d’usage.

**Bénéfices**
- Gagner du temps sur la création de variantes pédagogiques.
- Produire des supports accessibles (audio, visualisations, plans actions).
- Garder une trace des transformations pour capitaliser d’une session à l’autre.

---

## 4. Beyond Play – Gamification et scénarios immersifs

Beyond Play apporte la dimension expérientielle : simulations, mises en situation filmées et entraînements interactifs.

**Fonctionnalités clés**
- Gestion de scénarios de gamification : regroupement automatique des médias par contexte, suivi du nombre de vidéos, date de création.
- Bibliothèque vidéo dédiée (API `/gamification/videos`) pour centraliser les assets pédagogiques.
- Création de missions pas-à-pas (workflow “Créer un scénario”) avec actions rapides “Jouer” et “Gérer”.
- Intégration avec les expériences Beyond (focus, pomodoro, accessibilité) pour maintenir l’engagement pendant les sessions.

**Bénéfices**
- Transformer un cours en parcours narratif ou en entrainement immersif.
- Donner aux équipes pédagogiques un outil pour itérer sur des expériences émotionnelles et scénarisées.
- Consolider les médias de gamification au même endroit pour simplifier la production.

---

## 5. Beyond No School – Catalogue stratégique

Beyond No School incarne la vitrine de l’offre pédagogique : un catalogue centralisé pour organiser formations, tests, ressources et programmes.

**Fonctionnalités clés**
- Vue unifiée des contenus (modules, parcours, ressources, tests) avec filtres dynamiques et branding personnalisable.
- Expérience “Apple-like” : menu supérieur iconique, cartes éditoriales, navigation fluide sur desktop et mobile.
- Assignation rapide de parcours aux organisations partenaires et visibilité sur l’état d’activation des solutions (Beyond Care, Beyond Note, Beyond Play).
- Préparation à la diffusion B2C/B2B : possibilité de styliser le catalogue en monochrome, d’ajouter hero sections et de gérer les accès par organisation.

**Bénéfices**
- Piloter la diffusion des offres pédagogiques depuis un catalogue maîtrisé.
- Donner une vision claire des expériences disponibles pour les équipes commerciales et pédagogiques.
- Harmoniser l’image de marque “Beyond” sur l’ensemble des parcours proposés.

---

### Conclusion

Beyond LMS fédère quatre expériences complémentaires pour couvrir tout le cycle de valeur : concevoir des modules, accompagner les apprenants, enrichir les contenus et scénariser l’engagement. En combinant IA, design soigné et gouvernance fine de la donnée, la plateforme crée un environnement cohérent où chaque public trouve les outils nécessaires pour apprendre, progresser et se transformer.


