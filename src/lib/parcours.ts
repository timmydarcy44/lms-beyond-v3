import type { ParcoursFamille, ParcoursNiveau } from "@/lib/parcours-constants";

export type { ParcoursFamille, ParcoursNiveau };
export { FAMILLE_LABELS, NIVEAU_LABELS } from "@/lib/parcours-constants";

export type ParcoursModule = {
  code: string;
  titre: string;
  description: string;
};

export type ParcoursAddon = {
  id: string;
  titre: string;
  thematique: string;
  prix: number;
  /** Texte carte add-on (template narratif). */
  benefit?: string;
};

export type ParcoursProfil = {
  titre: string;
  desc: string;
};

export type ParcoursExpert = {
  nom: string;
  titre: string;
  institution: string;
  citation: string;
  image: string;
};

export type ParcoursAvantApres = {
  avant: string[];
  apres: string[];
};

export type ParcoursFaqItem = {
  q: string;
  r: string;
};

export type Parcours = {
  slug: string;
  titre: string;
  titreMarketing?: string;
  famille: ParcoursFamille;
  familleLabel: string;
  cible: string;
  duree: string;
  prix: number;
  description: string;
  /** Visuel dédié ; sinon image hero par défaut via `parcoursImageSrc()`. */
  imageUrl?: string;
  modules: ParcoursModule[];
  addons: ParcoursAddon[];
  livrables: string[];
  badge: string;
  speedMeeting: boolean;
  /** Champs page narrative (template commercial-ia). */
  promesse?: string;
  niveau?: ParcoursNiveau;
  equivalenceAcademique?: string;
  prerequis?: string[];
  profils?: ParcoursProfil[];
  avantApres?: ParcoursAvantApres;
  faq?: ParcoursFaqItem[];
  expert?: ParcoursExpert;
  narrativeTemplate?: boolean;
};

export function isParcoursNarrative(p: Parcours): boolean {
  return p.narrativeTemplate === true || (Boolean(p.profils?.length) && Boolean(p.promesse));
}

export const COMMERCIAL_IA_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/commercial%20ia%20edge%20(2).jpeg";

import { FAMILLE_LABELS } from "@/lib/parcours-constants";
import { PARCOURS_EXTENDED } from "@/lib/parcours-extended-entries";

const COMMERCIAL_IA_PARCOURS: Parcours = {
    slug: "commercial-ia",
    titre: "Commercial IA",
    titreMarketing: "Commercial Augmenté par l'IA.",
    famille: "performance",
    familleLabel: FAMILLE_LABELS.performance,
    cible: "Commerciaux, business developers et account managers",
    duree: "45h",
    prix: 890,
    description:
      "Prospecter, convaincre et conclure avec l'IA — sans perdre l'humain. Un parcours terrain centré sur votre pipe réel.",
    imageUrl: COMMERCIAL_IA_IMAGE_URL,
    modules: [
      { code: "CI-01", titre: "Prospection augmentée", description: "Listes qualifiées, personnalisation à l'échelle, priorisation des comptes." },
      { code: "CI-02", titre: "IA conversationnelle", description: "Scripts multicanal, tests d'angles, assistants IA opérationnels." },
      { code: "CI-03", titre: "Pipeline & closing", description: "CRM, signaux d'achat, méthode de conclusion." },
      { code: "CI-04", titre: "Éthique & conformité", description: "RGPD, relation client, usage responsable de l'IA." },
      { code: "CI-05", titre: "Cas terrain", description: "Role-plays et feedback experts sur vos rendez-vous." },
    ],
    addons: [
      { id: "ci-crm", titre: "Pack CRM avancé", thematique: "Automatisation", prix: 190 },
      { id: "ci-pitch", titre: "Atelier pitch", thematique: "Communication", prix: 290 },
      { id: "ci-coach", titre: "3h coaching individuel", thematique: "Accompagnement", prix: 390 },
    ],
    livrables: ["Playbook prospection IA", "Étude de cas signée", "Pitch vidéo 3 min", "Open Badge IMS Global"],
    badge: "Open Badge IMS Global",
    speedMeeting: true,
};

export const PARCOURS: Parcours[] = [COMMERCIAL_IA_PARCOURS, ...PARCOURS_EXTENDED];

export const PARCOURS_BY_FAMILLE = (["performance", "leadership", "humain", "innovation"] as const).map(
  (famille) => ({
    famille,
    label: FAMILLE_LABELS[famille],
    items: PARCOURS.filter((p) => p.famille === famille),
  }),
);

