import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getParticulierAdminSignupNotificationEmail } from "@/lib/emails/templates/particulier-signup-admin-notification";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { objectiveTypeLabel } from "@/lib/particulier/professional-project-fields";
import { resolveParticulierAppOrigin } from "@/lib/particuliers/signup-redirect";

export type SendParticulierAdminNotificationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendParticulierAdminSignupNotification(
  request: NextRequest,
  params: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    objectif?: string | null;
    registeredAt?: string | null;
  },
): Promise<SendParticulierAdminNotificationResult> {
  const origin = resolveParticulierAppOrigin(request);
  const adminProfileUrl = `${origin}/pilotage/users/${params.userId}`;
  const registeredAt = params.registeredAt
    ? new Date(params.registeredAt).toLocaleString("fr-FR")
    : new Date().toLocaleString("fr-FR");

  const template = getParticulierAdminSignupNotificationEmail({
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    objectif: objectiveTypeLabel(params.objectif),
    registeredAt,
    adminProfileUrl,
  });

  const emailResult = await sendEmail({
    to: template.to,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
  });

  if (!emailResult.success) {
    console.error("[particuliers/admin-notification] resend error:", emailResult.error);
    return { ok: false, error: emailResult.error ?? "Envoi admin impossible" };
  }

  return { ok: true };
}

/** @deprecated Import depuis send-particulier-admin-notification */
export async function notifyAdminParticulierSignup(
  _supabase: SupabaseClient,
  request: NextRequest,
  params: Parameters<typeof sendParticulierAdminSignupNotification>[1],
) {
  return sendParticulierAdminSignupNotification(request, params);
}
