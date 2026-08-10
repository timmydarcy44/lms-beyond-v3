import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EdgePlanId } from "@/lib/edge-site/beyond-pricing";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type OrgEdgeOffer = EdgePlanId | null;

export function parseOrgEdgeOffer(raw: unknown): OrgEdgeOffer {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "skills" || value === "learning" || value === "learning-plus") {
    return value;
  }
  return null;
}

export function orgHasLearningPlusLibrary(offer: OrgEdgeOffer): boolean {
  return offer === "learning-plus";
}

/** Résout l’organisation du salarié puis son offre EDGE. */
export async function resolveSalarieOrgEdgeOffer(
  userId: string,
  authClient?: SupabaseClient | null,
): Promise<{
  organizationId: string | null;
  offer: OrgEdgeOffer;
  hasLibraryAccess: boolean;
}> {
  const uid = userId.trim();
  if (!uid) {
    return { organizationId: null, offer: null, hasLibraryAccess: false };
  }

  const service = getServiceRoleClient() ?? authClient ?? null;
  if (!service) {
    return { organizationId: null, offer: null, hasLibraryAccess: false };
  }

  const { data: profile } = await service
    .from("profiles")
    .select("entreprise_id, company_id")
    .eq("id", uid)
    .maybeSingle();

  let organizationId =
    (typeof profile?.entreprise_id === "string" && profile.entreprise_id) ||
    (typeof profile?.company_id === "string" && profile.company_id) ||
    null;

  if (!organizationId) {
    const { data: employee } = await service
      .from("employees")
      .select("company_id")
      .eq("profile_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    organizationId =
      typeof employee?.company_id === "string" ? employee.company_id : null;
  }

  if (!organizationId) {
    return { organizationId: null, offer: null, hasLibraryAccess: false };
  }

  const { data: org } = await service
    .from("organizations")
    .select("edge_offer")
    .eq("id", organizationId)
    .maybeSingle();

  const offer = parseOrgEdgeOffer(org?.edge_offer);
  return {
    organizationId,
    offer,
    hasLibraryAccess: orgHasLearningPlusLibrary(offer),
  };
}
