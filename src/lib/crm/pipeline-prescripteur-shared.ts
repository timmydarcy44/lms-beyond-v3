export type PipelinePrescripteur = {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  next_action: string;
  notes: string | null;
  contact_owner_email: string | null;
  created_at: string;
  updated_at: string;
};

export type PrescripteurForm = {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  next_action: string;
  notes: string;
  contact_owner_email: string;
};

export const emptyPrescripteurForm = (ownerEmail: string): PrescripteurForm => ({
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  next_action: "",
  notes: "",
  contact_owner_email: ownerEmail,
});
