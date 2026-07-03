import type { ExpertReviewStatus } from "@/lib/expert/expert-access";

export type AdminExpertRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  bio: string | null;
  bio_long: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
  avatar_url: string | null;
  review_status: ExpertReviewStatus | string | null;
  is_active: boolean | null;
  specialties: string[] | null;
  formats_supported: string[] | null;
  regions: string[] | null;
  references: unknown;
  wants_certification: boolean | null;
  certification_status: string | null;
  is_certified_beyond: boolean | null;
  created_at: string | null;
};

export const ADMIN_EXPERT_SELECT =
  "id,email,first_name,last_name,headline,bio,bio_long,linkedin_url,photo_url,avatar_url,review_status,is_active,specialties,formats_supported,regions,references,wants_certification,certification_status,is_certified_beyond,created_at";

export function parseExpertRegistrationMeta(references: unknown) {
  if (!Array.isArray(references)) return null;
  const meta = references.find(
    (item) => item && typeof item === "object" && (item as { _type?: string })._type === "edge_registration_meta",
  ) as Record<string, unknown> | undefined;
  return meta ?? null;
}

export function parseExpertDocuments(references: unknown) {
  if (!Array.isArray(references)) return [];
  return references.filter(
    (item) =>
      item &&
      typeof item === "object" &&
      ["edge_document", "document", "edge_cv"].includes(String((item as { _type?: string })._type ?? "")),
  ) as Record<string, unknown>[];
}

export function parseExpertInternalNotes(references: unknown) {
  if (!Array.isArray(references)) return [];
  return references.filter(
    (item) => item && typeof item === "object" && (item as { _type?: string })._type === "edge_review_note",
  ) as { action?: string; message?: string; at?: string }[];
}
