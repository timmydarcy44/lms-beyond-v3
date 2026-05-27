/**
 * Adresse d’expédition Resend.
 * - Production : RESEND_FROM_EMAIL (domaine vérifié sur resend.com/domains)
 * - Dev / test : onboarding@resend.dev (pas de vérification domaine)
 */
export function resolveResendFromEmail(override?: string): string {
  if (override?.trim()) return override.trim();
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;
  if (process.env.RESEND_USE_SANDBOX === "1" || process.env.NODE_ENV !== "production") {
    return "Beyond LMS <onboarding@resend.dev>";
  }
  return "Beyond LMS <onboarding@resend.dev>";
}

export function resendDomainHint(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  if (!from && process.env.NODE_ENV === "production") {
    return "Configurez RESEND_FROM_EMAIL avec un domaine vérifié, ou RESEND_USE_SANDBOX=1 pour utiliser onboarding@resend.dev.";
  }
  if (from.includes("beyond-lms.com") && process.env.RESEND_USE_SANDBOX !== "1") {
    return "Le domaine beyond-lms.com doit être vérifié sur https://resend.com/domains, ou définissez RESEND_USE_SANDBOX=1 et retirez RESEND_FROM_EMAIL pour les tests.";
  }
  return null;
}
