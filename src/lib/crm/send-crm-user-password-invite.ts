import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveDestinationFromProfileRole } from "@/lib/auth/post-login-redirect";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { getCrmUserPasswordInviteEmail } from "@/lib/emails/templates/crm-user-password-invite";
import { publicAppUrl } from "@/lib/env";

export const CRM_INVITE_FLOW = "crm" as const;

const ROLE_DASHBOARD_FALLBACKS: Record<string, string> = {
  tutor: "/dashboard/tuteur",
  tuteur: "/dashboard/tuteur",
  admin: "/dashboard/ecole",
  ecole: "/dashboard/ecole",
  demo: "/dashboard/apprenant",
};

export function crmUserDashboardPath(role: string): string {
  return (
    resolveDestinationFromProfileRole(role) ??
    ROLE_DASHBOARD_FALLBACKS[role.trim().toLowerCase()] ??
    "/dashboard/apprenant"
  );
}

export function buildCrmSetPasswordUrl(origin: string, role: string): string {
  const base = origin.replace(/\/$/, "");
  const next = encodeURIComponent(crmUserDashboardPath(role));
  return `${base}/auth/set-password?next=${next}&flow=${CRM_INVITE_FLOW}`;
}

async function generatePasswordSetupLink(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<string | null> {
  const types = ["signup", "invite", "magiclink", "recovery"] as const;

  for (const type of types) {
    const { data, error } = await supabase.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo },
    });
    if (!error && data?.properties?.action_link) {
      return data.properties.action_link;
    }
    console.warn("[crm/password-invite] generateLink failed:", type, error?.message);
  }
  return null;
}

export type SendCrmUserPasswordInviteResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Génère un lien Auth de création de mot de passe et l'envoie par email (Resend).
 * À appeler uniquement après `auth.admin.createUser` sans mot de passe.
 */
export async function sendCrmUserPasswordInvite(
  supabase: SupabaseClient,
  params: { email: string; firstName: string; role: string },
): Promise<SendCrmUserPasswordInviteResult> {
  const email = params.email.trim().toLowerCase();
  const origin = publicAppUrl();
  const redirectTo = buildCrmSetPasswordUrl(origin, params.role);

  const passwordSetupLink = await generatePasswordSetupLink(supabase, email, redirectTo);
  if (!passwordSetupLink) {
    return { ok: false, error: "Impossible de générer le lien de création de mot de passe." };
  }

  const template = getCrmUserPasswordInviteEmail({
    firstName: params.firstName,
    passwordSetupLink,
  });

  const emailResult = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
  });

  if (!emailResult.success) {
    return { ok: false, error: emailResult.error ?? "Échec d'envoi de l'email." };
  }

  return { ok: true };
}
