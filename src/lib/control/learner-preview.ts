import { cookies } from "next/headers";
import { isUserSuperAdmin } from "@/lib/auth/super-admin";
import { LEARNER_PREVIEW_COOKIE } from "@/lib/control/constants";
import { impersonationCookieOptions } from "@/lib/control/session";
import {
  impersonationSecret,
  signLearnerPreviewToken,
  verifyLearnerPreviewToken,
  type LearnerPreviewToken,
} from "@/lib/control/token";

export type LearnerPreviewContext = LearnerPreviewToken & { expired: boolean };

const PREVIEW_MS = 8 * 60 * 60 * 1000;

export async function readLearnerPreviewContext(): Promise<LearnerPreviewContext | null> {
  const jar = await cookies();
  const token = await verifyLearnerPreviewToken(
    jar.get(LEARNER_PREVIEW_COOKIE)?.value,
    impersonationSecret(),
  );
  if (!token) return null;
  const expired = Date.now() >= token.exp;
  return { ...token, expired };
}

async function canOrgManageSalariePreview(
  staffId: string,
  targetUserId: string,
): Promise<boolean> {
  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const db = getServiceRoleClient();
  if (!db) return false;

  const { data: target } = await db
    .from("profiles")
    .select("id, company_id, role_type")
    .eq("id", targetUserId)
    .maybeSingle();
  let companyId = String((target as { company_id?: string | null } | null)?.company_id ?? "").trim();
  if (!companyId) {
    const { data: emp } = await db
      .from("employees")
      .select("company_id")
      .eq("profile_id", targetUserId)
      .limit(1)
      .maybeSingle();
    companyId = String((emp as { company_id?: string } | null)?.company_id ?? "").trim();
  }
  if (!companyId) return false;
  return canOrgManageSalariePreviewForCompany(db, staffId, companyId);
}

async function canOrgManageSalariePreviewForCompany(
  db: NonNullable<ReturnType<typeof import("@/lib/supabase/server").getServiceRoleClient>>,
  staffId: string,
  companyId: string,
): Promise<boolean> {
  const MANAGER = new Set(["admin", "owner", "admin_hr", "rh", "entreprise", "manager"]);
  const { data: membership } = await db
    .from("org_memberships")
    .select("role")
    .eq("org_id", companyId)
    .eq("user_id", staffId)
    .maybeSingle();
  if (membership && MANAGER.has(String((membership as { role?: string }).role ?? "").toLowerCase())) {
    return true;
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role, role_type, company_id")
    .eq("id", staffId)
    .maybeSingle();
  if (!profile) return false;
  if (String((profile as { company_id?: string }).company_id ?? "") !== companyId) return false;
  const role = String((profile as { role?: string }).role ?? "").toLowerCase();
  const roleType = String((profile as { role_type?: string }).role_type ?? "").toLowerCase();
  return MANAGER.has(role) || MANAGER.has(roleType);
}

/**
 * Si une preview lecture seule est active (BtoC Control ou espace salarié RH),
 * renvoie l’id cible. Sinon renvoie l’id de session courant.
 *
 * Autorisé : super-admin Byound, ou RH/admin de l’entreprise du collaborateur.
 */
export async function resolveEffectiveApprenantUserId(
  sessionUserId: string,
): Promise<{ userId: string; preview: LearnerPreviewContext | null }> {
  const preview = await readLearnerPreviewContext();
  if (!preview || preview.expired) {
    return { userId: sessionUserId, preview: null };
  }
  if (preview.staffId !== sessionUserId) {
    return { userId: sessionUserId, preview: null };
  }
  if (await isUserSuperAdmin(sessionUserId)) {
    return { userId: preview.targetUserId, preview };
  }
  if (await canOrgManageSalariePreview(sessionUserId, preview.targetUserId)) {
    return { userId: preview.targetUserId, preview };
  }
  return { userId: sessionUserId, preview: null };
}

/** Alias explicite pour les routes /dashboard/salarie. */
export async function resolveEffectiveSalarieUserId(
  sessionUserId: string,
): Promise<{ userId: string; preview: LearnerPreviewContext | null }> {
  return resolveEffectiveApprenantUserId(sessionUserId);
}

/**
 * Identité effective (userId + email) pour les pages salarié en preview.
 * Évite de lister les enrollments du staff RH à la place du collaborateur.
 */
export async function resolveEffectiveSalarieActor(
  sessionUserId: string,
  sessionEmail: string | null | undefined,
): Promise<{
  userId: string;
  email: string | null;
  preview: LearnerPreviewContext | null;
}> {
  const { userId, preview } = await resolveEffectiveSalarieUserId(sessionUserId);
  let email = sessionEmail ?? null;
  if (preview && userId !== sessionUserId) {
    const { getServiceRoleClient } = await import("@/lib/supabase/server");
    const db = getServiceRoleClient();
    if (db) {
      const { data: target } = await db
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .maybeSingle();
      if (target?.email) email = String(target.email);
    }
  }
  return { userId, email, preview };
}

export async function buildLearnerPreviewCookie(params: {
  staffId: string;
  targetUserId: string;
  targetName: string;
}) {
  const secret = impersonationSecret();
  if (!secret) return null;
  const now = Date.now();
  const exp = now + PREVIEW_MS;
  const token = await signLearnerPreviewToken(
    {
      sid: crypto.randomUUID(),
      staffId: params.staffId,
      targetUserId: params.targetUserId,
      targetName: params.targetName,
      exp,
    },
    secret,
  );
  return {
    token,
    options: impersonationCookieOptions(Math.max(60, Math.round(PREVIEW_MS / 1000))),
  };
}

export { LEARNER_PREVIEW_COOKIE };
