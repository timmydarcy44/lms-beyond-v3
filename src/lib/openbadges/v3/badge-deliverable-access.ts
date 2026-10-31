import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveMethodConfigsForBadge } from "@/lib/openbadges/badge-method-config";
import { getLearnerSubmissionsFromConfig } from "@/lib/openbadges/open-badge-earner-submissions";
import { companyDeliverablesFromSubmissions, deliverablesSharedWithCompanies } from "@/lib/openbadges/v3/company-deliverables";
import { formatBadgeLongDate, stripRemoteUrls } from "@/lib/openbadges/v3/badge-page-display";

export type DeliverableCard = {
  title: string;
  description: string | null;
  dateLabel: string | null;
  validatedBy: string | null;
  fileIndex: number | null;
};

type FileRef = { url: string };

export type DeliverableAccess = {
  count: number;
  shared: boolean;
  cards: DeliverableCard[];
  files: FileRef[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function textOrNull(value: string) {
  const cleaned = stripRemoteUrls(value);
  return cleaned || null;
}

export function presentDeliverableAccess(input: {
  shared: boolean;
  submissions: Array<{ title: string; text: string | null; url: string | null; submittedAt?: string | null }>;
  evidence: Array<{ title: string; description: string | null; url: string | null; date: string | null; validatedBy: string | null; isPublic: boolean }>;
}): DeliverableAccess {
  const visibleEvidence = input.evidence.filter((item) => input.shared || item.isPublic);
  const visible = [
    ...(input.shared ? input.submissions.map((item) => ({
      title: item.title,
      description: item.text ? textOrNull(item.text) : null,
      dateLabel: item.submittedAt ? formatBadgeLongDate(item.submittedAt) : null,
      validatedBy: null as string | null,
      url: item.url,
    })) : []),
    ...visibleEvidence.map((item) => ({
      title: item.title,
      description: item.description ? textOrNull(item.description) : null,
      dateLabel: item.date ? formatBadgeLongDate(item.date) : null,
      validatedBy: item.validatedBy,
      url: item.url,
    })),
  ];
  const files: FileRef[] = [];
  const cards = visible.map((item) => {
    const fileIndex = item.url ? files.push({ url: item.url }) - 1 : null;
    return {
      title: item.title,
      description: item.description,
      dateLabel: item.dateLabel,
      validatedBy: item.validatedBy,
      fileIndex,
    };
  });
  return {
    count: input.submissions.length + input.evidence.length,
    shared: input.shared,
    cards,
    files,
  };
}

function evidenceRows(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = asRecord(item);
    if (!record || record.kind === "companyDeliverableShare") return [];
    const title = String(record.name ?? record.narrative ?? "").trim();
    if (!title) return [];
    const narrative = typeof record.narrative === "string" ? record.narrative.trim() : "";
    const description = typeof record.description === "string" ? record.description.trim() : narrative && narrative !== title ? narrative : "";
    const validated = record.validatedBy ?? record.validated_by;
    const date = typeof record.date === "string" ? record.date : null;
    return [{
      title,
      description: description || null,
      url: typeof record.url === "string" && record.url.trim() ? record.url.trim() : null,
      date,
      validatedBy: typeof validated === "string" && validated.trim() ? validated.trim() : null,
      isPublic: record.public === true || record.public === "true",
    }];
  });
}

export async function loadDeliverableAccess(db: SupabaseClient, assertionId: string): Promise<DeliverableAccess | null> {
  const { data: assertion } = await db
    .from("badge_assertions")
    .select("recipient_profile_id, badge_class_id, evidence, is_public")
    .eq("id", assertionId)
    .maybeSingle();
  if (!assertion || assertion.is_public !== true) return null;
  const { data: badgeClass } = await db
    .from("open_badges")
    .select("evaluation_config")
    .eq("id", assertion.badge_class_id)
    .maybeSingle();
  const config = badgeClass?.evaluation_config;
  const submissions = getLearnerSubmissionsFromConfig(config, String(assertion.recipient_profile_id));
  const methods = resolveMethodConfigsForBadge(
    config && typeof config === "object" && !Array.isArray(config) ? (config as Record<string, unknown>) : {},
  );
  return presentDeliverableAccess({
    shared: deliverablesSharedWithCompanies(assertion.evidence),
    submissions: companyDeliverablesFromSubmissions(submissions, methods).map((item) => ({
      title: item.methodLabel,
      text: item.text,
      url: item.url,
      submittedAt: item.submittedAt,
    })),
    evidence: evidenceRows(assertion.evidence),
  });
}

export function storageObjectFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: decodeURIComponent(match[1]), path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
}

export async function signedDeliverableUrl(db: SupabaseClient, url: string) {
  const stored = storageObjectFromUrl(url);
  if (stored) {
    const { data } = await db.storage.from(stored.bucket).createSignedUrl(stored.path, 60);
    return data?.signedUrl ?? null;
  }
  if (url.startsWith("https://")) return url;
  return null;
}
