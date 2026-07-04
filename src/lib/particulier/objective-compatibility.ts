import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import {
  objectiveTargetLabel,
  type ParticulierObjectiveType,
} from "@/lib/particulier/objective-detail-fields";

const DISC_TRAIT_WEIGHTS: Record<keyof DiscScores, { leadership: number; negotiation: number; assertive: number; org: number }> = {
  D: { leadership: 0.9, negotiation: 0.75, assertive: 0.85, org: 0.55 },
  I: { leadership: 0.7, negotiation: 0.8, assertive: 0.65, org: 0.45 },
  S: { leadership: 0.5, negotiation: 0.55, assertive: 0.45, org: 0.75 },
  C: { leadership: 0.45, negotiation: 0.5, assertive: 0.4, org: 0.9 },
};

const OBJECTIVE_TRAIT_TARGETS: Record<
  ParticulierObjectiveType,
  { leadership: number; negotiation: number; assertive: number; org: number }
> = {
  alternance: { leadership: 0.55, negotiation: 0.65, assertive: 0.6, org: 0.7 },
  emploi: { leadership: 0.6, negotiation: 0.7, assertive: 0.65, org: 0.65 },
  reconversion: { leadership: 0.65, negotiation: 0.6, assertive: 0.7, org: 0.75 },
  freelance: { leadership: 0.75, negotiation: 0.8, assertive: 0.75, org: 0.7 },
  autre: { leadership: 0.6, negotiation: 0.6, assertive: 0.6, org: 0.65 },
};

const AXES_LABELS = {
  leadership: "Leadership",
  negotiation: "Négociation",
  assertive: "Communication assertive",
  org: "Organisation",
} as const;

export function computeObjectiveCompatibility(params: {
  discScores: DiscScores;
  objectiveType: ParticulierObjectiveType;
  objectiveDetails: Record<string, string>;
}): {
  score: number;
  objectiveLabel: string;
  axesToReinforce: string[];
  objectiveMeaning: string;
} {
  const { dominant, secondary } = resolveDiscProfile(params.discScores);
  const domW = DISC_TRAIT_WEIGHTS[dominant];
  const secW = secondary ? DISC_TRAIT_WEIGHTS[secondary] : domW;
  const blended = {
    leadership: domW.leadership * 0.7 + secW.leadership * 0.3,
    negotiation: domW.negotiation * 0.7 + secW.negotiation * 0.3,
    assertive: domW.assertive * 0.7 + secW.assertive * 0.3,
    org: domW.org * 0.7 + secW.org * 0.3,
  };

  const targets = OBJECTIVE_TRAIT_TARGETS[params.objectiveType];
  const traits = ["leadership", "negotiation", "assertive", "org"] as const;
  const gaps = traits.map((t) => ({
    trait: t,
    gap: Math.max(0, targets[t] - blended[t]),
  }));
  const avgFit =
    traits.reduce((acc, t) => acc + Math.min(1, blended[t] / Math.max(targets[t], 0.01)), 0) / traits.length;
  const score = Math.round(Math.min(95, Math.max(52, avgFit * 100)));

  const axesToReinforce = gaps
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .filter((g) => g.gap > 0.08)
    .map((g) => AXES_LABELS[g.trait]);

  const objectiveLabel = objectiveTargetLabel(params.objectiveType, params.objectiveDetails);
  const archetype = resolveDiscProfile(params.discScores).profileLabel;

  const objectiveMeaning = `Votre profil ${archetype} est cohérent avec un projet de ${objectiveLabel}. Vos axes prioritaires pour ce projet sont : ${
    axesToReinforce.length
      ? axesToReinforce.join(", ").toLowerCase()
      : "consolidation de vos points forts actuels"
  }.`;

  return { score, objectiveLabel, axesToReinforce, objectiveMeaning };
}

export function buildProgressionPriorities(discScores: DiscScores): string[] {
  const { dominant } = resolveDiscProfile(discScores);
  const byDominant: Record<keyof DiscScores, string[]> = {
    D: ["Communication assertive", "Leadership collaboratif", "Gestion des conflits"],
    I: ["Organisation", "Écoute active", "Structuration des priorités"],
    S: ["Communication assertive", "Prise d'initiative", "Gestion du stress"],
    C: ["Confiance à l'oral", "Leadership collaboratif", "Flexibilité relationnelle"],
  };
  return byDominant[dominant];
}
