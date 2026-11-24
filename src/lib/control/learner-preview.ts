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

/**
 * Si le staff Byound a ouvert une preview BtoC, renvoie l’id du client.
 * Sinon renvoie l’id de session courant.
 *
 * Utilise isUserSuperAdmin(sessionUserId) (pas isSuperAdmin()) pour éviter
 * un second tour auth / « use server » qui peut faire retomber sur le staff.
 */
export async function resolveEffectiveApprenantUserId(
  sessionUserId: string,
): Promise<{ userId: string; preview: LearnerPreviewContext | null }> {
  const preview = await readLearnerPreviewContext();
  if (!preview || preview.expired) {
    return { userId: sessionUserId, preview: null };
  }
  // staffId doit matcher la session ; super-admin requis pour activer la preview.
  if (preview.staffId !== sessionUserId) {
    return { userId: sessionUserId, preview: null };
  }
  if (!(await isUserSuperAdmin(sessionUserId))) {
    return { userId: sessionUserId, preview: null };
  }
  return { userId: preview.targetUserId, preview };
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
