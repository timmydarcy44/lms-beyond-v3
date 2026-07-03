import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import {
  EDGE_SPECIALISTS,
  EDGE_TESTIMONIALS,
  type EdgeSpecialist,
} from "@/lib/edge-site/training-catalog-human";
import {
  enrichFormationCard,
  FORMATION_SCENE_PHOTOS,
} from "@/lib/edge-site/training-formation-card";
import {
  formatTrainingFormats,
  getBadgeById,
  getLevelLabel,
  getTrainingDomain,
} from "@/lib/edge-site/training-catalog";

export type TrainingReview = {
  author: string;
  role: string;
  company: string;
  rating: number;
  text: string;
  photoUrl: string;
};

export type TrainingModuleDetail = {
  module: TrainingModule;
  domainTitle: string;
  badgeName: string;
  levelLabel: string;
  formatsLabel: string;
  duration: string;
  price: string;
  prerequisite: string;
  public: string;
  benefit: string;
  methodology: string[];
  exercises: string[];
  casPratiques: string[];
  competences: string[];
  program: { title: string; duration: string }[];
  faq: { q: string; a: string }[];
  trainers: EdgeSpecialist[];
  sessions: { date: string; city: string; seats: string; price: string }[];
  satisfaction: string;
  whyFollow: string[];
  reviews: TrainingReview[];
  heroImage: string;
  galleryImages: string[];
};

function pickTrainers(module: TrainingModule): EdgeSpecialist[] {
  const domain = module.domainId;
  if (domain.includes("intelligence") || domain.includes("automatisation")) {
    return EDGE_SPECIALISTS.filter((s) => s.id === "timmy" || s.id === "karim");
  }
  if (domain.includes("leadership") || domain.includes("communication")) {
    return EDGE_SPECIALISTS.filter((s) => s.id === "marie" || s.id === "jessica");
  }
  return [EDGE_SPECIALISTS[0], EDGE_SPECIALISTS[2]];
}

export function buildTrainingModuleDetail(module: TrainingModule): TrainingModuleDetail {
  const domain = getTrainingDomain(module.domainId);
  const badge = getBadgeById(module.badgeId);
  const card = enrichFormationCard(module);
  const trainers = pickTrainers(module);
  const seed = module.id.length;

  return {
    module,
    domainTitle: domain?.title ?? "Formation EDGE",
    badgeName: badge?.name ?? "Open Badge EDGE",
    levelLabel: getLevelLabel(module.level),
    formatsLabel: formatTrainingFormats(module.formats),
    duration: card.duration,
    price: card.priceLabel,
    prerequisite: module.level === 1 ? "Aucun prérequis" : `Niveau ${module.level - 1} recommandé`,
    public: "Managers, collaborateurs, équipes projet, responsables formation et métiers",
    benefit: card.benefit,
    methodology: [
      "Apports contextualisés et retours d'expérience terrain",
      "Ateliers pratiques en sous-groupes",
      "Mises en situation filmées et débrief collectif",
      "Coaching individuel et plan d'action à 30 jours",
    ],
    exercises: [
      "Diagnostic individuel et analyse de cas réels",
      "Jeux de rôle et simulations filmées",
      "Travaux en binôme avec feedback formateur",
      "Quiz de validation des acquis en fin de module",
    ],
    casPratiques: module.deliverables.length
      ? module.deliverables
      : [
          "Étude de cas sectorielle commentée",
          "Projet fil rouge sur une problématique métier",
          "Restitution devant un jury de pairs",
        ],
    competences: module.objectives,
    program: module.objectives.map((obj, i) => ({
      title: obj,
      duration: `${45 + i * 15} min`,
    })),
    faq: [
      {
        q: "La formation est-elle finançable ?",
        a: "Oui — OPCO, plan de développement des compétences, CPF entreprise selon éligibilité.",
      },
      {
        q: "Quelle certification est délivrée ?",
        a: `Open Badge « ${badge?.name ?? "EDGE"} » après validation des livrables et quiz final.`,
      },
      {
        q: "Peut-on organiser la formation en intra ?",
        a: "Oui — présentiel, distanciel ou blended, partout en France et à l'international.",
      },
      {
        q: "Combien de participants par session ?",
        a: "6 à 12 participants pour garantir l'interactivité et le suivi personnalisé.",
      },
    ],
    trainers,
    sessions: [
      { date: "15 sept. 2026", city: "Paris", seats: "8 places", price: card.priceLabel },
      { date: "6 oct. 2026", city: "Lyon", seats: "12 places", price: card.priceLabel },
      { date: "Sur mesure", city: "Intra entreprise", seats: "Contactez-nous", price: "Devis personnalisé" },
    ],
    satisfaction: "96 %",
    whyFollow: [
      "Des formateurs experts du réseau EDGE, identifiés et évalués",
      "Des livrables concrets à ramener en entreprise dès le lendemain",
      "Une certification Open Badge reconnue et partageable sur LinkedIn",
      "Un suivi post-formation pour ancrer les acquis dans la durée",
    ],
    reviews: EDGE_TESTIMONIALS.map((t, i) => ({
      author: t.author,
      role: t.role,
      company: t.company,
      rating: 5 - (i % 2) * 0.2,
      text: t.quote,
      photoUrl: t.photoUrl,
    })),
    heroImage: card.photoUrl,
    galleryImages: [
      FORMATION_SCENE_PHOTOS[seed % FORMATION_SCENE_PHOTOS.length],
      FORMATION_SCENE_PHOTOS[(seed + 2) % FORMATION_SCENE_PHOTOS.length],
      FORMATION_SCENE_PHOTOS[(seed + 5) % FORMATION_SCENE_PHOTOS.length],
      FORMATION_SCENE_PHOTOS[(seed + 7) % FORMATION_SCENE_PHOTOS.length],
    ],
  };
}
