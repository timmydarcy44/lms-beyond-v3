import { getOpenAIClient } from "@/lib/ai/openai-client";
import { capableModel } from "@/lib/openbadges/badge-course-generation";
import type { DeliverableFormat } from "@/lib/openbadges/badge-builder";
import type { BadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import { looksEnglish, sentenceCount, wordCount } from "@/lib/openbadges/badge-quality";

const FORMATS = new Set<DeliverableFormat>(["text", "file", "video", "link"]);

export type GeneratedModality = {
  context: string;
  learnerPrompt: string;
  deliverable: { title: string; description: string; format: DeliverableFormat };
  situation?: {
    character: string;
    objective: string;
    moments: Array<{ prompt: string; choices: string[]; requiresJustification: boolean }>;
  };
};

const SYSTEM = `Tu rédiges une modalité d'épreuve Byound, en français uniquement.
JSON strict :
{"context":"","learnerPrompt":"","deliverable":{"title":"","description":"","format":"text"},"situation":{"character":"","objective":"","moments":[{"prompt":"","choices":["",""],"requiresJustification":true}]}}
Règles :
- Pour une étude de cas, un document ou un playground : learnerPrompt fait 3 à 6 phrases. C'est ce que le candidat doit faire. N'y mets aucun seuil : pas de « au moins », pas de pourcentage, pas de nombre de mots.
- Pour une vidéo ou une réponse orale : learnerPrompt est une seule question ouverte, et elle se termine par « ? ». context est vide. Pas de dossier, pas de seuil.
- context : pour une étude de cas, nomme une personne (prénom, métier ou âge) et deux faits concrets, au moins 40 mots. Pour un document, deux phrases de cadre. Pour une vidéo, une réponse orale ou un bac à sable, une chaîne vide.
- Le livrable a un titre nommé, par exemple « Analyse et plan d'action ».
- situation seulement pour une mise en situation : un personnage, un objectif, et 3 moments. Chaque moment a une consigne et 2 à 4 choix, ou un tableau vide si la réponse est libre.
- Couvre seulement les critères donnés. N'en invente pas.
- Pas d'anglais. Pas de « Source : ».`;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function parseGeneratedModality(raw: unknown): GeneratedModality | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const learnerPrompt = text(row.learnerPrompt);
  const context = text(row.context);
  const deliverableRaw = row.deliverable && typeof row.deliverable === "object" ? row.deliverable as Record<string, unknown> : {};
  const formatRaw = text(deliverableRaw.format);
  const format = FORMATS.has(formatRaw as DeliverableFormat) ? formatRaw as DeliverableFormat : "text";
  let situation: GeneratedModality["situation"];
  if (row.situation && typeof row.situation === "object") {
    const sit = row.situation as Record<string, unknown>;
    const moments = Array.isArray(sit.moments) ? sit.moments.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const moment = item as Record<string, unknown>;
      const prompt = text(moment.prompt);
      if (!prompt) return [];
      const choices = Array.isArray(moment.choices) ? moment.choices.map((choice) => text(choice)).filter(Boolean).slice(0, 4) : [];
      return [{ prompt, choices, requiresJustification: moment.requiresJustification !== false }];
    }) : [];
    situation = { character: text(sit.character), objective: text(sit.objective), moments };
  }
  return {
    context,
    learnerPrompt,
    deliverable: {
      title: text(deliverableRaw.title),
      description: text(deliverableRaw.description),
      format,
    },
    situation,
  };
}

export function modalityIssues(
  modality: GeneratedModality | null,
  methodId: BadgeEvaluationMethodId,
  activityType?: string,
): string[] {
  if (!modality) return ["Le modèle n'a pas renvoyé de contenu exploitable."];
  const issues: string[] = [];
  const visible = [modality.context, modality.learnerPrompt, modality.deliverable.title, modality.deliverable.description, modality.situation?.character ?? "", modality.situation?.objective ?? ""].join("\n");
  if (looksEnglish(visible)) issues.push("Le texte est en anglais.");
  const spoken = methodId === "video" || methodId === "dictation";
  const question = modality.learnerPrompt.trim();
  if (spoken) {
    const marks = question.match(/\?/g)?.length ?? 0;
    if (marks !== 1 || !question.endsWith("?")) issues.push("Il faut une seule question ouverte.");
  } else if (sentenceCount(question) < 2) {
    issues.push("La consigne fait moins de deux phrases.");
  }
  if (methodId === "case_study" && wordCount(modality.context) < 25) {
    issues.push("Le contexte ne décrit pas une personne et une situation.");
  }
  if (!spoken && methodId !== "qcm" && !modality.deliverable.title) issues.push("Le livrable n'a pas de titre.");
  if (activityType === "situation") {
    if (!modality.situation?.character || !modality.situation.objective) issues.push("La mise en situation n'a pas de personnage ou d'objectif.");
    if ((modality.situation?.moments.length ?? 0) < 2) issues.push("La mise en situation a moins de deux moments.");
  }
  return issues;
}

