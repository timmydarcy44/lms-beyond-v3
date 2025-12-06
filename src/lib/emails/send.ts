/**
 * Fonctions pour envoyer des emails spécifiques
 */

import { sendEmail } from "./brevo";
import { getSignupConfirmationEmail, getPurchaseConfirmationEmail, getWelcomeEmail, getPasswordResetEmail, EmailTemplateData } from "./templates";

/**
 * Envoie un email de confirmation d'inscription
 */
export async function sendSignupConfirmationEmail(
  email: string,
  firstName: string | null,
  confirmationLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getSignupConfirmationEmail({
    firstName: firstName || undefined,
    email,
    confirmationLink,
    loginLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr"}/jessica-contentin/ressources`,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
    tags: ["signup", "confirmation"],
  });
}

/**
 * Envoie un email de bienvenue (après confirmation d'email)
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string | null
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getWelcomeEmail({
    firstName: firstName || undefined,
    email,
    loginLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr"}/jessica-contentin/ressources`,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
    tags: ["welcome"],
  });
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string | null,
  resetLink: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getPasswordResetEmail({
    firstName: firstName || undefined,
    email,
    confirmationLink: resetLink,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
    tags: ["password-reset"],
  });
}

/**
 * Envoie un email de confirmation d'achat
 */
export async function sendPurchaseConfirmationEmail(
  email: string,
  firstName: string | null,
  resourceTitle: string,
  resourcePrice: number,
  purchaseDate?: string,
  resourceLink?: string // Lien direct vers la ressource achetée
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
  const template = getPurchaseConfirmationEmail({
    firstName: firstName || undefined,
    email,
    resourceTitle,
    resourcePrice,
    purchaseDate: purchaseDate || new Date().toLocaleDateString("fr-FR"),
    loginLink: `${baseUrl}/jessica-contentin/ressources`,
    resourceLink: resourceLink || `${baseUrl}/jessica-contentin/ressources`,
  });

  return sendEmail({
    to: email,
    subject: template.subject,
    htmlContent: template.html,
    textContent: template.text,
    tags: ["purchase", "confirmation"],
  });
}

