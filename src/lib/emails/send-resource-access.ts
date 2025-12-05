/**
 * Fonction pour envoyer un email de notification d'accès à une ressource
 */

import { sendEmail } from "./brevo";
import { getResourceAccessEmail } from "./templates/resource-access";

export async function sendResourceAccessEmail(
  email: string,
  firstName: string | null,
  resourceTitle: string,
  resourceUrl: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log("[send-resource-access] Sending email:", {
    email,
    firstName,
    resourceTitle,
    resourceUrl,
  });

  try {
    const template = getResourceAccessEmail({
      firstName: firstName || undefined,
      email,
      resourceTitle,
      resourceUrl,
    });

    console.log("[send-resource-access] Template generated:", {
      subject: template.subject,
      htmlLength: template.html.length,
      textLength: template.text.length,
    });

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
      tags: ["resource-access", "manual-grant"],
    });

    console.log("[send-resource-access] Email send result:", result);
    return result;
  } catch (error) {
    console.error("[send-resource-access] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

