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
  console.log("[BREVO] sendEmail called");
  console.log("[BREVO] BREVO_API_KEY exists:", !!BREVO_API_KEY);
  console.log("[BREVO] BREVO_API_KEY length:", BREVO_API_KEY?.length || 0);
  console.log("[BREVO] To:", options.to);
  console.log("[BREVO] Subject:", options.subject);
  
  if (!BREVO_API_KEY) {
    console.error("[BREVO] API key not configured");
    console.error("[BREVO] process.env.BREVO_API_KEY:", !!process.env.BREVO_API_KEY);
    console.error("[BREVO] env.brevoApiKey:", !!env.brevoApiKey);
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const payload = {
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
    };
    
    console.log("[BREVO] Sending email to BREVO API:", {
      url: `${BREVO_API_URL}/smtp/email`,
      to: payload.to,
      subject: payload.subject,
      sender: payload.sender,
    });
    
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("[BREVO] Response status:", response.status);
    console.log("[BREVO] Response ok:", response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
      console.error("[BREVO] Error sending email:", JSON.stringify(errorData, null, 2));
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    const data = await response.json();
    console.log("[BREVO] Email sent successfully:", data);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[BREVO] Exception sending email:", error);
    if (error instanceof Error) {
      console.error("[BREVO] Error message:", error.message);
      console.error("[BREVO] Error stack:", error.stack);
    }
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

