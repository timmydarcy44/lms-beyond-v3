import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import {
  EDGE_SPECIALISTS,
  type EdgeSpecialist,
} from "@/lib/edge-site/training-catalog-human";
import {
  formatTrainingFormats,
  getBadgeById,
  getLevelLabel,
  getTrainingDomain,
} from "@/lib/edge-site/training-catalog";

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
  methodology: string[];
  program: { title: string; duration: string }[];
  faq: { q: string; a: string }[];
  trainer: EdgeSpecialist;
  sessions: { date: string; city: string; seats: string }[];
  satisfaction: string;
  whyFollow: string[];
};

export function buildTrainingModuleDetail(module: TrainingModule): TrainingModuleDetail {
  const domain = getTrainingDomain(module.domainId);
  const badge = getBadgeById(module.badgeId);
  const trainer =
    EDGE_SPECIALISTS.find((s) =>
      module.domainId.includes("intelligence") ? s.id === "timmy" : s.id === "jessica",
    ) ?? EDGE_SPECIALISTS[0];

  const durationByLevel: Record<number, string> = {
    1: "1 jour",
    2: "1,5 jour",
    3: "2 jours",
    4: "2,5 jours",
    5: "3 jours",
  };

  return {
    module,
    domainTitle: domain?.title ?? "Formation EDGE",
    badgeName: badge?.name ?? "Open Badge EDGE",
    levelLabel: getLevelLabel(module.level),
    formatsLabel: formatTrainingFormats(module.formats),
    duration: durationByLevel[module.level] ?? "2 jours",
    price: module.level >= 4 ? "Sur devis" : "À partir de 1 890 € HT",
    prerequisite: module.level === 1 ? "Aucun prérequis" : `Niveau ${module.level - 1} recommandé`,
    public: "Managers, collaborateurs, équipes projet, responsables métier",
    methodology: [
      "Apports contextualisés et cas réels",
      "Ateliers pratiques en sous-groupes",
      "Mises en situation filmées et débrief",
      "Plan d'action individuel à 30 jours",
    ],
    program: module.objectives.map((obj, i) => ({
      title: obj,
      duration: `${45 + i * 15} min`,
    })),
    faq: [
      {
        q: "La formation est-elle finançable ?",
        a: "Oui — OPCO, plan de développement des compétences et financement entreprise.",
      },
      {
        q: "Y a-t-il une certification ?",
        a: `Oui, délivrance de l'Open Badge « ${badge?.name ?? "EDGE"} » après validation des livrables.`,
      },
      {
        q: "Peut-on l'organiser en intra ?",
        a: "Oui, en présentiel, distanciel ou blended, partout en France.",
      },
    ],
    trainer,
    sessions: [
      { date: "15 sept. 2026", city: "Paris", seats: "8 places" },
      { date: "6 oct. 2026", city: "Lyon", seats: "12 places" },
      { date: "Sur mesure", city: "Intra entreprise", seats: "Contactez-nous" },
    ],
    satisfaction: "96 %",
    whyFollow: [
      "Des formateurs experts du réseau EDGE, pas des généralistes",
      "Des livrables concrets à ramener en entreprise dès le lendemain",
      "Une certification Open Badge reconnue et partageable",
      "Un suivi post-formation pour ancrer les acquis",
    ],
  };
}
