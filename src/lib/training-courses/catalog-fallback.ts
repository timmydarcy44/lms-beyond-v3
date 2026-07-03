import {
  EDGE_TRAINING_MODULES,
  getBadgeById,
  getLevelLabel,
  getTrainingDomain,
} from "@/lib/edge-site/training-catalog";
import { FORMATION_SCENE_PHOTOS } from "@/lib/edge-site/training-formation-card";
import type { TrainingCoursePublic, TrainingCourseRow } from "@/lib/training-courses/types";

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

const INTER_PRICE_BY_LEVEL: Record<number, number> = {
  1: 890,
  2: 1290,
  3: 1890,
  4: 2490,
  5: 3200,
};

export function catalogModuleToCourseRow(moduleId: string): TrainingCourseRow {
  const mod = EDGE_TRAINING_MODULES.find((m) => m.id === moduleId);
  if (!mod) {
    throw new Error(`Module inconnu: ${moduleId}`);
  }
  const domain = getTrainingDomain(mod.domainId);
  const badge = getBadgeById(mod.badgeId);
  const seed = hashSeed(mod.id);
  const interPrice = INTER_PRICE_BY_LEVEL[mod.level] ?? null;

  return {
    id: mod.id,
    slug: mod.id,
    title: mod.title,
    short_description: mod.objectives[0] ?? null,
    long_description: mod.objectives.join("\n"),
    domain: domain?.title ?? null,
    cover_url: FORMATION_SCENE_PHOTOS[seed % FORMATION_SCENE_PHOTOS.length],
    duration: DURATION_BY_LEVEL[mod.level] ?? "2 jours",
    level: getLevelLabel(mod.level),
    formats: mod.formats.map((f) => (f === "presentiel" ? "Présentiel" : f === "distanciel" ? "Distanciel" : "Blended")),
    objectives: mod.objectives,
    skills: mod.objectives,
    program: mod.objectives.map((obj, i) => ({
      title: obj,
      duration: `${45 + i * 15} min`,
    })),
    prerequisites: mod.level === 1 ? "Aucun prérequis" : `Niveau ${mod.level - 1} recommandé`,
    audience: ["Managers", "Collaborateurs", "Équipes projet"],
    intra_price: interPrice ? interPrice * 8 : null,
    inter_price: interPrice,
    max_intra_participants: 12,
    badge_name: badge?.name ?? "Open Badge EDGE",
    trainer_id: null,
    trainer_name: "Réseau EDGE",
    trainer_headline: domain?.themeLabel ?? "Formateur expert",
    trainer_photo_url: null,
    is_active: true,
    created_at: null,
    updated_at: null,
  };
}

export function catalogFallbackCourses(): TrainingCourseRow[] {
  return EDGE_TRAINING_MODULES.map((m) => catalogModuleToCourseRow(m.id));
}

export function enrichCoursePublic(row: TrainingCourseRow): TrainingCoursePublic {
  const seed = hashSeed(row.slug);
  const rating = Math.round((4.6 + (seed % 5) * 0.1) * 10) / 10;
  const companies_count = 24 + (seed % 140);
  const price_label =
    row.inter_price != null
      ? `À partir de ${row.inter_price.toLocaleString("fr-FR")} €`
      : "Sur devis";

  return { ...row, rating, companies_count, price_label };
}
