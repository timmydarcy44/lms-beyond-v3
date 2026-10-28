import { isCarePlaceholderText, type CarePublicProfile } from "@/lib/care/profile-format";

export const CARE_PUBLICS = ["enfants", "adolescents", "adultes", "parents", "couples", "entreprises"] as const;

export type CarePublishCheckId = "photo" | "title" | "tagline" | "domain" | "service";

export type CarePublishCheck = {
  id: CarePublishCheckId;
  label: string;
  ok: boolean;
};

export function carePublishChecks(profile: Pick<CarePublicProfile, "avatar_url" | "title" | "tagline" | "domains" | "services">): CarePublishCheck[] {
  return [
    { id: "photo", label: "Photo", ok: Boolean(profile.avatar_url?.trim()) },
    { id: "title", label: "Titre", ok: !isCarePlaceholderText(profile.title) },
    { id: "tagline", label: "Accroche", ok: !isCarePlaceholderText(profile.tagline) },
    { id: "domain", label: "Au moins un domaine", ok: profile.domains.length >= 1 },
    { id: "service", label: "Au moins une prestation", ok: profile.services.some((item) => item.active && !isCarePlaceholderText(item.name)) },
  ];
}

export function careCompleteness(profile: Pick<CarePublicProfile, "avatar_url" | "title" | "tagline" | "domains" | "services">) {
  const checks = carePublishChecks(profile);
  const done = checks.filter((item) => item.ok).length;
  return {
    checks,
    missing: checks.filter((item) => !item.ok),
    percent: Math.round((done / checks.length) * 100),
    canPublish: true,
  };
}

export function isCareDirectoryComplete(row: {
  avatar_url: string | null;
  title: string;
  tagline: string;
  domains: unknown[];
  min_price_cents: number | null;
}) {
  return (
    Boolean(row.avatar_url?.trim()) &&
    !isCarePlaceholderText(row.title) &&
    !isCarePlaceholderText(row.tagline) &&
    Array.isArray(row.domains) &&
    row.domains.length >= 1 &&
    row.min_price_cents != null
  );
}

export function slugifyCareName(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
