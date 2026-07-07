import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";

/** CTA principaux — vocabulaire premium EDGE (approche concierge). */
export const EDGE_CTA_START_PARCOURS = "Construire mon parcours EDGE avec un expert";
export const EDGE_CTA_LAUNCH_PROGRESSION = "Demander une recommandation personnalisée";
export const EDGE_CTA_IMPROVE_SKILL = "Préparer mon plan d'action";

/** Éléments affichés sur les cartes Parcours EDGE (futurs modules). */
export const PARCOURS_EDGE_INCLUDES = [
  "Coaching guidé EDGE",
  "Exercices",
  "Simulations",
  "Validation EDGE",
  "Badge",
] as const;

/** Recommandations génériques pour atteindre le niveau suivant. */
export const EDGE_NEXT_LEVEL_STEPS = [
  "suivre un parcours EDGE",
  "réaliser une simulation",
  "déposer une preuve terrain",
  "refaire une évaluation",
] as const;

const LEVEL_ORDER: HardSkillLevel[] = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];

const SKILL_TITLE_MAP: Record<string, string> = {
  prospection: "Booster votre prospection",
  argumentation: "Maîtriser l'argumentation",
  "écoute active": "Renforcer votre impact relationnel",
  "ecoute active": "Renforcer votre impact relationnel",
  persévérance: "Accélérer votre progression",
  perseverance: "Accélérer votre progression",
  négociation: "Maîtriser la négociation",
  negociation: "Maîtriser la négociation",
  communication: "Perfectionner votre communication",
  organisation: "Renforcer votre organisation",
  empathie: "Développer votre influence",
  leadership: "Construire une posture de leader",
  closing: "Passer au niveau supérieur en closing",
  crm: "Maîtriser votre gestion de compte",
  "gestion de compte": "Maîtriser votre gestion de compte",
  "relation client": "Renforcer votre relation client",
  résilience: "Renforcer votre résilience",
  resilience: "Renforcer votre résilience",
  "gestion du stress": "Maîtriser la gestion du stress",
  persuasion: "Renforcer votre impact commercial",
  autonomie: "Gagner en autonomie opérationnelle",
  "gestion des objections": "Maîtriser la gestion des objections",
};

function normalizeSkillKey(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Titre premium pour une compétence à développer (évite le ton scolaire « Développer X »). */
export function premiumSkillTitle(skill: string): string {
  const key = normalizeSkillKey(skill);
  const exact = SKILL_TITLE_MAP[key];
  if (exact) return exact;

  if (key.includes("prospec")) return "Booster votre prospection";
  if (key.includes("negoc")) return "Maîtriser la négociation";
  if (key.includes("commun")) return "Perfectionner votre communication";
  if (key.includes("leader")) return "Construire une posture de leader";
  if (key.includes("persév") || key.includes("persever")) return "Accélérer votre progression";
  if (key.includes("organ")) return "Renforcer votre organisation";
  if (key.includes("écoute") || key.includes("ecoute")) return "Renforcer votre impact relationnel";
  if (key.includes("argument")) return "Maîtriser l'argumentation";
  if (key.includes("commercial") || key.includes("vente")) return "Renforcer votre impact commercial";
  if (key.includes("influence")) return "Développer votre influence";

  const label = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  return `Passer au niveau supérieur en ${label}`;
}

export function nextHardSkillLevel(current: HardSkillLevel): HardSkillLevel | null {
  const idx = LEVEL_ORDER.indexOf(current);
  if (idx < 0 || idx >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

export function skillProgressionCta(action: "parcours" | "progression" | "improve" = "parcours"): string {
  if (action === "progression") return EDGE_CTA_LAUNCH_PROGRESSION;
  if (action === "improve") return EDGE_CTA_IMPROVE_SKILL;
  return EDGE_CTA_START_PARCOURS;
}
