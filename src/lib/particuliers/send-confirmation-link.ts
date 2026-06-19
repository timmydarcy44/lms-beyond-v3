import type { NextRequest } from "next/server";
import { getParticulierSignupConfirmationEmail } from "@/lib/emails/templates/particulier-signup-confirmation";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { particulierSetPasswordUrl, resolveParticulierAppOrigin } from "@/lib/particuliers/signup-redirect";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SendParticulierConfirmationResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

function isParticulierAccount(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) return false;
  const roleType = String(metadata.role_type ?? "").trim().toLowerCase();
  const signupSource = String(metadata.signup_source ?? "").trim().toLowerCase();
  return roleType === "particulier" || signupSource === "edge_particuliers";
}

export async function sendParticulierConfirmationLink(
  supabase: SupabaseClient,
  request: NextRequest,
  email: string,
): Promise<SendParticulierConfirmationResult> {
  const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("[particuliers/send-confirmation-link] listUsers error:", listError);
    return { ok: false, error: "Service indisponible.", status: 500 };
  }

  const user = usersList?.users?.find((u) => u.email?.toLowerCase() === email);
  if (!user) {
    return {
      ok: false,
      error: "Aucun compte trouvé avec cet email. Inscrivez-vous pour créer votre espace.",
      status: 404,
    };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (!isParticulierAccount(meta)) {
    return {
      ok: false,
      error: "Cet email est associé à un autre type de compte. Utilisez la page de connexion adaptée.",
      status: 403,
    };
  }

  const needsPasswordSetup = meta.needs_password_setup === true;
  const emailUnconfirmed = !user.email_confirmed_at;

  if (!needsPasswordSetup && !emailUnconfirmed) {
    return {
      ok: false,
      error: "Votre compte est déjà activé. Connectez-vous avec votre mot de passe.",
      status: 409,
    };
  }

  const origin = resolveParticulierAppOrigin(request);
  const redirectTo = particulierSetPasswordUrl(origin);

  const linkType = emailUnconfirmed ? "signup" : "magiclink";
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[particuliers/send-confirmation-link] generateLink error:", linkError);
    return { ok: false, error: "Impossible de générer un nouveau lien. Réessayez plus tard.", status: 500 };
  }

  const firstName = String(meta.first_name ?? "").trim();
  const template = getParticulierSignupConfirmationEmail({
    firstName,
    confirmationLink: linkData.properties.action_link,
  });

  const emailResult = await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
  });

  if (!emailResult.success) {
    console.error("[particuliers/send-confirmation-link] resend error:", emailResult.error);
    return { ok: false, error: "Le lien a été généré mais l'email n'a pas pu être envoyé.", status: 500 };
  }

  return { ok: true };
}
