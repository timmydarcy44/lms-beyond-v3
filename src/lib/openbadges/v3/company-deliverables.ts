import { BADGE_EVALUATION_METHODS, type BadgeEvaluationMethodId, isBadgeEvaluationMethodId } from "@/lib/openbadges/badge-evaluation";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { parsePlaygroundAttemptPayload } from "@/lib/openbadges/badge-playground-session";

const METHOD_LABEL = Object.fromEntries(BADGE_EVALUATION_METHODS.map((method) => [method.id, method.label])) as Record<
  BadgeEvaluationMethodId,
  string
>;

const SHARE_KIND = "companyDeliverableShare";

export type CompanyDeliverable = {
  methodLabel: string;
  text: string | null;
  url: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstUrl(value: string) {
  const match = value.match(/https?:\/\/\S+/);
  return match ? match[0].replace(/[),.;]+$/, "") : null;
}

export function deliverablesSharedWithCompanies(evidence: unknown) {
  if (!Array.isArray(evidence)) return false;
  return evidence.some((item) => {
    const record = asRecord(item);
    return record?.kind === SHARE_KIND && record.shared === true;
  });
}

export function setDeliverablesSharedWithCompanies(evidence: unknown, shared: boolean) {
  const kept = (Array.isArray(evidence) ? evidence : []).filter((item) => asRecord(item)?.kind !== SHARE_KIND);
  return [...kept, { kind: SHARE_KIND, shared }];
}

function qcmText(raw: Record<string, unknown>, config: BadgeMethodConfig | undefined) {
  const answers = asRecord(raw.qcmAnswers) ?? {};
  const questions = config?.quiz?.questions ?? [];
  if (questions.length === 0) {
    const values = Object.values(answers).map((value) => (Array.isArray(value) ? value.join(", ") : String(value ?? ""))).filter(Boolean);
    return values.join("\n");
  }
  return questions
    .map((question) => {
      const value = answers[question.id];
      const selected = new Set(Array.isArray(value) ? value.map(String) : [String(value ?? "")]);
      const labels = question.choices.filter((choice) => selected.has(choice.id)).map((choice) => choice.label);
      const written = labels.length > 0 ? labels.join(", ") : Array.isArray(value) ? value.join(", ") : String(value ?? "");
      return written.trim() ? `${question.prompt}\n${written.trim()}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function responseText(raw: Record<string, unknown>, methodId: BadgeEvaluationMethodId, config: BadgeMethodConfig | undefined) {
  const text = typeof raw.responseText === "string" ? raw.responseText : "";
  if (methodId === "playground") {
    return parsePlaygroundAttemptPayload(text, raw)?.prompt ?? "";
  }
  if (methodId === "qcm") return qcmText(raw, config);
  return stripHtml(text);
}

export function companyDeliverablesFromSubmissions(submissions: unknown, configs: BadgeMethodConfig[] = []): CompanyDeliverable[] {
  if (!Array.isArray(submissions)) return [];
  const configByMethod = new Map(configs.map((config) => [config.methodId, config]));
  const items: CompanyDeliverable[] = [];
  for (const entry of submissions) {
    const record = asRecord(entry);
    const responses = Array.isArray(record?.methodResponses) ? record.methodResponses : [];
    for (const response of responses) {
      const raw = asRecord(response);
      const methodId = String(raw?.methodId ?? "");
      if (!raw || !isBadgeEvaluationMethodId(methodId)) continue;
      const text = responseText(raw, methodId, configByMethod.get(methodId)).slice(0, 4000);
      const url = firstUrl(text);
      if (!text && !url) continue;
      items.push({ methodLabel: METHOD_LABEL[methodId], text: text || null, url });
    }
  }
  return items;
}
