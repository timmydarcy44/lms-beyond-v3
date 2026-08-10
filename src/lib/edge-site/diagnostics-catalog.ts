import type { LucideIcon } from "lucide-react";
import {
  Brain,
  HeartHandshake,
  Crown,
  Network,
  Handshake,
  MessageSquare,
  Smile,
  HeartPulse,
  Briefcase,
  Compass,
  Sparkles,
  Users,
  Scale,
  Lightbulb,
  Palette,
  LayoutGrid,
  UsersRound,
  RefreshCw,
  Megaphone,
  ShieldAlert,
} from "lucide-react";

export type DiagnosticAudience = "Entreprise" | "CFA" | "École" | "Administration";

export type EdgeDiagnostic = {
  slug: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  icon: LucideIcon;
  durationMinutes: number;
  audiences: DiagnosticAudience[];
  skills: string[];
  reportItems: string[];
  /** Code produit affiché sur les cartes phares (ex. IDMC, SOFT, COMP). */
  productCode?: string;
  flagship?: boolean;
};

const DEFAULT_REPORT_ITEMS = [
  "Radar de compétences",
  "Forces",
  "Axes de progression",
  "Score détaillé",
  "Open Badges",
  "Recommandations IA",
  "Skills Wallet",
] as const;

function d(
  partial: Omit<EdgeDiagnostic, "reportItems" | "audiences" | "durationMinutes"> & {
    durationMinutes?: number;
    audiences?: DiagnosticAudience[];
    reportItems?: string[];
  },
): EdgeDiagnostic {
  return {
    ...partial,
    durationMinutes: partial.durationMinutes ?? 15,
    audiences: partial.audiences ?? ["Entreprise", "CFA", "École", "Administration"],
    reportItems: partial.reportItems ?? [...DEFAULT_REPORT_ITEMS],
  };
}

