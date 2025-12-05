/**
 * Configuration et utilitaires pour l'envoi d'emails via BREVO (ex-Sendinblue)
 */

import { env } from "@/lib/env";

// Configuration BREVO
const BREVO_API_KEY = process.env.BREVO_API_KEY || env.brevoApiKey;
const BREVO_API_URL = "https://api.brevo.com/v3";

// Log de configuration au chargement du module (côté serveur uniquement)
if (typeof window === 'undefined') {
  console.log("[BREVO] Module loaded - BREVO_API_KEY exists:", !!BREVO_API_KEY);
  console.log("[BREVO] Module loaded - BREVO_API_KEY from process.env:", !!process.env.BREVO_API_KEY);
  console.log("[BREVO] Module loaded - BREVO_API_KEY from env:", !!env.brevoApiKey);
  if (BREVO_API_KEY) {
    console.log("[BREVO] Module loaded - BREVO_API_KEY length:", BREVO_API_KEY.length);
    console.log("[BREVO] Module loaded - BREVO_API_KEY starts with:", BREVO_API_KEY.substring(0, 10));
  }
}

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
    
    // Déterminer le nom de l'expéditeur selon les tags (Beyond Connect vs Jessica Contentin)
    const isBeyondConnect = options.tags?.some(tag => tag.includes("beyond-connect"));
    const defaultSenderName = isBeyondConnect ? "Beyond Connect" : "Jessica CONTENTIN";
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const payload: any = {
      sender: options.from || {
        name: defaultSenderName,
        email: "contentin.cabinet@gmail.com", // Email vérifié du compte BREVO
      },
      to: recipients.map(email => ({ email })),
      subject: options.subject,
      htmlContent: options.htmlContent,
      textContent: options.textContent || stripHtml(options.htmlContent),
      replyTo: options.replyTo || {
        name: defaultSenderName,
        email: "contentin.cabinet@gmail.com",
      },
      // Headers pour améliorer la délivrabilité
      headers: {
        "X-Mailer": "Beyond Connect Platform",
        "List-Unsubscribe": `<${baseUrl}/unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
    
    // Ne pas inclure tags s'il est vide (Brevo exige qu'il soit non vide s'il est présent)
    if (options.tags && options.tags.length > 0) {
      payload.tags = options.tags;
    }
    
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

    // Lire le body une seule fois
    const responseText = await response.text();
    console.log("[BREVO] Response text:", responseText);

    // Brevo retourne 201 (Created) pour un succès, pas 200
    // response.ok est true pour 200-299, donc 201 est considéré comme ok
    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || "Unknown error" };
      }
      console.error("[BREVO] Error sending email:", JSON.stringify(errorData, null, 2));
      return { success: false, error: errorData.message || `HTTP ${response.status}` };
    }

    // Pour les réponses 201 (succès), Brevo peut retourner un body vide ou un messageId
    let data;
    if (responseText && responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        // Si ce n'est pas du JSON, c'est probablement un messageId
        data = { messageId: responseText.trim() };
      }
    } else {
      // Pas de body, générer un messageId factice
      data = { messageId: `brevo-${Date.now()}` };
    }
    
    console.log("[BREVO] Email sent successfully:", data);
    return { success: true, messageId: data.messageId || `brevo-${Date.now()}` };
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
    
    // Déterminer le nom de l'expéditeur selon les tags (Beyond Connect vs Jessica Contentin)
    const isBeyondConnect = options.tags?.some(tag => tag.includes("beyond-connect"));
    const defaultSenderName = isBeyondConnect ? "Beyond Connect" : "Jessica CONTENTIN";
    
    const payload: any = {
      to: recipients.map(email => ({ email })),
      sender: options.from || {
        name: defaultSenderName,
        email: "contentin.cabinet@gmail.com", // Email vérifié du compte BREVO
      },
      replyTo: options.replyTo || {
        name: defaultSenderName,
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

