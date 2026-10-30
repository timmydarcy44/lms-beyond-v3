import { getCareQuestionnaire, getCareTest } from "@/lib/expert/care-tests";
import { interpretJessicaScore } from "@/lib/jessica-contentin/questionnaires";
import { SOFT_SKILLS, SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";

export type CareCategoryScore = {
  id: string;
  label: string;
  percent: number;
  level: "faible" | "modere" | "eleve";
  comment: string;
};

export type CareTestSummary = {
  title: string;
  overallLabel: string;
  overallPercent: number | null;
  categories: CareCategoryScore[];
  analysis: string;
};

function levelOf(percent: number): CareCategoryScore["level"] {
  if (percent < 40) return "faible";
  if (percent < 70) return "modere";
  return "eleve";
}

function levelLabel(level: CareCategoryScore["level"], inverted = false) {
  if (!inverted) {
    if (level === "faible") return "à renforcer";
    if (level === "modere") return "en développement";
    return "ressource solide";
  }
  if (level === "faible") return "peu marqué";
  if (level === "modere") return "présent";
  return "élevé";
}

function numericAnswer(value: unknown, max = 4): number | null {
  if (value == null || value === "" || value === false) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value);
  if (/^\d+$/.test(raw)) return Number(raw);
  const likert5: Record<string, number> = {
    Jamais: 0,
    Rarement: 1,
    Parfois: 2,
    Souvent: 3,
    Toujours: 4,
  };
  const impact: Record<string, number> = {
    "Pas du tout": 0,
    Peu: 1,
    Modérément: 2,
    Beaucoup: 3,
    Enormément: 4,
  };
  if (raw in likert5) return likert5[raw];
  if (raw in impact) return impact[raw];
  if (raw === "true" || raw === "oui") return max;
  return null;
}

function category(id: string, label: string, percent: number, inverted = false): CareCategoryScore {
  const capped = Math.max(0, Math.min(100, Math.round(percent)));
  const level = levelOf(capped);
  return {
    id,
    label,
    percent: capped,
    level,
    comment: levelLabel(level, inverted),
  };
}

function meanPercent(values: number[], max: number) {
  if (!values.length || max <= 0) return 0;
  return (values.reduce((a, b) => a + b, 0) / (values.length * max)) * 100;
}

/** MAI — 8 sous-échelles Schraw & Dennison, items 1–52 après exclusion du cursus. */
const MAI_ITEM_CATEGORY = [
  "monitoring",
  "monitoring",
  "procedural",
  "planning",
  "declarative",
  "planning",
  "evaluation",
  "planning",
  "ims",
  "declarative",
  "monitoring",
  "declarative",
  "ims",
  "procedural",
  "conditional",
  "declarative",
  "declarative",
  "conditional",
  "evaluation",
  "declarative",
  "monitoring",
  "planning",
  "planning",
  "evaluation",
  "debugging",
  "conditional",
  "procedural",
  "monitoring",
  "conditional",
  "ims",
  "ims",
  "declarative",
  "procedural",
  "monitoring",
  "conditional",
  "evaluation",
  "ims",
  "evaluation",
  "ims",
  "debugging",
  "ims",
  "planning",
  "ims",
  "debugging",
  "planning",
  "declarative",
  "ims",
  "ims",
  "monitoring",
  "evaluation",
  "evaluation",
  "debugging",
] as const;

const MAI_LABELS: Record<string, string> = {
  declarative: "Connaissance déclarative",
  procedural: "Connaissance procédurale",
  conditional: "Connaissance conditionnelle",
  planning: "Planification",
  ims: "Gestion de l'information",
  monitoring: "Contrôle en cours d'apprentissage",
  debugging: "Ajustement des stratégies",
  evaluation: "Évaluation",
};

function summarizeMai(answers: Record<string, unknown>): CareTestSummary {
  const questions = getCareQuestionnaire("mai")?.questions ?? [];
  const buckets = new Map<string, number[]>();
  questions.forEach((question, index) => {
    const key = MAI_ITEM_CATEGORY[index] ?? "evaluation";
    const value = numericAnswer(answers[question.id], 1);
    if (value == null) return;
    const list = buckets.get(key) ?? [];
    list.push(value > 0 ? 1 : 0);
    buckets.set(key, list);
  });
  const categories = Object.keys(MAI_LABELS).flatMap((id) => {
    const values = buckets.get(id);
    if (!values?.length) return [];
    return [category(id, MAI_LABELS[id], meanPercent(values, 1))];
  });
  const overall = categories.length
    ? Math.round(categories.reduce((sum, item) => sum + item.percent, 0) / categories.length)
    : 0;
  const low = categories.filter((item) => item.level === "faible").map((item) => item.label.toLowerCase());
  const high = categories.filter((item) => item.level === "eleve").map((item) => item.label.toLowerCase());
  const analysisParts = [
    `Résultat global du MAI : ${overall} %. ${interpretJessicaScore("metacognition", Math.round((overall / 100) * 52))}.`,
  ];
  if (high.length) {
    analysisParts.push(`Les appuis les plus nets portent sur ${high.join(", ")}.`);
  }
  if (low.length) {
    analysisParts.push(
      `Les axes à travailler en séance concernent ${low.join(", ")}. Ce sont des leviers concrets (objectifs, stratégies, vérification) plutôt qu'un diagnostic.`,
    );
  } else {
    analysisParts.push("Le profil métacognitif est globalement équilibré. On peut affiner les stratégies déjà en place.");
  }
  return {
    title: "Test MAI",
    overallLabel: `${overall} % · profil métacognitif`,
    overallPercent: overall,
    categories,
    analysis: analysisParts.join("\n\n"),
  };
}

