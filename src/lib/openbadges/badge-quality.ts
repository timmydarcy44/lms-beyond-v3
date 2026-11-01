import type { GeneratedBadge } from "@/lib/openbadges/badge-catalog";

const FORBIDDEN = /^(comprendre|connaitre|connaître|participer|savoir|etre|être)$/i;
const PRACTICE = new Set(["case_study", "video", "dictation", "pdf_upload"]);

export type QualityContext = {
  minCriteria: number;
  maxCriteria: number;
  aiTopic: boolean;
  askedQuestions: number;
  hours?: number | null;
};

export function competencyBounds(hours: number | null | undefined): { min: number; max: number } {
  return hours != null && hours > 8 ? { min: 3, max: 5 } : { min: 2, max: 3 };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function sentenceCount(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter((part) => part.length > 12).length;
}

export function looksEnglish(text: string): boolean {
  const en = text.match(/\b(the|and|with|which|this|that|are|is|of|for|from|ability|understanding|processes|knowledge)\b/gi)?.length ?? 0;
  const fr = text.match(/\b(le|la|les|des|une|un|dans|pour|avec|que|qui|est|sont|aux|sur|par)\b/gi)?.length ?? 0;
  return en >= 3 && en > fr;
}

export function isAiTopic(text: string): boolean {
  return /intelligence artificielle|\bia\b|prompt|modèle de langage|chatgpt|\bllm\b/i.test(text);
}

export function assessGeneratedBadge(badge: GeneratedBadge, context: QualityContext): string[] {
  const issues: string[] = [];
  const visible = [
    badge.name,
    badge.description,
    ...badge.criteria.flatMap((item) => [item.label, item.expectedOutcome, item.sourceModule ?? ""]),
    ...badge.competencies.flatMap((item) => [item.name, item.definition]),
    ...badge.methods.flatMap((item) => [item.learnerPrompt, item.context ?? ""]),
    ...badge.questions.flatMap((item) => [item.prompt, item.explanation ?? "", ...item.choices.map((choice) => choice.label)]),
  ].join("\n");
  if (looksEnglish(visible)) issues.push("Une partie du badge est en anglais.");
  if (!badge.domain?.trim()) issues.push("Le domaine est vide.");
  if (badge.criteria.length < context.minCriteria || badge.criteria.length > context.maxCriteria) {
    issues.push(`Il faut ${context.minCriteria} à ${context.maxCriteria} critères, pas ${badge.criteria.length}.`);
  }
  badge.criteria.forEach((criterion, index) => {
    const first = criterion.label.trim().split(/\s+/)[0]?.normalize("NFD").replace(/\p{M}/gu, "") ?? "";
    const rawFirst = criterion.label.trim().split(/\s+/)[0] ?? "";
    if (FORBIDDEN.test(rawFirst) || FORBIDDEN.test(first) || /^etre sensibilise/i.test(criterion.label.normalize("NFD").replace(/\p{M}/gu, ""))) {
      issues.push(`Le critère ${index + 1} commence par un verbe interdit.`);
    }
    if (/\bau moins\b|\d+/i.test(criterion.label)) {
      issues.push(`Le critère ${index + 1} publie un seuil. Le seuil reste dans l'attendu.`);
    }
    if (wordCount(criterion.expectedOutcome) < 15) issues.push(`L'attendu du critère ${index + 1} fait moins de 15 mots.`);
    if (!/\bau moins\b/i.test(criterion.expectedOutcome)) issues.push(`L'attendu du critère ${index + 1} ne fixe pas le seuil que l'expert doit voir.`);
    if (/\d+\s+mots/i.test(criterion.expectedOutcome)) issues.push(`L'attendu du critère ${index + 1} rappelle une longueur au lieu de décrire l'observation.`);
    if (!criterion.sourceModule?.trim()) issues.push(`Le critère ${index + 1} ne cite pas son module source.`);
  });
  const skillBounds = competencyBounds(context.hours);
  if (context.hours !== undefined && (badge.competencies.length < skillBounds.min || badge.competencies.length > skillBounds.max)) {
    issues.push(`Il faut ${skillBounds.min} à ${skillBounds.max} compétences, pas ${badge.competencies.length}.`);
  }
  if (badge.competencies.some((item) => item.name.trim().toLowerCase() === badge.name.trim().toLowerCase())) {
    issues.push("Une compétence reprend le titre du badge.");
  }
  if (badge.criteria.length > 6) issues.push("Six critères maximum pour le badge.");
  for (const skill of badge.competencies) {
    const count = badge.criteria.filter((item) => (item.competencyName ?? "").trim().toLowerCase() === skill.name.trim().toLowerCase()).length;
    if (count < 1 || count > 3) issues.push(`« ${skill.name} » doit porter 1 à 3 critères, pas ${count}.`);
  }
  const practice = badge.methods.filter((method) => PRACTICE.has(method.id) || playgroundCountsAsPractice(method, context.aiTopic));
  if (practice.length === 0) issues.push("Aucune épreuve de mise en pratique.");
  if (!badge.methods.some((method) => method.id === "qcm")) issues.push("Ajoutez un questionnaire en complément, sans livrable.");
  for (const method of badge.methods) {
    if (method.id !== "playground") continue;
    const kind = method.activityType ?? "sandbox";
    if (kind === "module") issues.push("Le module interactif n'est pas proposé par l'IA : il dépend d'un fichier fourni par l'admin.");
    if (kind === "sandbox" && !context.aiTopic) issues.push("Le bac à sable IA du Playground n'est pas adapté à ce sujet.");
  }
  for (const method of badge.methods) {
    if (sentenceCount(method.learnerPrompt) < 2) issues.push(`La consigne de ${method.id} fait moins de deux phrases.`);
    if ((method.id === "case_study" || method.id === "dictation") && wordCount(method.context ?? "") < 25) {
      issues.push(`Le contexte de ${method.id} ne décrit pas une personne et une situation.`);
    }
    if (PRACTICE.has(method.id) && method.deliverables.every((item) => !item.title.trim())) {
      issues.push(`L'épreuve ${method.id} n'a pas de livrable nommé.`);
    }
    if (method.id === "qcm" && method.deliverables.some((item) => item.title.trim())) {
      issues.push("Le questionnaire ne doit pas avoir de livrable.");
    }
  }
  const practiceIndexes = new Set(practice.flatMap((method) => method.criterionIndexes));
  badge.criteria.forEach((_, index) => {
    if (!practiceIndexes.has(index)) issues.push(`Le critère ${index + 1} n'est pas couvert par l'étude de cas.`);
  });
  const qcm = badge.methods.some((method) => method.id === "qcm");
  if (qcm) {
    const asked = context.askedQuestions;
    if (badge.questions.length < asked * 3) issues.push(`La banque a ${badge.questions.length} questions, il en faut au moins ${asked * 3}.`);
    if (asked < 4) issues.push("Moins de 4 questions posées.");
    badge.questions.forEach((question, index) => {
      if (question.choices.length < 4) issues.push(`La question ${index + 1} n'a pas 4 propositions.`);
      if (!question.choices.some((choice) => choice.isCorrect)) issues.push(`La question ${index + 1} n'a pas de bonne réponse.`);
      if (!question.explanation?.trim() || wordCount(question.explanation) < 6) issues.push(`La question ${index + 1} n'explique pas la bonne réponse.`);
      if (question.criterionIndex == null) issues.push(`La question ${index + 1} n'est pas rattachée à un critère.`);
    });
  }
  return [...new Set(issues)];
}

function playgroundCountsAsPractice(method: GeneratedBadge["methods"][number], aiTopic: boolean): boolean {
  if (method.id !== "playground") return false;
  const kind = method.activityType ?? "sandbox";
  if (kind === "situation" || kind === "module") return true;
  return kind === "sandbox" && aiTopic;
}

export function criteriaBounds(hours: number | null, kind: "section" | "synthesis" | "single" = "single"): { minCriteria: number; maxCriteria: number } {
  if (kind === "single") return { minCriteria: hours != null && hours > 8 ? 3 : 2, maxCriteria: 6 };
  if (kind === "synthesis") return { minCriteria: 6, maxCriteria: 6 };
  if (kind === "section") return hours != null && hours < 2 ? { minCriteria: 3, maxCriteria: 4 } : { minCriteria: 4, maxCriteria: 4 };
  if (hours != null && hours < 2) return { minCriteria: 3, maxCriteria: 4 };
  return { minCriteria: 4, maxCriteria: 6 };
}
