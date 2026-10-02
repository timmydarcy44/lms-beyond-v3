import type {
  CareerMatchingResult,
  CareerSkillBucket,
  CareerSkillRow,
} from "@/lib/career-profiles/career-profile-matching";
import {
  careerSkillBucketForMatching,
  careerSkillMasteryPercent,
} from "@/lib/career-profiles/career-profile-matching";import {
  coachingForceAction,
  coachingLevelDisplay,
  coachingWhyUseful,
  expectedLevelForObjective,
} from "@/lib/apprenant/edge-coaching-copy";
import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";

export type CoachingSkill = {
  name: string;
  level: string;
  situation: string;
  whyUseful: string;
  nextAction: string;
  status: SkillGapStatus;
  expectedLevel: string;
  kind: "force" | "priority";
};

function levelFromTable(skill: string, matching: CareerMatchingResult): string {
  const row = matching.skillTable.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
  return row?.userLevel ?? "Bon";
}

export function buildCoachingSkillsFromMatching(
  matching: CareerMatchingResult,
  objectiveLabel: string,
): {
  forces: CoachingSkill[];
  priorities: CoachingSkill[];
  toDevelop: string[];
  laterSkills: string[];
} {
  const forces: CoachingSkill[] = matching.strengths.map((name, index) => ({
    name,
    level: coachingLevelDisplay(levelFromTable(name, matching)),
    situation: "Force identifiée",
    whyUseful: coachingWhyUseful(name, objectiveLabel),
    nextAction: coachingForceAction(index),
    status: "validated" as SkillGapStatus,
    expectedLevel: expectedLevelForObjective("validated"),
    kind: "force" as const,
  }));

  const priorityNames = [
    ...matching.develop,
    ...matching.consolidate.filter((s) => !matching.develop.includes(s)),
  ];

  const priorities: CoachingSkill[] = priorityNames.map((name) => ({
    name,
    level: coachingLevelDisplay(levelFromTable(name, matching)),
    situation: "Priorité actuelle",
    whyUseful: coachingWhyUseful(name, objectiveLabel),
    nextAction: "Faire l'exercice guidé",
    status: "priority" as SkillGapStatus,
    expectedLevel: expectedLevelForObjective("priority"),
    kind: "priority" as const,
  }));

  return {
    forces,
    priorities,
    /** Toutes les compétences du référentiel hors forces (objectif ~100 %). */
    toDevelop: [
      ...matching.develop,
      ...matching.consolidate.filter((s) => !matching.develop.includes(s)),
      ...matching.unevaluated,
    ],
    laterSkills: matching.unevaluated,
  };
}

export type TrainingCenterSkillRow = {
  row: CareerSkillRow;
  bucket: CareerSkillBucket;
  masteryPercent: number | null;
  coaching: CoachingSkill;
};

const BUCKET_SORT: Record<CareerSkillBucket, number> = {
  develop: 0,
  consolidate: 1,
  unevaluated: 2,
  strength: 3,
};

export function bucketLabelFr(bucket: CareerSkillBucket): string {
  switch (bucket) {
    case "develop":
      return "À développer";
    case "consolidate":
      return "À consolider";
    case "unevaluated":
      return "À évaluer";
    default:
      return "Alignée";
  }
}

function coachingSkillForRow(
  row: CareerSkillRow,
  bucket: CareerSkillBucket,
  matching: CareerMatchingResult,
  objectiveLabel: string,
): CoachingSkill {
  const isForce = bucket === "strength";
  return {
    name: row.skill,
    level: coachingLevelDisplay(row.userLevel),
    situation: isForce ? "Force identifiée" : bucketLabelFr(bucket),
    whyUseful: coachingWhyUseful(row.skill, objectiveLabel),
    nextAction: isForce ? "Consolider ou prouver" : "Faire l'exercice guidé",
    status: isForce ? "validated" : bucket === "develop" ? "priority" : "to_develop",
    expectedLevel: expectedLevelForObjective(isForce ? "validated" : "priority"),
    kind: isForce ? "force" : "priority",
  };
}

/** Référentiel complet trié pour le centre de pilotage (écarts d’abord). */
export function buildTrainingCenterSkillRows(
  matching: CareerMatchingResult,
  objectiveLabel: string,
): TrainingCenterSkillRow[] {
  const items = matching.skillTable.map((row) => {
    const bucket = careerSkillBucketForMatching(row.skill, matching);
    return {
      row,
      bucket,
      masteryPercent: careerSkillMasteryPercent(row),
      coaching: coachingSkillForRow(row, bucket, matching, objectiveLabel),
    };
  });

  items.sort((a, b) => {
    const order = BUCKET_SORT[a.bucket] - BUCKET_SORT[b.bucket];
    if (order !== 0) return order;
    const ma = a.masteryPercent ?? -1;
    const mb = b.masteryPercent ?? -1;
    return ma - mb;
  });

  return items;
}
