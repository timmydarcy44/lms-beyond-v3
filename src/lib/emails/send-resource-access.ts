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
  const template = getResourceAccessEmail({
    firstName: firstName || undefined,
    email,
    resourceTitle,
    resourceUrl,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
    tags: ["resource-access", "manual-grant"],
  });
}

