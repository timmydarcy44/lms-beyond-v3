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

export function buildPublicProfilePath(slug: string): string {
  const clean = slugifyPublicProfile(slug);
  return clean ? `/p/${clean}` : "/p/profil";
}

export function buildPublicProfileUrl(slug: string): string {
  const base = getPublicShareBaseUrl().replace(/\/$/, "");
  return `${base}${buildPublicProfilePath(slug)}`;
}
