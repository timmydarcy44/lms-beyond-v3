/**
 * Client Resend pour l'envoi d'emails
 * Configuration et fonctions utilitaires pour envoyer des emails
 */

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

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
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
    const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || "noreply@beyond-lms.com";
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    const result = await resend.emails.send({
      from: fromEmail,
      to: recipients,
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