/** Catalogue extensible — ajouter une entrée ici suffit pour exposer carte + fiche. */
export const EDGE_DIAGNOSTICS: EdgeDiagnostic[] = [
  d({
    slug: "soft-skills",
    title: "Soft Skills",
    productCode: "SOFT",
    flagship: true,
    icon: HeartHandshake,
    durationMinutes: 20,
    shortDescription:
      "Évaluez les compétences comportementales qui font la différence au quotidien : coopération, communication, adaptabilité et leadership.",
    longDescription:
      "Le diagnostic Soft Skills EDGE cartographie les compétences comportementales critiques pour la performance collective. Chaque résultat alimente un rapport détaillé, des Open Badges et des recommandations IA pour personnaliser les parcours de développement.",
    skills: ["Communication", "Collaboration", "Autonomie", "Créativité", "Résilience", "Leadership"],
  }),
  d({
    slug: "idmc",
    title: "IDMC — Indice de Maîtrise Cognitive",
    productCode: "IDMC",
    flagship: true,
    icon: Brain,
    durationMinutes: 25,
    shortDescription:
      "Mesurez les leviers cognitifs de la performance : attention, raisonnement, flexibilité et stratégies d'apprentissage.",
    longDescription:
      "L'IDMC (Indice de Maîtrise Cognitive) évalue la façon dont une personne traite l'information, apprend et décide. Il produit un profil multi-axes pour orienter formations, coaching et plans de progression — avec radar, synthèse IA et intégration Skills Wallet.",
    skills: ["Attention", "Mémoire de travail", "Raisonnement", "Flexibilité", "Stratégies d'apprentissage"],
  }),
  d({
    slug: "test-comportemental",
    title: "Test comportemental",
    productCode: "COMP",
    flagship: true,
    icon: Compass,
    durationMinutes: 15,
    shortDescription:
      "Identifiez le style comportemental dominant pour mieux communiquer, manager et collaborer.",
    longDescription:
      "Le test comportemental EDGE révèle les préférences d'action, d'influence, de stabilité et de conformité. Il aide à comprendre les dynamiques d'équipe, à adapter le management et à fluidifier les interactions — avant d'engager un parcours de développement personnalisé.",
    skills: ["Action", "Influence", "Stabilité", "Rigueur", "Adaptation relationnelle"],
  }),
  d({
    slug: "competences-cognitives",
    title: "Compétences cognitives",
    icon: Brain,
    shortDescription: "Mesurez attention, mémoire de travail et vitesse de traitement.",
    longDescription:
      "Évaluez les capacités cognitives fondamentales pour anticiper la performance en situations complexes. Le diagnostic produit un profil objectif pour personnaliser les parcours de montée en compétences.",
    skills: ["Attention", "Mémoire de travail", "Raisonnement", "Vitesse de traitement", "Flexibilité"],
  }),
  d({
    slug: "leadership",
    title: "Leadership",
    icon: Crown,
    shortDescription: "Évaluez la capacité à inspirer, décider et faire grandir les équipes.",
    longDescription:
      "Mesurez les leviers de leadership opérationnel et stratégique. Le rapport croise vision, influence et coopération pour guider les parcours managers.",
    skills: ["Communication", "Vision", "Influence", "Décision", "Coopération", "Adaptabilité"],
  }),
  d({
    slug: "management-transversal",
    title: "Management transversal",
    icon: Network,
    shortDescription: "Diagnostiquez le pilotage sans lien hiérarchique direct.",
    longDescription:
      "Évaluez la capacité à coordonner des projets transverses, à mobiliser sans autorité formelle et à créer de l'alignement entre parties prenantes.",
    skills: ["Coordination", "Influence", "Négociation", "Priorisation", "Communication", "Suivi"],
  }),
  d({
    slug: "negociation-complexe",
    title: "Négociation complexe",
    icon: Handshake,
    shortDescription: "Mesurez préparation, écoute active et création de valeur.",
    longDescription:
      "Analysez les compétences de négociation en contexte multi-parties. Idéal pour commerciaux, acheteurs et dirigeants confrontés à des enjeux stratégiques.",
    skills: ["Préparation", "Écoute", "Argumentation", "Création de valeur", "Gestion des tensions"],
  }),
  d({
    slug: "communication",
    title: "Communication",
    icon: MessageSquare,
    shortDescription: "Évaluez clarté, impact et adaptation au destinataire.",
    longDescription:
      "Cartographiez les styles de communication orale et écrite pour renforcer l'efficacité relationnelle en interne comme auprès des clients.",
    skills: ["Clarté", "Écoute", "Storytelling", "Assertivité", "Adaptation"],
  }),
  d({
    slug: "intelligence-emotionnelle",
    title: "Intelligence émotionnelle",
    icon: Smile,
    shortDescription: "Mesurez conscience de soi, empathie et régulation émotionnelle.",
    longDescription:
      "Identifiez le niveau d'intelligence émotionnelle pour améliorer coopération, management et qualité de vie au travail.",
    skills: ["Conscience de soi", "Empathie", "Régulation", "Motivation", "Relations sociales"],
  }),
  d({
    slug: "gestion-du-stress",
    title: "Gestion du stress",
    icon: HeartPulse,
    shortDescription: "Évaluez les stratégies face à la pression et à la charge mentale.",
    longDescription:
      "Mesurez la capacité à maintenir performance et équilibre sous contrainte. Utile pour prévenir l'épuisement et adapter les accompagnements.",
    skills: ["Résilience", "Priorisation", "Récupération", "Régulation", "Demande d'aide"],
  }),
  d({
    slug: "employabilite",
    title: "Employabilité",
    icon: Briefcase,
    shortDescription: "Objectifez le potentiel d'insertion et d'évolution professionnelle.",
    longDescription:
      "Évaluez les compétences transversales et le positionnement marché pour construire des plans d'employabilité individuels et collectifs.",
    skills: ["Adaptabilité", "Compétences clés", "Projet pro", "Réseau", "Apprentissage continu"],
  }),
  d({
    slug: "orientation",
    title: "Orientation",
    icon: Compass,
    shortDescription: "Clarifiez motivations, préférences et pistes d'orientation.",
    longDescription:
      "Accompagnez les choix de parcours via un diagnostic d'orientation structuré, actionnable pour CFA, écoles et services RH.",
    skills: ["Motivations", "Intérêts", "Valeurs", "Projection", "Décision"],
  }),
  d({
    slug: "potentiel",
    title: "Potentiel",
    icon: Sparkles,
    shortDescription: "Identifiez les hauts potentiels et les trajectoires de croissance.",
    longDescription:
      "Mesurez le potentiel d'évolution pour nourrir les viviers talents, la mobilité interne et les plans de succession.",
    skills: ["Apprentissage", "Ambition", "Agilité", "Impact", "Leadership latent"],
  }),
  d({
    slug: "relation-client",
    title: "Relation client",
    icon: Users,
    shortDescription: "Évaluez écoute, orientation solution et expérience client.",
    longDescription:
      "Diagnostiquez les compétences relationnelles en contact client pour améliorer satisfaction, rétention et qualité de service.",
    skills: ["Écoute", "Empathie", "Résolution", "Professionnalisme", "Fidélisation"],
  }),
  d({
    slug: "prise-de-decision",
    title: "Prise de décision",
    icon: Scale,
    shortDescription: "Mesurez rigueur, jugement et vitesse sous incertitude.",
    longDescription:
      "Analysez la qualité des décisions en environnement ambigu. Le rapport oriente formations et coaching sur les biais et les méthodes.",
    skills: ["Analyse", "Jugement", "Priorisation", "Gestion du risque", "Exécution"],
  }),
  d({
    slug: "pensee-critique",
    title: "Pensée critique",
    icon: Lightbulb,
    shortDescription: "Évaluez capacité à questionner, synthétiser et argumenter.",
    longDescription:
      "Mesurez la pensée critique pour renforcer l'analyse d'information, la résolution de problèmes et la qualité des recommandations.",
    skills: ["Analyse", "Synthèse", "Questionnement", "Argumentation", "Objectivité"],
  }),
  d({
    slug: "creativite",
    title: "Créativité",
    icon: Palette,
    shortDescription: "Cartographiez idéation, originalité et passage à l'action.",
    longDescription:
      "Évaluez le potentiel créatif appliqué aux contextes professionnels : innovation produit, process et communication.",
    skills: ["Idéation", "Originalité", "Curiosité", "Expérimentation", "Mise en œuvre"],
  }),
  d({
    slug: "organisation",
    title: "Organisation",
    icon: LayoutGrid,
    shortDescription: "Mesurez planification, priorisation et fiabilité d'exécution.",
    longDescription:
      "Diagnostiquez l'efficacité organisationnelle individuelle pour améliorer livraison, coordination et charge de travail.",
    skills: ["Planification", "Priorisation", "Suivi", "Rigueur", "Anticipation"],
  }),
  d({
    slug: "travail-en-equipe",
    title: "Travail en équipe",
    icon: UsersRound,
    shortDescription: "Évaluez coopération, contribution et dynamique collective.",
    longDescription:
      "Mesurez les comportements collaboratifs pour renforcer la cohésion d'équipe et la performance collective.",
    skills: ["Coopération", "Fiabilité", "Feedback", "Partage", "Solidarité"],
  }),
  d({
    slug: "adaptabilite",
    title: "Adaptabilité",
    icon: RefreshCw,
    shortDescription: "Mesurez agilité face au changement et à l'incertitude.",
    longDescription:
      "Évaluez la capacité à pivoter, apprendre vite et rester efficace dans des environnements en transformation.",
    skills: ["Agilité", "Apprentissage", "Ouverture", "Résilience", "Initiative"],
  }),
  d({
    slug: "influence",
    title: "Influence",
    icon: Megaphone,
    shortDescription: "Évaluez persuasion éthique et capacité à fédérer.",
    longDescription:
      "Diagnostiquez les leviers d'influence utile en management, vente et conduite du changement.",
    skills: ["Persuasion", "Crédibilité", "Storytelling", "Alliance", "Assertivité"],
  }),
  d({
    slug: "gestion-des-conflits",
    title: "Gestion des conflits",
    icon: ShieldAlert,
    shortDescription: "Mesurez médiation, désescalade et sortie de crise.",
    longDescription:
      "Évaluez les compétences de prévention et de résolution des conflits pour protéger la performance et le climat social.",
    skills: ["Écoute", "Médiation", "Assertivité", "Négociation", "Régulation"],
  }),
];

export function getAllDiagnostics(): EdgeDiagnostic[] {
  return EDGE_DIAGNOSTICS;
}

export function getFlagshipDiagnostics(): EdgeDiagnostic[] {
  const flagged = EDGE_DIAGNOSTICS.filter((item) => item.flagship);
  const order = ["soft-skills", "idmc", "test-comportemental"];
  return order
    .map((slug) => flagged.find((item) => item.slug === slug))
    .filter(Boolean) as EdgeDiagnostic[];
}

export function getCatalogDiagnostics(): EdgeDiagnostic[] {
  return EDGE_DIAGNOSTICS.filter((item) => !item.flagship);
}

export function getDiagnosticBySlug(slug: string): EdgeDiagnostic | undefined {
  if (slug === "psychologie-comportementale") {
    return EDGE_DIAGNOSTICS.find((item) => item.slug === "test-comportemental");
  }
  return EDGE_DIAGNOSTICS.find((item) => item.slug === slug);
}

export function getDiagnosticSlugs(): string[] {
  return EDGE_DIAGNOSTICS.map((item) => item.slug);
}