export function getParcours(slug: string): Parcours | undefined {
  return PARCOURS.find((p) => p.slug === slug);
}

/** Image de couverture parcours (dédiée ou hero par défaut). */
export function parcoursImageSrc(parcours: Parcours, defaultHeroUrl: string): string {
  return parcours.imageUrl ?? defaultHeroUrl;
}

export const EDGE_ONLINE_THEMATIQUES = [
  { slug: "ia-auto", label: "IA & Automatisation", modules: 15 },
  { slug: "negociation", label: "Négociation", modules: 7 },
  { slug: "leadership", label: "Leadership", modules: 7 },
  { slug: "cognition", label: "Cognition", modules: 7 },
  { slug: "soft-skills", label: "Soft Skills", modules: 7 },
  { slug: "vente", label: "Vente", modules: 8 },
  { slug: "communication", label: "Communication", modules: 6 },
  { slug: "management", label: "Management", modules: 9 },
  { slug: "productivite", label: "Productivité", modules: 5 },
  { slug: "rh", label: "RH & Talents", modules: 6 },
  { slug: "innovation", label: "Innovation", modules: 7 },
  { slug: "data", label: "Data & KPI", modules: 6 },
] as const;

export type EdgeExpert = {
  nom: string;
  titre: string;
  institution: string;
  specialiteEdge: string;
  image: string;
};

/** Experts EDGE — section homepage « Nos experts » */
export const EDGE_EXPERTS: EdgeExpert[] = [
  {
    nom: "Philippe Corrot",
    titre: "Ancien Directeur Marketing & Commercial Europe",
    institution: "Nike",
    specialiteEdge: "Stratégie commerciale & performance vente",
    image: "/images/expert-corrot.jpg",
  },
  {
    nom: "Miguel Farina",
    titre: "Head of Sales",
    institution: "Olympique Lyonnais",
    specialiteEdge: "Négociation commerciale sport & open badges",
    image: "/images/expert-farina.jpg",
  },
  {
    nom: "Jonathan Libert",
    titre: "Directeur Commercial",
    institution: "AS Nancy Lorraine",
    specialiteEdge: "Vente événementielle & partenariats sport",
    image: "/images/expert-libert.jpg",
  },
  {
    nom: "Nicolas Mel",
    titre: "Intervenant",
    institution: "Sciences Po",
    specialiteEdge: "Prise de parole & communication d'influence",
    image: "/images/expert-mel.jpg",
  },
];

/** @deprecated Utiliser EDGE_EXPERTS */
export const VALIDATEURS = EDGE_EXPERTS.map((e) => ({
  nom: e.nom,
  role: `${e.titre} — ${e.institution}`,
  image: e.image,
}));

export const TEMOIGNAGES = [
  {
    id: "1",
    quote: "Le parcours m'a forcé à livrer sur mon pipe réel. En 8 semaines, j'ai structuré ma prospection IA.",
    nom: "Marie L.",
    parcours: "Commercial IA",
    date: "Mars 2025",
    accentAvatar: true,
  },
  {
    id: "2",
    quote: "Chaque module se termine par un livrable que mon équipe utilise le lundi matin.",
    nom: "Thomas D.",
    parcours: "Leader de la Transformation",
    date: "Jan 2025",
    accentAvatar: false,
  },
  {
    id: "3",
    quote: "Le badge Open Badge a fait la différence lors du speed meeting.",
    nom: "Sarah K.",
    parcours: "Coach & Facilitateur",
    date: "Nov 2024",
    accentAvatar: false,
  },
] as const;

export const FAQ_EDGE_ONLINE = [
  {
    q: "Quelle différence entre EDGE Online et un parcours certifiant ?",
    a: "EDGE Online est l'accès libre aux micro-formations par thématique. Le parcours certifiant structure un programme avec livrables évalués et Open Badge IMS Global.",
  },
  {
    q: "Les badges thématiques sont-ils certifiants ?",
    a: "Ils attestent de la complétion d'une thématique. Seul le parcours certifiant délivre un badge vérifiable IMS Global.",
  },
  {
    q: "Puis-je passer au parcours certifiant ensuite ?",
    a: "Oui. Votre progression est reconnue : un conseiller EDGE vous propose l'upgrade adapté à votre profil.",
  },
  {
    q: "Comment résilier mon abonnement ?",
    a: "Résiliation en un clic depuis votre espace membre, sans engagement au-delà de la période en cours.",
  },
] as const;