export async function generateModality(input: {
  methodId: BadgeEvaluationMethodId;
  activityType?: string;
  badgeName: string;
  level: string;
  characterName?: string;
  criteria: Array<{ label: string; expectedOutcome?: string | null }>;
}): Promise<GeneratedModality> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error("La clé OpenAI n'est pas configurée.");
  const criteria = input.criteria
    .map((item, index) => `${index + 1}. ${item.label}${item.expectedOutcome?.trim() ? `\nAttendu confidentiel, à ne pas recopier : ${item.expectedOutcome.trim()}` : ""}`)
    .join("\n");
  const kind = input.activityType === "situation"
    ? "mise en situation (playground)"
    : input.activityType === "sandbox"
      ? "bac à sable IA (playground)"
      : input.methodId;
  let feedback = "";
  let last: GeneratedModality | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const completion = await openai.chat.completions.create({
      model: capableModel(),
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 1800,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            `Badge : ${input.badgeName || "Sans titre"}`,
            input.level ? `Niveau : ${input.level}` : "",
            `Modalité : ${kind}`,
            input.methodId === "video" || input.methodId === "dictation"
              ? "Rédige une seule question ouverte. Elle se termine par un point d'interrogation. Pas de dossier."
              : "",
            input.methodId === "case_study" && input.characterName
              ? `Le personnage s'appelle ${input.characterName}. Utilise ce prénom partout. N'en invente aucun autre.`
              : "",
            `Critères à évaluer :\n${criteria}`,
            feedback ? `La tentative précédente est à corriger :\n- ${feedback}` : "",
          ].filter(Boolean).join("\n\n"),
        },
      ],
    });
    let json: unknown = {};
    try {
      json = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    } catch {
      json = {};
    }
    last = parseGeneratedModality(json);
    const issues = modalityIssues(last, input.methodId, input.activityType);
    if (input.methodId === "case_study" && input.characterName && last && !`${last.context}\n${last.learnerPrompt}`.includes(input.characterName)) {
      issues.push(`Le personnage doit s'appeler ${input.characterName}, et aucun autre prénom.`);
    }
    if (last && issues.length === 0) return last;
    feedback = issues.join("\n- ");
  }
  if (last?.learnerPrompt) return last;
  throw new Error(feedback || "La création n'a pas abouti.");
}

const ANTHROPIC_SYSTEM = `Tu rédiges le prompt qu'un concepteur collera dans Claude, avec ses propres documents.
JSON strict : {"prompt":""}
Le prompt, en français, fait 180 à 320 mots. Il :
- nomme le badge, le niveau et les critères à couvrir
- le personnage a un seul prénom, donné par le concepteur. Répète ce prénom. Interdis à Claude d'en choisir un autre, d'en ajouter un second, ou d'écrire « par exemple »
- dit à Claude de produire une étude de cas avec ce personnage, des données chiffrées, et plusieurs pièces (tableau, extrait, note interne)
- dit au concepteur quelles pièces joindre à côté du prompt : PDF, tableur ou notes
- demande deux blocs séparés, titrés « Dossier apprenant » et « Consigne »
- interdit de recopier les seuils (« au moins », pourcentages) dans le dossier que l'apprenant lira
- interdit d'inventer une source scientifique
Pas d'anglais. Pas de préambule hors du champ prompt.`;

export async function writeAnthropicCasePrompt(input: {
  badgeName: string;
  level: string;
  characterName: string;
  criteria: Array<{ label: string; expectedOutcome?: string | null }>;
}): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error("La clé OpenAI n'est pas configurée.");
  const criteria = input.criteria
    .map((item, index) => `${index + 1}. ${item.label}${item.expectedOutcome?.trim() ? `\nSeuil confidentiel, à ne pas publier : ${item.expectedOutcome.trim()}` : ""}`)
    .join("\n");
  const completion = await openai.chat.completions.create({
    model: capableModel(),
    temperature: 0.4,
    response_format: { type: "json_object" },
    max_tokens: 1200,
    messages: [
      { role: "system", content: ANTHROPIC_SYSTEM },
      {
        role: "user",
        content: [
          `Badge : ${input.badgeName || "Sans titre"}`,
          input.level ? `Niveau : ${input.level}` : "",
          `Prénom unique du personnage : ${input.characterName}. Aucun autre prénom n'est autorisé, ni dans le prompt, ni dans ce que Claude écrira.`,
          `Critères :\n${criteria}`,
        ].filter(Boolean).join("\n\n"),
      },
    ],
  });
  let parsed: { prompt?: string } = {};
  try {
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { prompt?: string };
  } catch {
    parsed = {};
  }
  const prompt = String(parsed.prompt ?? "").trim();
  if (prompt.length < 80) throw new Error("Le prompt n'a pas abouti.");
  const lock = `Le personnage s'appelle ${input.characterName}. C'est le seul prénom autorisé. N'en invente aucun autre.`;
  return prompt.includes(lock) ? prompt : `${lock}\n\n${prompt}`;
}
