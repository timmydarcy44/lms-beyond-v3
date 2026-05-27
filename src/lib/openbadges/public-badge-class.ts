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

function mapSupabaseRow(row: Record<string, unknown>): PublicBadgeClassView | null {
  if (!row.id) return null;
  const config =
    row.evaluation_config && typeof row.evaluation_config === "object"
      ? (row.evaluation_config as Record<string, unknown>)
      : {};
  const criteriaRaw = Array.isArray(config.criteria) ? config.criteria : [];
  const structuredCriteria = criteriaRaw
    .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === "object"))
    .map((c, index) => ({
      id: String(c.id ?? `c-${index}`),
      label: String(c.label ?? ""),
      description: typeof c.description === "string" ? c.description : null,
    }))
    .filter((c) => c.label.trim());

  const level =
    typeof config.level === "number"
      ? config.level
      : typeof config.level === "string" && config.level.trim()
        ? Number.parseInt(String(config.level), 10)
        : null;

  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? row.title ?? "Open Badge"),
    description: String(row.description ?? ""),
    imageUrl: (row.image_url as string | null) ?? null,
    level: Number.isFinite(level) ? level : null,
    criteriaMarkdown: String(row.criteria ?? config.criteriaMarkdown ?? ""),
    structuredCriteria,
    issuerName: "EDGE",
    issuerUrl: getPublicShareBaseUrl(),
    organizationName: null,
  };
}

export async function loadPublicBadgeClass(
  badgeClassId: string,
): Promise<PublicBadgeClassView | null> {
  const supabaseRow = await getOpenBadgeClassByIdOnly(badgeClassId);
  if (supabaseRow) {
    return mapSupabaseRow(supabaseRow);
  }

  if (!resolveAndApplyDatabaseUrl()) return null;

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
}

export function buildPublicBadgeShareDescription(badge: PublicBadgeClassView): string {
  const level =
    badge.level != null ? ` — niveau ${badge.level}` : "";
  const intro = badge.description.trim();
  return (
    intro ||
    `Open Badge EDGE : ${badge.name}${level}. Certification vérifiable et partageable.`
  );
}
