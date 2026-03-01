import { getSupabasePublicUrl } from "@/lib/supabase-public-url";
import {
  BarChart3,
  BookOpen,
  FileText,
  FolderOpen,
  Layers,
  MessageSquare,
  Wand2,
} from "lucide-react";

const BUCKET_NAME = "Center";

const storageUrl = (path: string) =>
  getSupabasePublicUrl(BUCKET_NAME, path);

export type FeatureSlug =
  | "builder"
  | "parcours"
  | "drive"
  | "messagerie"
  | "tests"
  | "analytics";

export type FeatureSummary = {
  slug: FeatureSlug;
  label: string;
  description: string;
  href: string;
  icon: typeof Layers;
  mediaUrl?: string;
};

export type FeatureSection = {
  title: string;
  description: string;
  bullets?: string[];
};

export type FeatureContent = FeatureSummary & {
  headline: string;
  subheadline: string;
  heroDescription: string;
  outcomes: string[];
  sections: FeatureSection[];
  metrics?: { label: string; value: string }[];
};

const builderImage = storageUrl("Builder.png") || storageUrl("builder.png");
const aiImage =
  storageUrl("creation cours.png") ||
  storageUrl("creation cours.jpg") ||
  storageUrl("creation/creation cours.png");
const templatesImage =
  storageUrl("templates premium.png") ||
  storageUrl("templates premium.jpg");

