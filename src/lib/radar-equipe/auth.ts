import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

const MANAGER_ROLES = new Set(["entreprise", "admin_hr", "admin", "rh"]);

export async function assertRadarManagerAccess(organisationId: string): Promise<{
  ok: boolean;
  userId: string | null;
  error?: string;
}> {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id || !profile) {
    return { ok: false, userId: null, error: "Non authentifié" };
  }
  const role = String(profile.role ?? "").toLowerCase();
  const roleType = String(profile.role_type ?? "").toLowerCase();
  if (!MANAGER_ROLES.has(role) && !MANAGER_ROLES.has(roleType) && roleType !== "entreprise") {
    return { ok: false, userId: user.id, error: "Accès réservé aux managers RH" };
  }
  if (!profile.company_id || profile.company_id !== organisationId) {
    return { ok: false, userId: user.id, error: "Organisation non autorisée" };
  }
  return { ok: true, userId: user.id };
}

export async function getEquipeForManager(equipeId: string) {
  const service = getServiceRoleClient();
  if (!service) return { equipe: null, error: "Service indisponible" };

  const { data: equipe, error } = await service
    .from("equipes")
    .select("id, organisation_id, name, manager_id")
    .eq("id", equipeId)
    .maybeSingle();

  if (error || !equipe) return { equipe: null, error: "Équipe introuvable" };

  const access = await assertRadarManagerAccess(equipe.organisation_id as string);
  if (!access.ok) return { equipe: null, error: access.error };

  return { equipe, error: null };
}
