/**
 * Générateur de Mission EDGE — brief scénarisé personnalisé par utilisateur.
 * Chaque mission possède contexte, histoire, personnages et objectif pédagogique.
 */

import { generateJSON } from "@/lib/ai/openai-client";
import type { MissionBrief, MissionDifficulty, MissionFormatId } from "@/lib/apprenant/edge-mission-types";

export type MissionGenerateInput = {
  skillName: string;
  objective: string;
  levelCurrent: string;
  levelExpected: string;
  format: MissionFormatId;
  /** Missions déjà réalisées sur cette compétence (titres). */
  pastMissionTitles?: string[];
};

const DIFFICULTY_BY_LEVEL: Record<string, MissionDifficulty> = {
  débutant: "Accessible",
  debutant: "Accessible",
  intermédiaire: "Intermédiaire",
  intermediaire: "Intermédiaire",
  confirmé: "Exigeant",
  confirme: "Exigeant",
  expert: "Exigeant",
};

function difficultyFromLevel(level: string): MissionDifficulty {
  const key = level.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return DIFFICULTY_BY_LEVEL[key] ?? "Intermédiaire";
}

function buildWhySelected(input: MissionGenerateInput): string[] {
  const reasons: string[] = [];
  if (input.objective) {
    reasons.push(`votre objectif professionnel (« ${input.objective} ») nécessite cette compétence`);
  }
  if (input.levelCurrent) {
    reasons.push(`votre niveau actuel est estimé « ${input.levelCurrent} »`);
  }
  reasons.push("cette compétence est prioritaire pour atteindre votre objectif");
  return reasons;
}

import { secondarySkillsFor } from "@/lib/apprenant/edge-mission-generator-helpers";

function fallbackMission(input: MissionGenerateInput): MissionBrief {
  const secondary = secondarySkillsFor(input.skillName);
  const whySelected = buildWhySelected(input);
  const level = input.levelCurrent || "Intermédiaire";

  return {
    title: `Convaincre un directeur financier`,
    pedagogicalObjective: `Développer votre capacité à construire un argumentaire convaincant en ${input.skillName}, face à un décideur exigeant.`,
    primarySkill: input.skillName,
    secondarySkills: secondary,
    outcomes: [
      "structurer votre argumentation",
      "répondre à une objection",
      "conclure un échange professionnel",
    ],
    context: `Vous êtes account manager chez GreenTech, une scale-up spécialisée dans l'efficacité énergétique. Vous êtes dans le bureau de Marc Delaunay, directeur financier d'OmniLog — un groupe logistique sous pression budgétaire. Marc est sceptique, pressé, et pense que votre solution coûte trop cher.`,
    story: `Rendez-vous décisif : le budget 2026 se finalise dans 48 h. Marc doit trancher entre trois fournisseurs. Vous sentez sa tension — il a déjà reporté cette décision deux fois. Votre objectif : obtenir un deuxième rendez-vous avec son équipe technique.`,
    characters: [
      "Vous — account manager GreenTech",
      "Marc Delaunay, 52 ans, directeur financier chez OmniLog (sceptique, analytique)",
      "Sophie Lemaire, responsable achats (absente mais mentionnée)",
    ],
    coachRole: "Marc Delaunay, directeur financier",
    missionGoal: "Obtenir un deuxième rendez-vous",
    prerequisites: [`Notions de base en ${input.skillName}`],
    successCriteria: [
      "Répondre à l'objection prix sans être sur la défensive",
      "Proposer une valeur mesurable",
      "Obtenir un engagement pour un prochain échange",
    ],
    estimatedMinutes: input.format === "quickchallenge" ? 10 : 15,
    difficulty: difficultyFromLevel(level),
    level,
    whySelected,
  };
}

const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    pedagogicalObjective: { type: "string" },
    secondarySkills: { type: "array", items: { type: "string" } },
    outcomes: { type: "array", items: { type: "string" } },
    context: { type: "string" },
    story: { type: "string" },
    characters: { type: "array", items: { type: "string" } },
    coachRole: { type: "string" },
    missionGoal: { type: "string" },
    prerequisites: { type: "array", items: { type: "string" } },
    successCriteria: { type: "array", items: { type: "string" } },
    estimatedMinutes: { type: "number" },
  },
  required: [
    "title",
    "pedagogicalObjective",
    "secondarySkills",
    "outcomes",
    "context",
    "story",
    "characters",
    "coachRole",
    "missionGoal",
    "prerequisites",
    "successCriteria",
    "estimatedMinutes",
  ],
};

export async function generateMissionBrief(input: MissionGenerateInput): Promise<MissionBrief> {
  const whySelected = buildWhySelected(input);
  const level = input.levelCurrent || "Intermédiaire";
  const past = input.pastMissionTitles?.length
    ? `Missions déjà réalisées (ne pas répéter) : ${input.pastMissionTitles.join(", ")}.`
    : "";

  const prompt = `Génère une Mission EDGE personnalisée pour développer la compétence « ${input.skillName} ».

Objectif professionnel de l'apprenant : ${input.objective || "non précisé"}
Niveau actuel : ${level} — niveau visé : ${input.levelExpected || "supérieur"}
${past}

La mission doit :
- avoir un titre accrocheur et concret (ex. « Convaincre un directeur financier »)
- un contexte professionnel réaliste lié au métier visé, avec une ENTREPRISE nommée et des ENJEUX précis (budget, délai, concurrence…)
- des personnages NOMMÉS avec prénom, rôle, entreprise et une touche émotionnelle (stress, scepticisme, urgence…)
- une histoire vivante : ce qui s'est passé juste avant, la tension dans la pièce
- un objectif de mission concret (ex. obtenir un deuxième rendez-vous)
- 2-3 compétences secondaires
- 3 résultats « vous serez capable de »
- 3 critères de réussite
- durée estimée en minutes (10-20)

Le coach jouera un personnage (pas un examinateur). L'apprenant doit avoir l'impression de VIVRE une situation, pas de répondre à un questionnaire. Français, ton professionnel adulte.`;

  const raw = await generateJSON(
    prompt,
    BRIEF_SCHEMA,
    "Tu es un concepteur pédagogique EDGE. Tu renvoies UNIQUEMENT un JSON valide.",
  );

  if (!raw || typeof raw !== "object") {
    return fallbackMission(input);
  }

  return {
    title: String(raw.title ?? `Mission ${input.skillName}`).slice(0, 120),
    pedagogicalObjective: String(raw.pedagogicalObjective ?? "").slice(0, 400),
    primarySkill: input.skillName,
    secondarySkills: Array.isArray(raw.secondarySkills)
      ? raw.secondarySkills.map(String).slice(0, 4)
      : secondarySkillsFor(input.skillName),
    outcomes: Array.isArray(raw.outcomes) ? raw.outcomes.map(String).slice(0, 5) : [],
    context: String(raw.context ?? "").slice(0, 600),
    story: String(raw.story ?? "").slice(0, 600),
    characters: Array.isArray(raw.characters) ? raw.characters.map(String).slice(0, 5) : [],
    coachRole: String(raw.coachRole ?? "Interlocuteur professionnel").slice(0, 120),
    missionGoal: String(raw.missionGoal ?? "Atteindre l'objectif de la mission").slice(0, 200),
    prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites.map(String).slice(0, 4) : [],
    successCriteria: Array.isArray(raw.successCriteria) ? raw.successCriteria.map(String).slice(0, 5) : [],
    estimatedMinutes: Math.min(30, Math.max(5, Number(raw.estimatedMinutes) || 15)),
    difficulty: difficultyFromLevel(level),
    level,
    whySelected,
  };
}
