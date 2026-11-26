import {
  buildDiscObservation,
  buildIdmcObservation,
  buildSoftSkillsObservation,
} from "@/lib/apprenant/assessment-observations";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import { DISC_QUESTION_COUNT } from "@/lib/disc/disc-questions";
import type { DiscLabel } from "@/lib/disc/disc-questions-types";
import {
  resolveDiscProfile,
  type DiscNormalizedScores,
} from "@/lib/disc/disc-scoring";
import { proposeFormationForSkillGap } from "@/lib/entreprise/skills-gap-formation-propose";
import { AXES_LABELS, type AxisKey } from "@/lib/idmc/idmc-display";
import { IDMC_QUESTIONS } from "@/lib/idmc/idmc-questions";
import {
  DISC_BALANCED_SPREAD_THRESHOLD,
  DISC_BAR_COLORS,
  DISC_DIMENSION_DEFINITIONS_TU,
  DISC_DIMENSION_NAMES,
  findInterpretationText,
} from "@/lib/salarie/interpretation-texts";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";
import { softSkillMasteryPercent } from "@/lib/soft-skills/resolve-soft-skills-result";

export type MesBilansBar = {
  key: string;
  letter: string;
  name: string;
  definition: string;
  value: number;
  color: string;
};

export type MesBilansDiscDetail = {
  dominantLabel: string;
  nuance: "equilibre" | "nette";
  nuanceLabel: string;
  interpretiveTitle: string;
  observation: string;
  questionCount: number;
  takenAt: string | null;
  bars: MesBilansBar[];
  scoresLine: string;
  appui: string[];
  vigilance: string[];
  travailler: string[];
  scaleLegend: string;
  retakeHref: string;
};

export type MesBilansIdmcDetail = {
  strong: string;
  weak: string | null;
  strongScore: number;
  takenAt: string | null;
  axes: Array<{ key: AxisKey; name: string; value: number; tone: "blue" | "amber" }>;
  observation: string;
  scaleLegend: string;
  meaning: string;
  retakeHref: string;
};

export type MesBilansSoftDetail = {
  top: Array<{ skill: string; percent: number }>;
  develop: Array<{ skill: string; percent: number }>;
  all: Array<{ skill: string; percent: number; description: string }>;
  evaluatedCount: number;
  takenAt: string | null;
  observation: string;
  scaleLegend: string;
  flat: boolean;
  retakeHref: string;
  fullListHref: string;
};

export type MesBilansNextStep = {
  summary: string;
  prioritySkill: string | null;
  formation: { title: string; href: string } | null;
  coachHref: string;
};

export type MesBilansViewModel = {
  disc: MesBilansDiscDetail | null;
  idmc: MesBilansIdmcDetail | null;
  soft: MesBilansSoftDetail | null;
  nextStep: MesBilansNextStep;
  privacyBanner: string;
  partageHref: string;
  links: {
    discTest: string;
    idmcTest: string;
    softTest: string;
  };
};

const LINKS = {
  discTest: "/dashboard/salarie/test-disc",
  idmcTest: "/dashboard/salarie/test-idmc",
  softTest: "/dashboard/salarie/test-soft-skills",
} as const;

/** Adapte un texte existant (vouvoiement) au tutoiement salarié sans inventer de contenu. */
export function toSalarieTutoiement(text: string): string {
  return text
    .replace(/\bVotre\b/g, "Ton")
    .replace(/\bvotre\b/g, "ton")
    .replace(/\bVos\b/g, "Tes")
    .replace(/\bvos\b/g, "tes")
    .replace(/\bVous\b/g, "Tu")
    .replace(/\bvous\b/g, "tu")
    .replace(/\btu privilégiez\b/gi, "tu privilégies")
    .replace(/\btu misez\b/gi, "tu mises")
    .replace(/\btu recherchez\b/gi, "tu recherches")
    .replace(/\btu valorisez\b/gi, "tu valorises")
    .replace(/\btu ressortez\b/gi, "tu ressors");
}

export function resolveDiscBalance(scores: DiscNormalizedScores): {
  nuance: "equilibre" | "nette";
  nuanceLabel: string;
  spread: number;
} {
  const values = (["D", "I", "S", "C"] as DiscLabel[]).map((key) => scores[key]);
  const spread = Math.max(...values) - Math.min(...values);
  if (spread < DISC_BALANCED_SPREAD_THRESHOLD) {
    return {
      nuance: "equilibre",
      nuanceLabel: "Profil équilibré, légère dominante",
      spread,
    };
  }
  return { nuance: "nette", nuanceLabel: "Dominante nette", spread };
}

