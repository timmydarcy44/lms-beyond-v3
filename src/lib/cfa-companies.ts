export const CFA_COMPANY_STATUSES = [
  "creating_offer",
  "to_contact",
  "email_sent",
  "appointment",
  "pending_decision",
  "recruiting",
  "recruited",
  "not_recruited",
] as const;

export type CfaCompanyStatus = (typeof CFA_COMPANY_STATUSES)[number];

/** Libellés legacy (formulaires / journal). L’UI board utilise CFA_HOST_STAGES. */
export const CFA_COMPANY_STATUS_LABELS: Record<CfaCompanyStatus, string> = {
  creating_offer: "Création de l'offre",
  to_contact: "À contacter",
  email_sent: "Mail envoyé",
  appointment: "Rendez-vous",
  pending_decision: "En attente de décision",
  recruiting: "Recrutement en cours",
  recruited: "Recrutement réussi",
  not_recruited: "Non recrutement",
};

export function isCfaCompanyStatus(value: string): value is CfaCompanyStatus {
  return (CFA_COMPANY_STATUSES as readonly string[]).includes(value);
}
