import { getPublicShareBaseUrl } from "@/lib/openbadges/urls";

export function slugifyPublicProfile(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPublicProfilePath(slug: string, userId?: string | null): string {
  const clean = slugifyPublicProfile(slug);
  const path = clean ? `/p/${clean}` : "/p/profil";
  const uid = userId?.trim();
  if (!uid) return path;
  return `${path}?userId=${encodeURIComponent(uid)}`;
}

export function buildPublicProfileUrl(slug: string, userId?: string | null): string {
  const base = getPublicShareBaseUrl().replace(/\/$/, "");
  return `${base}${buildPublicProfilePath(slug, userId)}`;
}
