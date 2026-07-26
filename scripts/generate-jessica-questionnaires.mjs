/**
 * Génère les définitions de questionnaires Jessica + un seed JSON des réponses Typeform.
 * Usage: node scripts/generate-jessica-questionnaires.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve("scripts");
const OUT_DEF = path.resolve("src/lib/jessica-contentin/questionnaires/definitions.generated.ts");
const OUT_SEED = path.resolve(
  "src/lib/jessica-contentin/questionnaires/seed-responses.generated.json",
);

const FILES = {
  "situation-enfant": {
    title: "Questionnaire relatif à la situation de l'enfant",
    path: String.raw`c:\Users\ISPN Le Havre 1\Downloads\Test relatif à la situation de l'enfant.csv`,
    kind: "situation",
  },
  tdah: {
    title: "Questionnaire TDAH",
    path: String.raw`c:\Users\ISPN Le Havre 1\Downloads\questionnaire TDAH.csv`,
    kind: "likert4",
  },
  "pre-diagnostic-dys": {
    title: "Pré-diagnostic DYS",
    path: String.raw`c:\Users\ISPN Le Havre 1\Downloads\pre diagnostic DYS.csv`,
    kind: "dys",
  },
  "stress-academique": {
    title: "Test de stress académique",
    path: String.raw`c:\Users\ISPN Le Havre 1\Downloads\test de stress académique.csv`,
    kind: "stress",
  },
  metacognition: {
    title: "Test de métacognition",
    path: String.raw`c:\Users\ISPN Le Havre 1\Downloads\test metacognition.csv`,
    kind: "meta",
  },
};

const SKIP = new Set([
  "#",
  "Response Type",
  "Start Date (UTC)",
  "Stage Date (UTC)",
  "Submit Date (UTC)",
  "Network ID",
  "Tags",
  "Ending",
  "Score",
  "First name",
  "Last name",
  "Email",
  "Phone number",
  "Votre prénom",
  "Votre nom",
  "Votre nom de famille",
  "Votre adresse e-mail",
  "Votre numéro de téléphone",
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inQ) {
      if (c === '"' && n === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && n === "\n") i++;
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else cur += c;
    }
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

function norm(h) {
  return (h || "").replace(/\s+/g, " ").trim();
}

function isYesNo01(vals) {
  const s = [...vals];
  return s.length > 0 && s.every((v) => v === "0" || v === "1" || v === "");
}

function detectType(label, vals, kind) {
  const clean = [...vals].filter(Boolean);
  if (kind === "meta" && isYesNo01(vals)) {
    return { type: "boolean", options: ["0", "1"] };
  }
  if (kind === "likert4") {
    return {
      type: "single",
      options: ["Jamais", "Parfois", "Souvent", "Très souvent"],
    };
  }
  if (kind === "dys") {
    const likert = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];
    if (clean.some((v) => likert.includes(v))) {
      return { type: "single", options: likert };
    }
    if (label.toLowerCase().includes("acceptez") || label.toLowerCase().includes("aimeriez")) {
      return { type: "boolean", options: ["0", "1"] };
    }
    return { type: "text" };
  }
  if (kind === "stress") {
    const freq = ["Jamais", "Rarement", "Parfois", "Souvent", "Toujours"];
    const impact = ["Pas du tout", "Peu", "Modérément", "Beaucoup", "Enormément"];
    if (clean.every((v) => !v || /^\d+$/.test(v))) {
      return { type: "scale", min: 0, max: 5 };
    }
    if (clean.some((v) => freq.includes(v))) return { type: "single", options: freq };
    if (clean.some((v) => impact.includes(v))) return { type: "single", options: impact };
    // multi checkbox columns that echo their own label when selected
    if (clean.length <= 3 && clean.every((v) => v === label || v.length < 80)) {
      return { type: "checkbox", options: [label] };
    }
    if (label.toLowerCase().includes("stratégies")) {
      return {
        type: "single",
        options: [
          "Sport ou exercice physique",
          "Parler à un proche ou à un professionnel",
          "Techniques de relaxation (ex. : respiration, méditation)",
          "Divertissements (ex. : jeux vidéo, films, etc.)",
          "Aucune stratégie particulière",
        ],
      };
    }
    return { type: "text" };
  }
  // situation
  if (clean.length <= 12 && clean.every((v) => v.length < 120)) {
    // likely multiple choice single or checkbox where value == label
    const allMatchLabel = clean.every((v) => v === label || v === "1" || v === "0");
    if (allMatchLabel || (clean.includes(label) && clean.length <= 4)) {
      return { type: "checkbox", options: [label] };
    }
    if (clean.length >= 2 && clean.length <= 8 && clean.every((v) => v.length < 90)) {
      return { type: "single", options: clean.sort() };
    }
  }
  return { type: "text" };
}

const LIKERT4_SCORE = { Jamais: 0, Parfois: 1, Souvent: 2, "Très souvent": 3 };
const LIKERT5_SCORE = { Jamais: 0, Rarement: 1, Parfois: 2, Souvent: 3, Toujours: 4 };

function scoreAnswers(slug, questions, answers) {
  if (slug === "situation-enfant") return { score: null, scoreLabel: null };
  let score = 0;
  let counted = 0;
  for (const q of questions) {
    const v = answers[q.id];
    if (v == null || v === "") continue;
    if (slug === "tdah" && LIKERT4_SCORE[v] != null) {
      score += LIKERT4_SCORE[v];
      counted++;
    } else if (slug === "pre-diagnostic-dys" && LIKERT5_SCORE[v] != null) {
      score += LIKERT5_SCORE[v];
      counted++;
    } else if (slug === "metacognition" && (v === "0" || v === "1" || v === 0 || v === 1)) {
      score += Number(v);
      counted++;
    } else if (slug === "stress-academique") {
      if (/^\d+$/.test(String(v))) {
        score += Number(v);
        counted++;
      } else if (LIKERT5_SCORE[v] != null) {
        score += LIKERT5_SCORE[v];
        counted++;
      } else if (["Pas du tout", "Peu", "Modérément", "Beaucoup", "Enormément"].includes(v)) {
        score += ["Pas du tout", "Peu", "Modérément", "Beaucoup", "Enormément"].indexOf(v);
        counted++;
      }
    }
  }
  let scoreLabel = null;
  if (slug === "tdah") {
    if (score <= 15) scoreLabel = "Votre score est inférieur ou égal à 15 (faible)";
    else if (score <= 30) scoreLabel = "Votre score est compris entre 16 et 30 (modéré)";
    else scoreLabel = "Votre score est supérieur à 30 (élevé)";
  }
  return { score: counted ? score : null, scoreLabel };
}

function findCol(header, names) {
  for (const n of names) {
    const i = header.findIndex((h) => h === n);
    if (i >= 0) return i;
  }
  return -1;
}

const definitions = {};
const seed = [];

for (const [slug, meta] of Object.entries(FILES)) {
  const rows = parseCsv(fs.readFileSync(meta.path, "utf8"));
  const header = rows[0].map(norm);
  const questions = [];
  let otherIdx = 0;
  header.forEach((h, i) => {
    if (!h || SKIP.has(h) || /^counter_/i.test(h)) return;
    const vals = new Set();
    for (const r of rows.slice(1)) {
      const v = norm(r[i] || "");
      if (v) vals.add(v);
    }
    let idBase = h
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48);
    if (h === "Other") {
      otherIdx++;
      idBase = `other_${otherIdx}`;
    }
    const detected = detectType(h, vals, meta.kind);
    questions.push({
      id: `${slug}_${idBase}_${i}`,
      label: h === "Other" ? `Précision (autre) #${otherIdx}` : h,
      colIndex: i,
      ...detected,
    });
  });

  definitions[slug] = {
    slug,
    title: meta.title,
    description:
      slug === "situation-enfant"
        ? "Anamnèse parentale — situation de l'enfant (ex-Typeform)."
        : "Questionnaire importé depuis Typeform, désormais disponible dans le CRM.",
    questions: questions.map(({ colIndex, ...q }) => q),
  };

  const idxId = findCol(header, ["#"]);
  const idxEmail = findCol(header, ["Email", "Votre adresse e-mail"]);
  const idxFirst = findCol(header, ["First name", "Votre prénom", "Prénom de l'enfant"]);
  const idxLast = findCol(header, ["Last name", "Votre nom", "Votre nom de famille", "Nom de l'enfant"]);
  const idxPhone = findCol(header, ["Phone number", "Votre numéro de téléphone"]);
  const idxScore = findCol(header, ["Score"]);
  const idxEnding = findCol(header, ["Ending"]);
  const idxSubmit = findCol(header, ["Submit Date (UTC)"]);
  const idxChildFirst = findCol(header, ["Prénom de l'enfant"]);
  const idxChildLast = findCol(header, ["Nom de l'enfant"]);
  // For situation, first/last are child; for others respondent
  const idxRespFirst =
    slug === "situation-enfant" ? -1 : findCol(header, ["First name", "Votre prénom"]);
  const idxRespLast =
    slug === "situation-enfant"
      ? -1
      : findCol(header, ["Last name", "Votre nom", "Votre nom de famille"]);

  for (const r of rows.slice(1)) {
    const externalId = idxId >= 0 ? norm(r[idxId]) : "";
    if (!externalId) continue;
    const answers = {};
    for (const q of questions) {
      const v = norm(r[q.colIndex] || "");
      if (!v) continue;
      if (q.type === "checkbox") answers[q.id] = true;
      else answers[q.id] = v;
    }
    const importedScore = idxScore >= 0 ? Number(String(r[idxScore]).replace(",", ".")) : null;
    const computed = scoreAnswers(slug, questions, answers);
    seed.push({
      questionnaire_slug: slug,
      external_id: `${slug}:${externalId}`,
      respondent_email: idxEmail >= 0 ? norm(r[idxEmail]).toLowerCase() : null,
      respondent_first_name:
        idxRespFirst >= 0
          ? norm(r[idxRespFirst])
          : null,
      respondent_last_name: idxRespLast >= 0 ? norm(r[idxRespLast]) : null,
      respondent_phone: idxPhone >= 0 ? norm(r[idxPhone]).replace(/^'/, "") : null,
      child_first_name: idxChildFirst >= 0 ? norm(r[idxChildFirst]) : null,
      child_last_name: idxChildLast >= 0 ? norm(r[idxChildLast]) : null,
      answers,
      score: Number.isFinite(importedScore) ? importedScore : computed.score,
      score_label: idxEnding >= 0 ? norm(r[idxEnding]) || computed.scoreLabel : computed.scoreLabel,
      submitted_at: idxSubmit >= 0 && r[idxSubmit] ? new Date(r[idxSubmit] + "Z").toISOString() : null,
      source: "typeform_import",
    });
  }
  console.log(slug, "questions", questions.length, "responses", seed.filter((s) => s.questionnaire_slug === slug).length);
}

fs.mkdirSync(path.dirname(OUT_DEF), { recursive: true });

const ts = `/* eslint-disable */
/** Auto-généré par scripts/generate-jessica-questionnaires.mjs — ne pas éditer à la main. */
export type JessicaQuestionType = "text" | "single" | "checkbox" | "boolean" | "scale";

export type JessicaQuestionDef = {
  id: string;
  label: string;
  type: JessicaQuestionType;
  options?: string[];
  min?: number;
  max?: number;
};

export type JessicaQuestionnaireDef = {
  slug: string;
  title: string;
  description: string;
  questions: JessicaQuestionDef[];
};

export const JESSICA_QUESTIONNAIRES: Record<string, JessicaQuestionnaireDef> = ${JSON.stringify(definitions, null, 2)};

export const JESSICA_QUESTIONNAIRE_SLUGS = ${JSON.stringify(Object.keys(definitions))} as const;

export type JessicaQuestionnaireSlug = (typeof JESSICA_QUESTIONNAIRE_SLUGS)[number];

export function getJessicaQuestionnaire(slug: string): JessicaQuestionnaireDef | null {
  return JESSICA_QUESTIONNAIRES[slug] ?? null;
}
`;

fs.writeFileSync(OUT_DEF, ts, "utf8");
fs.writeFileSync(OUT_SEED, JSON.stringify(seed), "utf8");
console.log("Wrote", OUT_DEF);
console.log("Wrote", OUT_SEED, "entries", seed.length, "bytes", fs.statSync(OUT_SEED).size);
