import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import {
  parseExpertDocuments,
  parseExpertInternalNotes,
  parseExpertRegistrationMeta,
} from "@/lib/expert/admin-expert-types";

export type ExpertTimelineEvent = {
  id: string;
  type: "registration" | "approved" | "rejected" | "needs_info" | "internal_note" | "certified";
  label: string;
  message?: string;
  at: string;
};

export function computeExpertProfileProgress(expert: AdminExpertRow, meta: Record<string, unknown> | null): number {
  const checks = [
    Boolean(expert.first_name && expert.last_name),
    Boolean(expert.email),
    Boolean(expert.headline),
    Boolean(expert.photo_url || expert.avatar_url),
    Boolean(expert.linkedin_url),
    Boolean(expert.bio || expert.bio_long),
    Boolean((expert.specialties ?? []).length),
    Boolean((expert.formats_supported ?? []).length),
    Boolean(meta?.domains || meta?.primary_domain),
    Boolean((meta?.audiences as string[] | undefined)?.length),
    Boolean((meta?.languages as string[] | undefined)?.length),
    Boolean(parseExpertDocuments(expert.references).length),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function buildExpertTimeline(expert: AdminExpertRow): ExpertTimelineEvent[] {
  const events: ExpertTimelineEvent[] = [];

  if (expert.created_at) {
    events.push({
      id: "registration",
      type: "registration",
      label: "Inscription reçue",
      at: expert.created_at,
    });
  }

  const notes = parseExpertInternalNotes(expert.references);
  for (const note of notes) {
    const type =
      note.action === "approved"
        ? "approved"
        : note.action === "rejected"
          ? "rejected"
          : note.action === "needs_info"
            ? "needs_info"
            : "internal_note";
    events.push({
      id: `${type}-${note.at ?? Math.random()}`,
      type,
      label:
        type === "approved"
          ? "Profil validé"
          : type === "rejected"
            ? "Profil refusé"
            : type === "needs_info"
              ? "Informations demandées"
              : "Note interne",
      message: note.message,
      at: note.at ?? expert.created_at ?? new Date().toISOString(),
    });
  }

  if (expert.review_status === "approved" && !notes.some((n) => n.action === "approved")) {
    events.push({
      id: "approved-status",
      type: "approved",
      label: "Profil validé",
      at: expert.created_at ?? new Date().toISOString(),
    });
  }

  if (expert.is_certified_beyond || expert.certification_status === "certified") {
    events.push({
      id: "certified",
      type: "certified",
      label: "EDGE Certified",
      at: expert.created_at ?? new Date().toISOString(),
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function getExpertDomains(meta: Record<string, unknown> | null, expert: AdminExpertRow): string[] {
  if (Array.isArray(meta?.domains)) return meta.domains as string[];
  if (meta?.primary_domain) return [String(meta.primary_domain)];
  return [];
}

export type ExpertCrmKpis = {
  missionsCount: number | null;
  documentsCount: number;
  yearsExperience: string | null;
  profileProgress: number;
  lastActivityLabel: string | null;
  rating: number | null;
};

export function computeExpertKpis(
  expert: AdminExpertRow,
  meta: Record<string, unknown> | null,
): ExpertCrmKpis {
  const documents = parseExpertDocuments(expert.references);
  const notes = parseExpertInternalNotes(expert.references);
  const progress = computeExpertProfileProgress(expert, meta);

  const missionsRaw = meta?.missions_count ?? meta?.missions_completed;
  const missionsCount =
    typeof missionsRaw === "number" ? missionsRaw : typeof missionsRaw === "string" ? Number(missionsRaw) || null : null;

  const ratingRaw = meta?.rating ?? meta?.average_rating;
  const rating =
    typeof ratingRaw === "number" ? ratingRaw : typeof ratingRaw === "string" ? Number(ratingRaw) || null : null;

  const lastNote = notes
    .filter((n) => n.at)
    .sort((a, b) => new Date(b.at!).getTime() - new Date(a.at!).getTime())[0];

  const lastActivityLabel = lastNote?.at
    ? new Date(lastNote.at).toLocaleDateString("fr-FR")
    : expert.created_at
      ? new Date(expert.created_at).toLocaleDateString("fr-FR")
      : null;

  return {
    missionsCount,
    documentsCount: documents.length,
    yearsExperience: typeof meta?.years_experience === "string" ? meta.years_experience : null,
    profileProgress: progress,
    lastActivityLabel,
    rating,
  };
}

export function getExpertCoverUrl(meta: Record<string, unknown> | null): string | null {
  if (typeof meta?.cover_url === "string" && meta.cover_url.trim()) return meta.cover_url.trim();
  return null;
}

export function getExpertPortfolioUrl(meta: Record<string, unknown> | null): string | null {
  const url = meta?.website_url ?? meta?.portfolio_url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

export function getExpertCvUrl(expert: AdminExpertRow): string | null {
  const docs = parseExpertDocuments(expert.references);
  const cv = docs.find(
    (d) =>
      String(d.label ?? d.name ?? "")
        .toLowerCase()
        .includes("cv") || (d as { _type?: string })._type === "edge_cv",
  );
  return cv?.url ? String(cv.url) : null;
}