function buildDiscDetail(
  scores: DiscNormalizedScores,
  takenAt: string | null,
): MesBilansDiscDetail {
  const profile = resolveDiscProfile(scores);
  const dominantLabel = DISC_PROFILE_LABELS[profile.dominant];
  const { nuance, nuanceLabel } = resolveDiscBalance(scores);
  const interpretiveTitle =
    nuance === "equilibre"
      ? `${dominantLabel}, mais surtout équilibré`
      : `Dominante ${dominantLabel}`;

  const ranked = (["D", "I", "S", "C"] as DiscLabel[])
    .map((key) => ({ key, value: scores[key] }))
    .sort((a, b) => b.value - a.value);

  const bars: MesBilansBar[] = ranked.map((row) => ({
    key: row.key,
    letter: row.key,
    name: DISC_DIMENSION_NAMES[row.key],
    definition: DISC_DIMENSION_DEFINITIONS_TU[row.key],
    value: Math.round(row.value),
    color: DISC_BAR_COLORS[row.key],
  }));

  const scoresLine = ranked.map((row) => `${row.key} ${Math.round(row.value)}`).join(" · ");

  const observation = toSalarieTutoiement(buildDiscObservation(scores));

  // Blocs structurés : on n'invente pas — si placeholder, on n'affiche que ce qui existe réellement.
  // Appui : définition de la dominante (texte code existant). Vigilance / travailler : placeholders filtrés.
  const appuiPlaceholder = findInterpretationText("disc", "appui", profile.dominant);
  const vigilancePlaceholder = findInterpretationText("disc", "vigilance", profile.dominant);
  const travaillerPlaceholder = findInterpretationText("disc", "travailler", profile.dominant);

  const appui = [DISC_DIMENSION_DEFINITIONS_TU[profile.dominant]].filter(Boolean);
  if (appuiPlaceholder && appuiPlaceholder !== "À RÉDIGER") appui.push(appuiPlaceholder);

  const vigilance: string[] = [];
  if (vigilancePlaceholder && vigilancePlaceholder !== "À RÉDIGER") {
    vigilance.push(vigilancePlaceholder);
  } else if (profile.secondary) {
    // Pas d'invention : on réutilise la définition existante de la dimension secondaire comme point de vigilance contextuel.
    vigilance.push(DISC_DIMENSION_DEFINITIONS_TU[profile.secondary]);
  }

  const travailler: string[] = [];
  if (travaillerPlaceholder && travaillerPlaceholder !== "À RÉDIGER") {
    travailler.push(travaillerPlaceholder);
  }

  return {
    dominantLabel,
    nuance,
    nuanceLabel,
    interpretiveTitle,
    observation,
    questionCount: DISC_QUESTION_COUNT,
    takenAt,
    bars,
    scoresLine,
    appui,
    vigilance,
    travailler,
    scaleLegend: "0 = peu marqué — le trait = milieu de l'échelle — 100 = très marqué",
    retakeHref: LINKS.discTest,
  };
}

function buildIdmcDetail(
  axes: Record<AxisKey, number>,
  takenAt: string | null,
): MesBilansIdmcDetail {
  const ranked = (Object.keys(AXES_LABELS) as AxisKey[])
    .map((key) => ({ key, value: Number(axes[key] ?? 0), name: AXES_LABELS[key] }))
    .sort((a, b) => b.value - a.value);
  const strong = ranked[0];
  const weak = ranked[ranked.length - 1];
  const observation = toSalarieTutoiement(buildIdmcObservation(axes));
  const meaningRaw = findInterpretationText("idmc", "ce_que_ca_veut_dire");
  const meaning =
    meaningRaw && meaningRaw !== "À RÉDIGER"
      ? meaningRaw
      : observation;

  return {
    strong: strong?.name ?? "—",
    weak: weak && strong && weak.key !== strong.key ? weak.name : null,
    strongScore: Math.round(strong?.value ?? 0),
    takenAt,
    axes: ranked.map((row) => ({
      key: row.key,
      name: row.name,
      value: Math.round(row.value),
      tone: row.value < 50 ? "amber" : "blue",
    })),
    observation,
    scaleLegend:
      findInterpretationText("idmc", "echelle") ??
      "Chaque aptitude est notée sur 100. Le trait à 50 marque le milieu de l'échelle.",
    meaning,
    retakeHref: LINKS.idmcTest,
  };
}

function softDescription(skill: string): string {
  const found = SOFT_SKILLS.find((item) => item.titre === skill);
  return found?.description ?? "";
}

