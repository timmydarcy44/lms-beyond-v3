import type { ExpertReviewStatus } from "@/lib/expert/expert-access";

export type AdminExpertRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  review_status: ExpertReviewStatus | string | null;
  is_active: boolean | null;
  specialties: string[] | null;
  formats_supported: string[] | null;
  regions: string[] | null;
  references: unknown;
  wants_certification: boolean | null;
  created_at: string | null;
};

export function parseExpertRegistrationMeta(references: unknown) {
  if (!Array.isArray(references)) return null;
  const meta = references.find(
    (item) => item && typeof item === "object" && (item as { _type?: string })._type === "edge_registration_meta",
  ) as Record<string, unknown> | undefined;
  return meta ?? null;
}
