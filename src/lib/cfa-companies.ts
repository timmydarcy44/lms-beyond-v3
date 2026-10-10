export const CFA_COMPANY_STATUSES = [
  "to_contact",
  "email_sent",
  "appointment",
  "pending_decision",
  "recruiting",
  "recruited",
  "not_recruited",
] as const;

export type CfaCompanyStatus = (typeof CFA_COMPANY_STATUSES)[number];

export const CFA_COMPANY_STATUS_LABELS: Record<CfaCompanyStatus, string> = {
  to_contact: "À contacter",
  email_sent: "Mail envoyé",
  appointment: "Rendez-vous programmé",
  pending_decision: "En attente de décision",
  recruiting: "Recrutement en cours",
  recruited: "Recrutement réussi",
  not_recruited: "Non recrutement",
};

export function isCfaCompanyStatus(value: string): value is CfaCompanyStatus {
  return (CFA_COMPANY_STATUSES as readonly string[]).includes(value);
}
