/**
 * Configuration et utilitaires pour l'envoi d'emails via BREVO (ex-Sendinblue)
 */

import { env } from "@/lib/env";

// Configuration BREVO
const BREVO_API_KEY = process.env.BREVO_API_KEY || env.brevoApiKey;
const BREVO_API_URL = "https://api.brevo.com/v3";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  from?: {
    name: string;
    email: string;
  };
  replyTo?: {
    name: string;
    email: string;
  };
  tags?: string[];
}

export interface TransactionalEmailOptions extends EmailOptions {
  templateId?: number;
  params?: Record<string, any>;
}

/**
 * Envoie un email transactionnel via BREVO
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    console.error("[BREVO] API key not configured");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: options.from || {
          name: "Jessica CONTENTIN",
          email: "contentin.cabinet@gmail.com", // Email vérifié du compte BREVO
        },
        to: recipients.map(email => ({ email })),
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent || stripHtml(options.htmlContent),
        replyTo: options.replyTo || {
          name: "Jessica CONTENTIN",
          email: "contentin.cabinet@gmail.com",
        },
        tags: options.tags || [],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("[BREVO] Error sending email:", errorData);
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[BREVO] Exception sending email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Envoie un email transactionnel avec template BREVO
 */
export async function sendTransactionalEmail(
  options: TransactionalEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!BREVO_API_KEY) {
    console.error("[BREVO] API key not configured");
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const payload: any = {
      to: recipients.map(email => ({ email })),
      sender: options.from || {
        name: "Jessica CONTENTIN",
        email: "contentin.cabinet@gmail.com", // Email vérifié du compte BREVO
      },
      replyTo: options.replyTo || {
        name: "Jessica CONTENTIN",
        email: "contentin.cabinet@gmail.com",
      },
      tags: options.tags || [],
    };

    if (options.templateId) {
      payload.templateId = options.templateId;
      if (options.params) {
        payload.params = options.params;
      }
    } else {
      payload.subject = options.subject;
      payload.htmlContent = options.htmlContent;
      payload.textContent = options.textContent || stripHtml(options.htmlContent);
    }

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("[BREVO] Error sending transactional email:", errorData);
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[BREVO] Exception sending transactional email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Supprime les balises HTML d'un texte
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

