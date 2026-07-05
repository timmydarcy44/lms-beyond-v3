import { getParticulierWelcomeEmail } from "@/lib/emails/templates/particulier-edge-emails";

/** @deprecated Utiliser getParticulierWelcomeEmail */
export function getParticulierSignupConfirmationEmail(params: {
  firstName: string;
  confirmationLink: string;
}) {
  return getParticulierWelcomeEmail(params);
}
