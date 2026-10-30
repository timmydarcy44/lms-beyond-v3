import { careContentChecks, careContentReady, type CarePublicationInput } from "@/lib/care/publication";

export const CARE_PUBLICS = ["enfants", "adolescents", "adultes", "parents", "couples", "entreprises"] as const;

export type CarePublishCheckId = "photo" | "tagline" | "presentation" | "domain" | "service" | "place";

export type CarePublishCheck = {
  id: CarePublishCheckId;
  label: string;
  ok: boolean;
};

export function carePublishChecks(profile: CarePublicationInput): CarePublishCheck[] {
  return careContentChecks(profile);
}

export function careCompleteness(profile: CarePublicationInput) {
  const checks = carePublishChecks(profile);
  const done = checks.filter((item) => item.ok).length;
  return {
    checks,
    missing: checks.filter((item) => !item.ok),
    percent: checks.length ? Math.round((done / checks.length) * 100) : 0,
    canPublish: true,
  };
}

export function isCareDirectoryComplete(row: CarePublicationInput) {
  return careContentReady(row);
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
