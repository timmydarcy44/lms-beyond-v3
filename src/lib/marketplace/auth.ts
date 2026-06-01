import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const MARKETPLACE_MIN_TIER = 3;

const EMPLOYEE_ROLES = new Set([
  "learner",
  "student",
  "salarie",
  "collaborateur",
  "employee",
]);

export async function getUserOrganizationTier(userId: string): Promise<number> {
  const service = getServiceRoleClient();
  if (!service) return 1;

  const { data: profile } = await service
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  const orgId = profile?.company_id as string | null | undefined;
  if (!orgId) return 1;

  const { data: org } = await service
    .from("organizations")
    .select("edge_enterprise_tier")
    .eq("id", orgId)
    .maybeSingle();

  const tier = Number(org?.edge_enterprise_tier ?? 1);
  return Number.isFinite(tier) ? tier : 1;
}

export async function assertMarketplaceAccess(): Promise<{
  ok: boolean;
  userId: string | null;
  organizationId: string | null;
  tier: number;
  error?: string;
}> {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return { ok: false, userId: null, organizationId: null, tier: 0, error: "Non authentifié" };
  }

  if (await isSuperAdmin()) {
    return {
      ok: true,
      userId: user.id,
      organizationId: (profile?.company_id as string | null) ?? null,
      tier: MARKETPLACE_MIN_TIER,
    };
  }

  const orgId = (profile?.company_id as string | null) ?? null;
  const tier = await getUserOrganizationTier(user.id);

  if (tier < MARKETPLACE_MIN_TIER) {
    return {
      ok: false,
      userId: user.id,
      organizationId: orgId,
      tier,
      error: "Marketplace réservée à l'offre EDGE for Enterprise niveau 3",
    };
  }

  return { ok: true, userId: user.id, organizationId: orgId, tier };
}

export async function assertPraticienAccess(praticienId?: string): Promise<{
  ok: boolean;
  userId: string | null;
  praticienId: string | null;
  error?: string;
}> {
  const { user } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    return { ok: false, userId: null, praticienId: null, error: "Non authentifié" };
  }

  const service = getServiceRoleClient();
  if (!service) {
    return { ok: false, userId: user.id, praticienId: null, error: "Service indisponible" };
  }

  const { ensurePraticienForUser } = await import("@/lib/marketplace/ensure-praticien");
  const { praticien, error: ensureErr } = await ensurePraticienForUser(service, user.id);
  if (!praticien) {
    return { ok: false, userId: user.id, praticienId: null, error: ensureErr ?? "Profil praticien introuvable" };
  }

  const resolvedId = praticien.id as string;
  if (praticienId && praticienId !== resolvedId) {
    return { ok: false, userId: user.id, praticienId: null, error: "Praticien non autorisé" };
  }

  return { ok: true, userId: user.id, praticienId: resolvedId };
}

export function isCollaboratorRole(role: string | null | undefined, roleType: string | null | undefined) {
  const r = String(role ?? "").toLowerCase();
  const rt = String(roleType ?? "").toLowerCase();
  return EMPLOYEE_ROLES.has(r) || EMPLOYEE_ROLES.has(rt) || rt === "entreprise" || r === "learner";
}