function summarizeSoft(answers: Record<string, unknown>): CareTestSummary {
  const categories = SOFT_SKILLS.map((skill) => {
    const items = SOFT_SKILLS_QUESTIONS.filter((question) => question.compId === skill.id);
    const values = items
      .map((question) => numericAnswer(answers[question.id], 4))
      .filter((value): value is number => value != null);
    return category(String(skill.id), skill.titre, meanPercent(values, 4));
  })
    .filter((item) => Number.isFinite(item.percent))
    .sort((a, b) => b.percent - a.percent);
  const overall = categories.length
    ? Math.round(categories.reduce((sum, item) => sum + item.percent, 0) / categories.length)
    : 0;
  const ranked = [...categories].sort((a, b) => b.percent - a.percent);
  const top = ranked.slice(0, 3).map((item) => item.label.toLowerCase());
  const bottom = ranked.slice(-3).reverse().map((item) => item.label.toLowerCase());
  return {
    title: "Test des soft skills",
    overallLabel: `${overall} / 100`,
    overallPercent: overall,
    categories,
    analysis: [
      `Résultat global : ${overall} / 100 sur l'ensemble des compétences relationnelles évaluées.`,
      top.length ? `Forces relatives : ${top.join(", ")}.` : "",
      bottom.length ? `Compétences à accompagner : ${bottom.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function truthyCheckbox(value: unknown) {
  if (value === true || value === 1 || value === "1") return true;
  if (Array.isArray(value)) return value.length > 0;
  const raw = String(value ?? "").trim();
  return Boolean(raw) && raw !== "0" && raw !== "false";
}

function valueFor(questions: { id: string; label: string }[], answers: Record<string, unknown>, match: string, max: number) {
  const question = questions.find((item) => item.id.includes(match) || item.label.toLowerCase().includes(match));
  if (!question) return null;
  return numericAnswer(answers[question.id], max);
}

function summarizeStress(answers: Record<string, unknown>): CareTestSummary {
  const questions = getCareQuestionnaire("stress-academique")?.questions ?? [];
  const perceived = [valueFor(questions, answers, "vous_sente", 5), valueFor(questions, answers, "submerge", 4)].filter(
    (n): n is number => n != null,
  );
  const body = [valueFor(questions, answers, "ressen_8", 4), valueFor(questions, answers, "ces_sympto", 5)].filter(
    (n): n is number => n != null,
  );
  const emotion = [valueFor(questions, answers, "avez_vous__", 4), valueFor(questions, answers, "ces_emotions", 4)].filter(
    (n): n is number => n != null,
  );
  const learning = [
    valueFor(questions, answers, "difficultes_a_v", 4),
    valueFor(questions, answers, "decririez_vous", 5),
  ].filter((n): n is number => n != null);
  const coping = [valueFor(questions, answers, "evalueriez_vous", 5), valueFor(questions, answers, "mesure_ces__", 5)].filter(
    (n): n is number => n != null,
  );
  const sources = questions
    .filter((question) => question.type === "checkbox" && truthyCheckbox(answers[question.id]))
    .map((question) => question.label);
  const categories = [
    category("percu", "Stress perçu", meanPercent(perceived, 5), true),
    category("corps", "Signes physiques", meanPercent(body, 5), true),
    category("emotion", "Charge émotionnelle", meanPercent(emotion, 4), true),
    category("learn", "Impact sur les apprentissages", meanPercent(learning, 5), true),
    category("coping", "Capacité à réguler", meanPercent(coping, 5)),
  ];
  const load = categories.filter((item) => item.id !== "coping");
  const overall = load.length ? Math.round(load.reduce((sum, item) => sum + item.percent, 0) / load.length) : 0;
  const overallLabel =
    overall < 40 ? `${overall} % · stress plutôt bas` : overall < 70 ? `${overall} % · stress dans la moyenne` : `${overall} % · stress élevé`;
  const sourceLine = sources.length
    ? `Sources principalement citées : ${sources.join(", ")}.`
    : "Aucune source de stress n'a été cochée.";
  return {
    title: "Test de stress académique",
    overallLabel,
    overallPercent: overall,
    categories,
    analysis: [
      `Le niveau de stress académique ressort à ${overall} % sur les dimensions perçues, corporelles, émotionnelles et scolaires.`,
      sourceLine,
      "Ce n'est pas un diagnostic. L'accompagnement peut viser la charge, les stratégies de régulation et le lien avec les apprentissages.",
    ].join("\n\n"),
  };
}

export function summarizeCareTest(testSlug: string, answers: Record<string, unknown> | null | undefined): CareTestSummary {
  const payload = answers && typeof answers === "object" ? answers : {};
  if (testSlug === "mai") return summarizeMai(payload);
  if (testSlug === "soft-skills") return summarizeSoft(payload);
  if (testSlug === "stress-academique") return summarizeStress(payload);
  const test = getCareTest(testSlug);
  return {
    title: test?.title ?? testSlug,
    overallLabel: "Complété",
    overallPercent: null,
    categories: [],
    analysis: "Le test a été complété. Le détail des réponses n'est pas affiché ; le score global est disponible ci-dessus.",
  };
}

export function careSummaryDigest(summary: CareTestSummary) {
  const cats = summary.categories.map((item) => `${item.label}: ${item.percent}% (${item.comment})`).join(" ; ");
  return `${summary.title} — ${summary.overallLabel}\n${cats}\n${summary.analysis}`;
}