function buildSoftDetail(
  entries: Array<{ skill: string; score: number }>,
  takenAt: string | null,
  flat: boolean,
): MesBilansSoftDetail {
  const withPercent = entries
    .map((row) => ({
      skill: row.skill,
      percent: softSkillMasteryPercent(row.score),
      description: softDescription(row.skill),
    }))
    .sort((a, b) => b.percent - a.percent);

  const observation = toSalarieTutoiement(
    buildSoftSkillsObservation(entries.map((row) => ({ skill: row.skill, score: row.score }))),
  );

  return {
    top: withPercent.slice(0, 3).map(({ skill, percent }) => ({ skill, percent })),
    develop: [...withPercent].sort((a, b) => a.percent - b.percent).slice(0, 3).map(({ skill, percent }) => ({
      skill,
      percent,
    })),
    all: withPercent,
    evaluatedCount: withPercent.length,
    takenAt,
    observation,
    scaleLegend:
      findInterpretationText("soft", "echelle") ??
      "Chaque soft skill est affichée sur 100 (conversion depuis le score /15 du test).",
    flat,
    retakeHref: LINKS.softTest,
    fullListHref: "/soft-skills/resultats?from=salarie",
  };
}

function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

function formationMatchesSkill(
  formationTitle: string,
  skill: string,
): boolean {
  const hay = fold(formationTitle);
  const tokens = fold(skill)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
  return tokens.some((t) => hay.includes(t));
}

export function resolveBilansPrioritySkill(input: {
  softDevelop: string[];
  idmcWeak: string | null;
}): string | null {
  const counts = new Map<string, number>();
  const bump = (label: string | null | undefined) => {
    const key = String(label ?? "").trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  for (const skill of input.softDevelop) bump(skill);
  bump(input.idmcWeak);

  // Synonymes organisation / anticipation pour croiser soft + IDMC
  const orgKeys = [...counts.keys()].filter((key) =>
    /organis|anticip|temps|prioris/i.test(key),
  );
  if (orgKeys.length >= 2) {
    return orgKeys.sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0] ?? null;
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? null;
}

function resolveRecommendedFormation(
  prioritySkill: string | null,
  assigned: Array<{ title: string; href: string }> | null,
): { title: string; href: string } | null {
  if (!prioritySkill) return null;

  const matchAssigned = (assigned ?? []).find((item) => formationMatchesSkill(item.title, prioritySkill));
  if (matchAssigned) {
    return { title: matchAssigned.title, href: matchAssigned.href };
  }

  const proposal = proposeFormationForSkillGap({
    skill: prioritySkill,
    metier_title: "",
    scope: "individuel",
  });
  if (!proposal.in_catalogue) return null;
  return {
    title: proposal.title,
    href: `/dashboard/salarie/formations`,
  };
}

export function buildMesBilansViewModel(input: {
  discScores: DiscNormalizedScores | null;
  discTakenAt: string | null;
  idmcAxes: Record<AxisKey, number> | null;
  idmcTakenAt: string | null;
  softEntries: Array<{ skill: string; score: number }>;
  softTakenAt: string | null;
  softFlat: boolean;
  assignedFormations?: Array<{ title: string; href: string }>;
}): MesBilansViewModel {
  const disc = input.discScores ? buildDiscDetail(input.discScores, input.discTakenAt) : null;
  const idmc = input.idmcAxes ? buildIdmcDetail(input.idmcAxes, input.idmcTakenAt) : null;
  const soft =
    input.softEntries.length > 0
      ? buildSoftDetail(input.softEntries, input.softTakenAt, input.softFlat)
      : null;

  const prioritySkill = resolveBilansPrioritySkill({
    softDevelop: soft?.develop.map((row) => row.skill) ?? [],
    idmcWeak: idmc?.weak ?? null,
  });

  const formation = resolveRecommendedFormation(prioritySkill, input.assignedFormations ?? null);

  let summary =
    "Passe tes tests pour obtenir une synthèse et une piste de progression.";
  if (prioritySkill) {
    summary = `Tes tests pointent vers une même marge de progression : ${prioritySkill}.`;
  } else if (disc || idmc || soft) {
    summary = "Tes résultats sont disponibles. Un coach peut t'aider à les croiser avec ton poste.";
  }

  return {
    disc,
    idmc,
    soft,
    nextStep: {
      summary,
      prioritySkill,
      formation,
      coachHref: "/dashboard/salarie/accompagnement",
    },
    privacyBanner:
      "Ce que voit ton employeur : tes résultats détaillés uniquement si tu as accepté le partage après le test. Sinon, rien de tes scores. Tu peux modifier ce choix à tout moment.",
    partageHref: "/dashboard/salarie/partage-entreprise",
    links: { ...LINKS },
  };
}

export function idmcEmployeeQuestionCount(): number {
  return IDMC_QUESTIONS.employee.length;
}
