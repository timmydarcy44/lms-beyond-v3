import { hasCareText } from "@/lib/care/profile";
import type { CarePublicProfile } from "@/lib/care/profile";

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
    { id: "title", label: "Titre", ok: hasCareText(profile.title) },
    { id: "tagline", label: "Accroche", ok: hasCareText(profile.tagline) },
    { id: "domain", label: "Au moins un domaine", ok: profile.domains.length >= 1 },
    { id: "service", label: "Au moins une prestation", ok: profile.services.some((item) => item.active && hasCareText(item.name)) },
  ];
}

export function careCompleteness(profile: Pick<CarePublicProfile, "avatar_url" | "title" | "tagline" | "domains" | "services">) {
  const checks = carePublishChecks(profile);
  const done = checks.filter((item) => item.ok).length;
  return {
    checks,
    missing: checks.filter((item) => !item.ok),
    percent: Math.round((done / checks.length) * 100),
    canPublish: checks.every((item) => item.ok),
  };
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
