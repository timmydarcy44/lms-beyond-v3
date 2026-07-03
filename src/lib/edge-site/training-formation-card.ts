import type { TrainingModule } from "@/lib/edge-site/training-catalog";
import {
  EDGE_TRAINING_MODULES,
  formatTrainingFormats,
  getBadgeById,
  getLevelLabel,
  getTrainingDomain,
  searchTrainingCatalog,
} from "@/lib/edge-site/training-catalog";

export type FormationFilterChip = {
  id: string;
  label: string;
  domainIds?: string[];
  keywords?: string[];
};

/** Filtres catalogue — les domaines servent uniquement de filtres, pas de navigation. */
export const FORMATION_FILTER_CHIPS: FormationFilterChip[] = [
  { id: "all", label: "Tous" },
  { id: "management", label: "Management", domainIds: ["leadership-management"], keywords: ["management", "manager", "équipe"] },
  { id: "ia", label: "IA", domainIds: ["intelligence-artificielle", "automatisation-ia-commerciale"] },
  { id: "communication", label: "Communication", domainIds: ["communication-storytelling"] },
  { id: "soft-skills", label: "Soft Skills", domainIds: ["soft-skills"] },
  { id: "rh", label: "RH", domainIds: ["ressources-humaines"] },
  { id: "commerce", label: "Commerce", domainIds: ["vente-prospection", "negociation-influence", "automatisation-ia-commerciale"] },
  { id: "finance", label: "Finance", keywords: ["reporting", "performance", "piloter", "kpi"] },
  { id: "projet", label: "Projet", domainIds: ["gestion-projet"] },
  { id: "pedagogie", label: "Pédagogie", domainIds: ["formation-formateurs"] },
  { id: "neurosciences", label: "Neurosciences", domainIds: ["analyse-comportementale"], keywords: ["comportement", "stress", "émotion"] },
  { id: "sante", label: "Santé", keywords: ["stress", "résilience", "charge", "bien-être", "psychosocial"] },
  { id: "leadership", label: "Leadership", domainIds: ["leadership-management"], keywords: ["leadership", "leader"] },
  { id: "qualite", label: "Qualité", keywords: ["qualité", "évaluation", "certif", "standard"] },
  { id: "productivite", label: "Productivité", domainIds: ["productivite-organisation"] },
];

export const FORMATION_SCENE_PHOTOS = [
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1515187028965-7ac396edf816?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=600&fit=crop",
] as const;

export type FormationCardData = {
  module: TrainingModule;
  title: string;
  domainLabel: string;
  benefit: string;
  duration: string;
  levelLabel: string;
  formatsLabel: string;
  badgeName: string;
  rating: number;
  companiesCount: number;
  priceLabel: string;
  photoUrl: string;
};

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DURATION_BY_LEVEL: Record<number, string> = {
  1: "1 jour",
  2: "1,5 jour",
  3: "2 jours",
  4: "2,5 jours",
  5: "3 jours",
};

const PRICE_BY_LEVEL: Record<number, string> = {
  1: "À partir de 890 €",
  2: "À partir de 1 290 €",
  3: "À partir de 1 890 €",
  4: "Sur devis",
  5: "Sur devis",
};

export function enrichFormationCard(module: TrainingModule): FormationCardData {
  const domain = getTrainingDomain(module.domainId);
  const badge = getBadgeById(module.badgeId);
  const seed = hashSeed(module.id);
  const rating = 4.6 + (seed % 5) * 0.1;
  const companiesCount = 24 + (seed % 140);

  return {
    module,
    title: module.title,
    domainLabel: domain?.title ?? "Formation professionnelle",
    benefit: module.objectives[0] ?? "Développer des compétences immédiatement applicables en entreprise.",
    duration: DURATION_BY_LEVEL[module.level] ?? "2 jours",
    levelLabel: getLevelLabel(module.level),
    formatsLabel: formatTrainingFormats(module.formats),
    badgeName: badge?.name ?? "Open Badge EDGE",
    rating: Math.round(rating * 10) / 10,
    companiesCount,
    priceLabel: PRICE_BY_LEVEL[module.level] ?? "Sur devis",
    photoUrl: FORMATION_SCENE_PHOTOS[seed % FORMATION_SCENE_PHOTOS.length],
  };
}

export function getAllFormationCards(): FormationCardData[] {
  return EDGE_TRAINING_MODULES.map(enrichFormationCard);
}

function moduleMatchesChip(module: TrainingModule, chip: FormationFilterChip): boolean {
  if (chip.id === "all") return true;
  if (chip.domainIds?.includes(module.domainId)) return true;
  const haystack = [
    module.title,
    module.code,
    ...module.objectives,
    getTrainingDomain(module.domainId)?.title ?? "",
    getTrainingDomain(module.domainId)?.themeLabel ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return (chip.keywords ?? []).some((kw) => haystack.includes(kw.toLowerCase()));
}

export function filterFormationCards(
  cards: FormationCardData[],
  query: string,
  chipId: string,
): FormationCardData[] {
  const chip = FORMATION_FILTER_CHIPS.find((c) => c.id === chipId) ?? FORMATION_FILTER_CHIPS[0];
  let list = cards;

  if (query.trim()) {
    const { modules } = searchTrainingCatalog(query);
    const ids = new Set(modules.map((m) => m.id));
    list = list.filter((c) => ids.has(c.module.id));
  }

  if (chip.id !== "all") {
    list = list.filter((c) => moduleMatchesChip(c.module, chip));
  }

  return list;
}

export function formationDetailPath(moduleId: string): string {
  return `/business/formations/${moduleId}`;
}
