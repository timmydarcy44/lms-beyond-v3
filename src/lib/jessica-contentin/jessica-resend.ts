/**
 * Resend dédié au cabinet Jessica Contentin (factures, emails patients).
 * Variables Vercel :
 * - JESSICA_RESEND_API_KEY (obligatoire)
 * - JESSICA_RESEND_FROM_EMAIL ex. Jessica CONTENTIN <factures@jessicacontentin.fr>
 * - JESSICA_RESEND_USE_SANDBOX=1 pour tester avec onboarding@resend.dev
 */

import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

let ResendCtor: typeof import("resend").Resend | null = null;
let jessicaResendInstance: InstanceType<typeof import("resend").Resend> | null = null;

export type JessicaEmailAttachment = {
  filename: string;
  content: Buffer;
};

export type JessicaEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: JessicaEmailAttachment[];
};

export function resolveJessicaResendFromEmail(): string {
  const configured = process.env.JESSICA_RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return configured.includes("<") ? configured : `Jessica CONTENTIN <${configured}>`;
  }
  if (process.env.JESSICA_RESEND_USE_SANDBOX === "1") {
    return "Jessica CONTENTIN <onboarding@resend.dev>";
  }
  if (process.env.NODE_ENV !== "production") {
    return "Jessica CONTENTIN <onboarding@resend.dev>";
  }
  return "Jessica CONTENTIN <onboarding@resend.dev>";
}

export function jessicaResendConfigHint(): string | null {
  if (!process.env.JESSICA_RESEND_API_KEY?.trim()) {
    return "Ajoutez JESSICA_RESEND_API_KEY sur Vercel (compte Resend Jessica).";
  }
  if (
    process.env.NODE_ENV === "production" &&
    process.env.JESSICA_RESEND_USE_SANDBOX !== "1" &&
    !process.env.JESSICA_RESEND_FROM_EMAIL?.trim()
  ) {
    return "Ajoutez JESSICA_RESEND_FROM_EMAIL avec un domaine vérifié sur resend.com (ex. factures@jessicacontentin.fr).";
  }
  return null;
}

async function getJessicaResendClient() {
  const apiKey = process.env.JESSICA_RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[jessica/resend] JESSICA_RESEND_API_KEY non configuré");
    return null;
  }

  if (!ResendCtor) {
    try {
      ResendCtor = (await import("resend")).Resend;
    } catch (error) {
      console.error("[jessica/resend] Package resend non installé:", error);
      return null;
    }
  }

  if (!jessicaResendInstance) {
    jessicaResendInstance = new ResendCtor(apiKey);
  }

  return jessicaResendInstance;
}

export async function sendJessicaResendEmail(
  options: JessicaEmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = await getJessicaResendClient();
  if (!resend) {
    return {
      success: false,
      error: "Service email Jessica non configuré (JESSICA_RESEND_API_KEY manquant)",
    };
  }

  const configHint = jessicaResendConfigHint();
  if (configHint && process.env.NODE_ENV === "production") {
    return { success: false, error: configHint };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const result = await resend.emails.send({
      from: resolveJessicaResendFromEmail(),
      to: recipients,
      replyTo: options.replyTo ?? JESSICA_CONTENTIN_EMAIL,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (result.error) {
      console.error("[jessica/resend] Error:", result.error);
      return {
        success: false,
        error: result.error.message || "Erreur lors de l'envoi de l'email",
      };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur inattendue";
    console.error("[jessica/resend] Unexpected error:", error);
    return { success: false, error: message };
  }
}
