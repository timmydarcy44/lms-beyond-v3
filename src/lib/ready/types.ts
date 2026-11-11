import type { ReadyPaymentMode } from "@/lib/ready/constants";

export type ReadyCompanyFields = {
  siret: string;
  idcc: string;
  headcount: string;
  opco_name: string;
  member_number: string;
};

export type ReadyLearnerFields = {
  sex: string;
  date_of_birth: string;
  contract_type: string;
  csp: string;
  entry_date: string;
  diploma_level: string;
  hours: string;
  on_work_time: boolean | null;
};

export type ReadyLearnerRow = {
  id: string;
  participant_id: string | null;
  first_name: string;
  last_name: string;
  fields: ReadyLearnerFields;
};

export type ReadyFichePayload = {
  link: {
    id: string;
    status: string;
    expires_at: string;
    submitted_at: string | null;
    opened_at: string | null;
    recipient_email: string;
    recipient_name: string | null;
    payment_mode: ReadyPaymentMode | null;
    progress_ready: number;
    progress_total: number;
    days_until_expiry: number | null;
  };
  deposit_deadline: string;
  days_until_deposit: number | null;
  course: {
    title: string;
    dates_label: string;
    duration_hours: number;
    formula: string;
    modality: string;
    location: string;
    learners_count: number;
    objective: string;
    certifying: boolean;
    rncp_or_rs: string | null;
  };
  of: {
    legal_name: string;
    siret: string;
    nda: string;
    qualiopi: string;
    address: string;
    contact: string;
    iban: string | null;
    bic: string | null;
    bank_holder: string | null;
  };
  amounts: {
    ht_cents: number;
    tva_cents: number;
    ttc_cents: number;
    per_learner_ht_cents: number;
    per_hour_per_learner_cents: number;
    formula: "intra" | "inter";
  };
  organization: {
    name: string;
    opco_name: string | null;
  };
  company: ReadyCompanyFields;
  learners: ReadyLearnerRow[];
  opco_profile: {
    id: string;
    label: string;
    portal_name: string;
    portal_url: string | null;
    portal_cta_label: string;
    optional_learner_fields: string[];
  };
  attachments: Array<{
    key: string;
    label: string;
    available: boolean;
  }>;
  tutorial_url: string | null;
};
