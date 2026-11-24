/**
 * Propose LA formation la plus cohérente pour un écart Skills Gap.
 * Peut être hors catalogue : la demande RH crée alors un brief Sur-mesure.
 */

import {
  BUSINESS_TRAINING_ITEMS,
  type BusinessTrainingItem,
} from "@/lib/enterprise/business-training-catalog";
import type { CollectiveScope } from "@/lib/entreprise/skills-gap-config";

export type ProposedGapFormation = {
  title: string;
  subtitle: string;
  rationale: string;
  preferred_format: "Présentiel" | "Distanciel" | "Blended" | "À définir";
  category: string;
  /** Id catalogue si un match pertinent existe ; sinon null → Sur-mesure. */
  catalog_id: string | null;
  in_catalogue: boolean;
};

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string) {
  return fold(value)
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

/** Score de pertinence catalogue vs soft skill + métier. */
function scoreCatalogItem(item: BusinessTrainingItem, skill: string, metier: string): number {
  const skillTokens = tokens(skill);
  const metierTokens = tokens(metier);
  const hay = fold(`${item.title} ${item.subtitle} ${item.category}`);
  let score = 0;
  for (const t of skillTokens) {
    if (hay.includes(t)) score += 3;
  }
  for (const t of metierTokens) {
    if (hay.includes(t)) score += 1;
  }
  // Bonus soft skills category when skill looks soft
  if (/soft|communication|leadership|feedback|stress|empath|assert|ecoute|écoute|collab|nego/i.test(skill)) {
    if (/soft|communication|management|leadership|rh/i.test(item.category)) score += 2;
  }
  return score;
}

function bestCatalogMatch(skill: string, metier: string): BusinessTrainingItem | null {
  let best: BusinessTrainingItem | null = null;
  let bestScore = 0;
  for (const item of BUSINESS_TRAINING_ITEMS) {
    const s = scoreCatalogItem(item, skill, metier);
    if (s > bestScore) {
      best = item;
      bestScore = s;
    }
  }
  // Exiger un minimum de signal (au moins un token skill matché)
  return bestScore >= 3 ? best : null;
}

function formatForScope(scope: CollectiveScope): ProposedGapFormation["preferred_format"] {
  if (scope === "individuel") return "Distanciel";
  if (scope === "intermediaire") return "Blended";
  if (scope === "collectif" || scope === "collectif_prioritaire") return "Présentiel";
  return "À définir";
}

function craftOutsideCatalogue(input: {
  skill: string;
  metier_title: string;
  scope: CollectiveScope;
}): ProposedGapFormation {
  const skill = input.skill.trim();
  const metier = input.metier_title.trim() || "vos équipes";
  const format = formatForScope(input.scope);
  const collective =
    input.scope === "collectif" || input.scope === "collectif_prioritaire";

  const title = collective
    ? `${skill} — atelier collectif pour ${metier}`
    : `Renforcer « ${skill} » — parcours ciblé (${metier})`;

  return {
    title,
    subtitle: "Proposition Sur-mesure (hors catalogue public)",
    rationale: `L’écart sur « ${skill} » pour le métier « ${metier} » appelle une formation dédiée. Aucune fiche catalogue n’est suffisamment alignée : Byound construira un parcours Sur-mesure à partir de cette demande.`,
    preferred_format: format,
    category: "Sur-mesure",
    catalog_id: null,
    in_catalogue: false,
  };
}

/**
 * Analyse l’écart et retourne UNE formation recommandée :
 * match catalogue si pertinent, sinon proposition Sur-mesure explicite.
 */
export function proposeFormationForSkillGap(input: {
  skill: string;
  metier_title: string;
  scope: CollectiveScope;
  avg_gap?: number;
}): ProposedGapFormation {
  const skill = input.skill.trim();
  const metier = input.metier_title.trim();
  const format = formatForScope(input.scope);
  const match = bestCatalogMatch(skill, metier);

  if (match) {
    return {
      title: match.title,
      subtitle: match.subtitle,
      rationale: `Pour combler l’écart sur « ${skill} » (${metier || "métier"}), la formation la plus cohérente du catalogue est « ${match.title} ».`,
      preferred_format: format,
      category: match.category,
      catalog_id: match.id,
      in_catalogue: true,
    };
  }

  return craftOutsideCatalogue({
    skill,
    metier_title: metier,
    scope: input.scope,
  });
}

export function proposedFormationToDemanderHref(proposal: ProposedGapFormation, meta: {
  skill: string;
  metier_title: string;
}): string {
  const params = new URLSearchParams();
  params.set("skill", meta.skill);
  params.set("metier", meta.metier_title);
  params.set("format", proposal.preferred_format);
  params.set("title", proposal.title);
  if (proposal.catalog_id) {
    params.set("training", proposal.catalog_id);
  } else {
    params.set("surmesure", "1");
  }
  params.set("rationale", proposal.rationale);
  return `/dashboard/entreprise/formations/demander?${params.toString()}`;
}
