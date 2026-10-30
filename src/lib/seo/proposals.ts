export type SeoProposalField = "title" | "meta_description" | "ai_summary" | "faq";

export type SeoProposalRecord = {
  id: string;
  path: string;
  batch_id: string | null;
  field: SeoProposalField;
  old_value: unknown;
  new_value: unknown;
  status: "pending" | "accepted" | "ignored";
};

export const PROPOSAL_FIELD_LABEL: Record<SeoProposalField, string> = {
  title: "Titre",
  meta_description: "Meta description",
  ai_summary: "Résumé IA",
  faq: "FAQ",
};
