/**
 * Adresse d’expédition Resend.
 * - Production : RESEND_FROM_EMAIL (domaine vérifié sur resend.com/domains)
 * - Dev / test : onboarding@resend.dev (pas de vérification domaine)
 */
const EDGE_BS_FROM = "Byound <noreply@byound.fr>";

export function resolveResendFromEmail(override?: string): string {
  if (override?.trim() && !/@edgebs\.fr/i.test(override)) {
    const o = override.trim();
    return o.includes("<") ? o : `Timmy Darcy <${o}>`;
  }
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured && !/@edgebs\.fr/i.test(configured)) return configured;
  if (process.env.RESEND_USE_SANDBOX === "1") {
    return "Beyond LMS <onboarding@resend.dev>";
  }
  if (process.env.NODE_ENV !== "production") {
    return "Beyond LMS <onboarding@resend.dev>";
  }
  return EDGE_BS_FROM;
}

export function resendDomainHint(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  if (!from && process.env.NODE_ENV === "production" && process.env.RESEND_USE_SANDBOX !== "1") {
    return "Par défaut : noreply@byound.fr. Vous pouvez définir RESEND_FROM_EMAIL sur Vercel.";
  }
  if (from.includes("beyond-lms.com") && process.env.RESEND_USE_SANDBOX !== "1") {
    return "Le domaine beyond-lms.com doit être vérifié sur https://resend.com/domains, ou utilisez byound.fr / RESEND_USE_SANDBOX=1.";
  }
  if (from.includes("edgebs.fr") && process.env.RESEND_USE_SANDBOX !== "1") {
    return "RESEND_FROM_EMAIL pointe encore vers edgebs.fr. Passez-le sur noreply@byound.fr.";
  }
  return null;
}
