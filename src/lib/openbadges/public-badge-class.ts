import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { getPublicShareBaseUrl } from "@/lib/openbadges/urls";
import { prisma, resolveAndApplyDatabaseUrl } from "@/lib/prisma";

export type PublicBadgeClassView = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  criteriaMarkdown: string;
  structuredCriteria: Array<{ id: string; label: string; description: string | null }>;
  issuerName: string;
  issuerUrl: string | null;
  organizationName: string | null;
};

function isActiveBadgeStatus(raw: unknown): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  return (
    value === "active" ||
    value === "published" ||
    value === "live" ||
    value === "public" ||
    !value
  );
}

/** URL absolue HTTPS pour og:image (LinkedIn exige une image publique). */
export function resolvePublicBadgeImageUrl(
  imageUrl: string | null | undefined,
  baseUrl?: string,
): string | null {
  const raw = String(imageUrl ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (baseUrl ?? getPublicShareBaseUrl()).replace(/\/$/, "");
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function textOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function structuredCriteriaFrom(raw: unknown): PublicBadgeClassView["structuredCriteria"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)))
    .map((item, index) => ({
      id: String(item.id ?? `c-${index}`),
      label: textOrEmpty(item.label).trim(),
      description: typeof item.description === "string" ? item.description : null,
    }))
    .filter((item) => item.label);
}

/** Accepte soit la ligne Supabase brute, soit l'objet déjà mappé par le store. Ne stringifie jamais un objet. */
export function toPublicBadgeClassView(row: Record<string, unknown>): PublicBadgeClassView | null {
  if (!row.id) return null;
  const config = asRecord(row.evaluation_config) ?? asRecord(row.evaluationConfig) ?? {};
  const structuredCriteria = structuredCriteriaFrom(
    Array.isArray(row.criteria) ? row.criteria : config.criteria,
  );
  const criteriaMarkdown =
    textOrEmpty(row.criteriaMarkdown) ||
    (typeof row.criteria === "string" ? row.criteria : "") ||
    textOrEmpty(config.criteriaMarkdown) ||
    textOrEmpty(config.criteriaText);
  const levelSource = typeof row.level === "number" || typeof row.level === "string" ? row.level : config.level;
  const level =
    typeof levelSource === "number"
      ? levelSource
      : typeof levelSource === "string" && levelSource.trim()
        ? Number.parseInt(levelSource, 10)
        : null;
  const image = row.imageUrl ?? row.image_url;

  return {
    id: String(row.id),
    name: textOrEmpty(row.name) || textOrEmpty(row.title) || "Open Badge",
    description: textOrEmpty(row.description),
    imageUrl: typeof image === "string" ? image : null,
    level: Number.isFinite(level) ? level : null,
    criteriaMarkdown,
    structuredCriteria,
    issuerName: textOrEmpty(row.issuerName) || "Byound",
    issuerUrl: typeof row.issuerUrl === "string" ? row.issuerUrl : getPublicShareBaseUrl(),
    organizationName: typeof row.organizationName === "string" ? row.organizationName : null,
  };
}

export async function loadPublicBadgeClass(
  badgeClassId: string,
): Promise<PublicBadgeClassView | null> {
  const supabaseRow = await getOpenBadgeClassByIdOnly(badgeClassId);
  if (supabaseRow) {
    return toPublicBadgeClassView(supabaseRow);
  }

  if (!resolveAndApplyDatabaseUrl()) return null;

  try {
    const badgeClass = await prisma.badgeClass.findUnique({
      where: { id: badgeClassId },
      include: {
        issuer: true,
        organization: true,
        criteria: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!badgeClass || badgeClass.status !== "ACTIVE") return null;

    return {
      id: badgeClass.id,
      name: badgeClass.name,
      description: badgeClass.description,
      imageUrl: badgeClass.imageUrl ?? badgeClass.imageTemplateUrl ?? null,
      level: badgeClass.level,
      criteriaMarkdown: badgeClass.criteriaMarkdown ?? "",
      structuredCriteria: badgeClass.criteria.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
      })),
      issuerName: badgeClass.issuer.name,
      issuerUrl: badgeClass.issuer.url,
      organizationName: badgeClass.organization?.name ?? null,
    };
  } catch {
    return null;
  }
}

export function buildPublicBadgeShareDescription(badge: PublicBadgeClassView): string {
  const level =
    badge.level != null ? ` — niveau ${badge.level}` : "";
  const intro = badge.description.trim();
  return (
    intro ||
    `Open Badge Byound : ${badge.name}${level}. Certification vérifiable et partageable.`
  );
}