export const FEATURES: Record<FeatureSlug, FeatureContent> = {
  builder: {
    slug: "builder",
    label: "Builder",
    description: "Créez des parcours premium sans écrire une ligne de code.",
    href: "/beyond-center/fonctionnalites/builder",
    icon: Wand2,
    mediaUrl: builderImage,
    headline: "Builder modulaire ultra-intuitif",
    subheadline: "Structurez, personnalisez, publiez en un temps record.",
    heroDescription:
      "Composez des expériences pédagogiques d’exception avec un éditeur pensé pour les équipes pédagogiques et marketing. Du storyboard à la mise en ligne, tout est fluide et visuel.",
    outcomes: [
      "Éditeur drag-and-drop avec composants premium",
      "Bibliothèque de templates prêts à l’emploi",
      "Versioning, brouillons et publication en un clic",
      "Optimisation automatique pour mobile et desktop",
    ],
    sections: [
      {
        title: "Un éditeur qui booste la créativité",
        description:
          "Choisissez un template, ajoutez des modules vidéo, quiz, exercices en direct… Le builder s’adapte à votre charte et vous fait gagner un temps précieux.",
        bullets: [
          "Palette de blocs intelligents (texte, média, interactions, IA)",
          "Collaboration en temps réel avec commentaires intégrés",
          "Intégration directe des ressources depuis Beyond Drive",
        ],
      },
      {
        title: "Personnalisation avancée de vos parcours",
        description:
          "Définissez des séquences, conditions d’accès, prérequis et contenus adaptatifs pour proposer une expérience ultra-personnalisée.",
        bullets: [
          "Gestion des prérequis et scénarios de réussite",
          "Duplication rapide pour décliner vos formats",
          "Contrôle précis des versions et des traductions",
        ],
      },
    ],
    metrics: [
      { label: "Temps moyen de création", value: "-60%" },
      { label: "Templates disponibles", value: "45+" },
      { label: "Blocs interactifs", value: "80+" },
    ],
  },
  parcours: {
    slug: "parcours",
    label: "Parcours",
    description: "Orchestrez l’ensemble du parcours apprenant.",
    href: "/beyond-center/fonctionnalites/parcours",
    icon: BookOpen,
    mediaUrl: aiImage,
    headline: "Orchestration de parcours intelligente",
    subheadline: "Adaptez chaque étape aux besoins individuels.",
    heroDescription:
      "Créez des parcours sur mesure qui s’adaptent automatiquement au rythme et au profil de chaque apprenant. Suivez les progrès en temps réel et optimisez l’engagement.",
    outcomes: [
      "Cartographie visuelle du parcours et des jalons",
      "Automatisations basées sur les résultats des évaluations",
      "Expériences différenciées pour chaque persona",
    ],
    sections: [
      {
        title: "Des parcours dynamiques et adaptatifs",
        description:
          "Configurez les déclencheurs, actions et messages pour accompagner chaque apprenant au bon moment.",
        bullets: [
          "Gestion des cohortes et des sessions synchrones",
          "Automatisation des relances et des feedbacks",
          "Suivi du niveau d’engagement et alertes intelligentes",
        ],
      },
      {
        title: "Pilotage pédagogique de bout en bout",
        description:
          "Centralisez calendrier, ressources, lives, évaluations et reporting dans une seule interface.",
        bullets: [
          "Vue chronologique, kanban ou checklist",
          "Exports détaillés pour l’équipe pédagogique",
          "Compatibilité avec modules blended et hybrides",
        ],
      },
    ],
    metrics: [
      { label: "Taux d’achèvement moyen", value: "+32%" },
      { label: "Actions automatisables", value: "120+" },
      { label: "Notifications intelligentes", value: "Personnalisées" },
    ],
  },
  drive: {
    slug: "drive",
    label: "Drive",
    description: "Centralisez toutes vos ressources pédagogiques.",
    href: "/beyond-center/fonctionnalites/drive",
    icon: FolderOpen,
    mediaUrl: templatesImage,
    headline: "Drive pédagogique sécurisé",
    subheadline: "Bibliothèque centralisée, prête pour la diffusion.",
    heroDescription:
      "Images, vidéos, scripts, documents officiels… organisez tout votre patrimoine pédagogique dans un drive intelligent qui se connecte au Builder, aux parcours et aux reporting.",
    outcomes: [
      "Taxonomie intelligente et recherche sémantique",
      "Gestion des droits avancée par équipe et par typologie",
      "Versioning, commentaires, validations et audit trail",
    ],
    sections: [
      {
        title: "Un hub unique pour tout votre contenu",
        description:
          "Centralisez vos médias, scripts et documents officiels et retrouvez-les instantanément grâce à une recherche augmentée.",
        bullets: [
          "Reconnaissance automatique des formats et métadonnées",
          "Prévisualisation haute qualité pour tous les médias",
          "Sauvegarde automatique et historique complet",
        ],
      },
      {
        title: "Distribution fluide vers vos parcours",
        description:
          "Connectez directement vos contenus au Builder, aux campagnes marketing et à vos exports physiques.",
        bullets: [
          "Glisser-déposer vers le Builder et la timeline parcours",
          "Gestion multisite et multi-marques",
          "CDN performant pour streaming international",
        ],
      },
    ],
    metrics: [
      { label: "Fichiers stockés", value: "Illimité" },
      { label: "Disponibilité CDN", value: "99.9%" },
      { label: "Temps moyen d’import", value: "-45%" },
    ],
  },
  messagerie: {
    slug: "messagerie",
    label: "Messagerie",
    description: "Animez vos communautés et maintenez le lien.",
    href: "/beyond-center/fonctionnalites/messagerie",
    icon: MessageSquare,
    headline: "Messagerie collaborative intégrée",
    subheadline: "Renforcez la cohésion et le suivi en continu.",
    heroDescription:
      "Channels, messages privés, annonces, réponses assistées par IA : toute la communication est centralisée dans votre LMS pour garder vos apprenants motivés et accompagnés.",
    outcomes: [
      "Channels thématiques et messaging privé sécurisés",
      "Automatisation des messages clés du parcours",
      "Assistant IA pour répondre aux questions fréquentes",
    ],
    sections: [
      {
        title: "Communication multicanale unifiée",
        description:
          "Animez vos communautés, envoyez des annonces ciblées et organisez des sessions live directement depuis la plateforme.",
        bullets: [
          "Messages programmés et scénarisés",
          "Intégration email, push et SMS",
          "Réponses générées par IA validées par l’équipe pédagogique",
        ],
      },
      {
        title: "Support et coaching individualisé",
        description:
          "Offrez un accompagnement humain grâce à l’assignation automatique des mentors, et suivez les conversations clés.",
        bullets: [
          "Assistance multilingue",
          "Escalade rapide vers l’équipe support",
          "Analyse du sentiment pour détecter les signaux faibles",
        ],
      },
    ],
    metrics: [
      { label: "Temps moyen de réponse", value: "-50%" },
      { label: "Satisfaction apprenant", value: "4.8/5" },
      { label: "Canaux simultanés", value: "Illimités" },
    ],
  },
  tests: {
    slug: "tests",
    label: "Tests",
    description: "Évaluez, certifiez et automatisez vos corrections.",
    href: "/beyond-center/fonctionnalites/tests",
    icon: FileText,
    headline: "Tests & certifications intelligents",
    subheadline: "Concevez des évaluations avancées qui révèlent le potentiel.",
    heroDescription:
      "QCM adaptatifs, études de cas vidéos, évaluations orales… configurez des tests riches et laissez l’IA vous assister pour l’analyse des résultats et la délivrance des attestations.",
    outcomes: [
      "Bibliothèque de questions intelligentes, pondérations automatiques",
      "Détection anti-triche et surveillance en ligne",
      "Certification digitale et intégration badges Open Badge",
    ],
    sections: [
      {
        title: "Des évaluations modernes et engageantes",
        description:
          "Créez des scénarios immersifs, combinez QCM, questions ouvertes, enregistrements vidéo et évaluations pratiques.",
        bullets: [
          "Banques de questions personnalisables",
          "Algorithmes adaptatifs en fonction des réponses",
          "Chronométrage et paramètres d’accessibilité avancés",
        ],
      },
      {
        title: "Pilotage complet de la réussite",
        description:
          "Analysez les résultats, gérez les jurys, délivrez automatiquement les attestations et badges.",
        bullets: [
          "Tableaux de bords détaillés par promotion et par compétence",
          "Corrections assistées par IA et double validation",
          "Export des résultats vers vos SI RH ou CRM",
        ],
      },
    ],
    metrics: [
      { label: "Formats d’évaluation", value: "10+" },
      { label: "Temps de correction", value: "-70%" },
      { label: "Badges & certificats", value: "Automatisés" },
    ],
  },
  analytics: {
    slug: "analytics",
    label: "Analytics",
    description: "Pilotez vos programmes avec des insights actionnables.",
    href: "/beyond-center/fonctionnalites/analytics",
    icon: BarChart3,
    headline: "Analytics & reporting en temps réel",
    subheadline: "Mesurez l’impact pédagogique et business de vos formations.",
    heroDescription:
      "Visualisez l’engagement, les performances et la progression de chaque cohorte. Identifiez les points de friction et optimisez vos contenus en continu.",
    outcomes: [
      "Tableaux de bord personnalisables par rôle",
      "Analyse predictive de la complétion et du churn",
      "Exports automatisés vers vos outils BI et finance",
    ],
    sections: [
      {
        title: "Des insights pour chaque équipe",
        description:
          "Direction L&D, formateurs, managers… chacun dispose d’une vue dédiée avec les KPI qui comptent.",
        bullets: [
          "KPIs pédagogiques, business et conformité",
          "Rapports planifiés et partage sécurisé",
          "Comparaison multi-cohortes et multi-sites",
        ],
      },
      {
        title: "Optimisation continue de vos programmes",
        description:
          "Détectez les chapitres à retravailler, identifiez les apprenants en risque et automatisez les plans d’action.",
        bullets: [
          "Heatmaps d’engagement et analyses qualitatives",
          "Segmentation intelligente de vos apprenants",
          "Connexion aux objectifs business et RH",
        ],
      },
    ],
    metrics: [
      { label: "Rapports temps réel", value: "35+" },
      { label: "Connecteurs natifs", value: "8+" },
      { label: "Alertes intelligentes", value: "Personnalisables" },
    ],
  },
};

export const FEATURE_LIST: FeatureSummary[] = Object.values(FEATURES).map(
  ({
    slug,
    label,
    description,
    href,
    icon,
    mediaUrl,
  }) => ({
    slug,
    label,
    description,
    href,
    icon,
    mediaUrl,
  })
);



