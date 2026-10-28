import { isCarePlaceholderText } from "@/lib/care/profile-format";
import { slugifyCareName } from "@/lib/care/completeness";

/** Compte seedé par la migration Care — ce n'est pas un praticien réel. */
export const CARE_DEMO_ANAIS_ID = "c4e0a0a1-1111-4111-8111-0000000000a1";

/** Slugs publics tenus par un seed, à rattacher au compte expert réel. */
export const CARE_SLUG_OWNER_EMAILS: Record<string, string[]> = {
  anais: ["timmydarcy44@gmail.com"],
};

export function isCareDemoExpertId(expertId: string) {
  return expertId === CARE_DEMO_ANAIS_ID;
}

export function isCareDemoEmail(email: string | null | undefined) {
  return /care\.demo@byound\.fr$/i.test(String(email ?? "").trim());
}

export function isPlaceholderCareRow(row: {
  title?: string | null;
  tagline?: string | null;
  city?: string | null;
  expert_id?: string | null;
}) {
  if (row.expert_id && isCareDemoExpertId(String(row.expert_id))) return true;
  const title = isCarePlaceholderText(row.title);
  const tagline = isCarePlaceholderText(row.tagline);
  const city = isCarePlaceholderText(row.city);
  return title && tagline && city;
}

export function desiredCareSlug(displayName: string) {
  return slugifyCareName(displayName) || "praticien";
}
