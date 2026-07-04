/**
 * Client Resend pour l'envoi d'emails
 * Configuration et fonctions utilitaires pour envoyer des emails
 */

import { resolveResendFromEmail } from "@/lib/email/resend-from";

let Resend: any = null;
let resendInstance: any = null;

export async function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email/resend] RESEND_API_KEY non configuré");
    return null;
  }

  if (!Resend) {
    try {
      Resend = (await import("resend")).Resend;
    } catch (error) {
      console.error("[email/resend] Package resend non installé:", error);
      return null;
    }
  }

  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }

  return resendInstance;
}

export const EDGE_BCC_ADDRESS = "contact@edgebs.fr";

export function resolveAdminBccEmail(): string | null {
  const admin = process.env.ADMIN_BCC_EMAIL?.trim();
  return admin || "timmydarcy44@gmail.com";
}

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  bcc?: string | string[];
  skipBcc?: boolean;
};

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = await getResendClient();
  
  if (!resend) {
    return {
      success: false,
      error: "Service d'email non configuré (RESEND_API_KEY manquant)",
    };
  }

  try {
    const fromEmail = resolveResendFromEmail(options.from);
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const adminBcc = resolveAdminBccEmail();
    const bccList = options.skipBcc
      ? options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc
          : [options.bcc]
        : undefined
      : [
          EDGE_BCC_ADDRESS,
          ...(adminBcc ? [adminBcc] : []),
          ...(options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : []),
        ];

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      bcc: bccList?.length ? bccList : undefined,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo,
    });

    if (result.error) {
      console.error("[email/resend] Error sending email:", result.error);
      return {
        success: false,
        error: result.error.message || "Erreur lors de l'envoi de l'email",
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("[email/resend] Unexpected error:", error);
    return {
      success: false,
      error: error.message || "Erreur inattendue lors de l'envoi de l'email",
    };
  }
}








