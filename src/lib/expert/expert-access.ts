export type ExpertReviewStatus = "pending_review" | "approved" | "rejected" | "needs_info";

export type ExpertAccessRow = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  review_status?: ExpertReviewStatus | string | null;
  is_active?: boolean | null;
  registration_step?: number | null;
  is_certified_beyond?: boolean | null;
  certification_status?: string | null;
  specialties?: string[] | null;
  formats_supported?: string[] | null;
  regions?: string[] | null;
  references?: unknown;
  wants_certification?: boolean | null;
  linkedin_url?: string | null;
  created_at?: string | null;
};

export function isExpertApproved(expert: Pick<ExpertAccessRow, "review_status" | "is_active">): boolean {
  return expert.review_status === "approved" && expert.is_active === true;
}

export function expertReviewStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "approved":
      return "Validé";
    case "rejected":
      return "Refusé";
    case "needs_info":
      return "Informations demandées";
    case "pending_review":
    default:
      return "En attente de validation";
  }
}

export const EXPERT_LOCKED_ROUTES = [
  "/dashboard/expert/interventions",
  "/dashboard/expert/activite",
] as const;

export function isExpertLockedRoute(pathname: string): boolean {
  return EXPERT_LOCKED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
