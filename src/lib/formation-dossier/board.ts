import {
  FORMATION_DOSSIER_STATUSES,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";

export type FormationDossierBoardCard = {
  id: string;
  organization_id: string;
  organization_name: string;
  course_title: string | null;
  status: FormationDossierStatus;
  amount_ht_cents: number | null;
  owner_user_id: string | null;
  owner_label: string | null;
  owner_initials: string | null;
  next_slot_date: string | null;
  deal_regressed: boolean;
  bpf_incomplete: boolean;
  overdue: boolean;
  pending_confirm_count: number;
  source: string;
  updated_at: string;
};

/** Enrichissement pour la fiche compte client (onglet Formations). */
export type AccountDossierCard = FormationDossierBoardCard & {
  training_course_id: string | null;
  cover_url: string | null;
  duration_hours: number | null;
  modality_presence: string | null;
  location_label: string | null;
  participants_count: number | null;
  contact_email: string | null;
  contact_name: string | null;
  last_slot_date: string | null;
  devis_sent_at: string | null;
  devis_signed_at: string | null;
  convention_sent_at: string | null;
  convention_signed_at: string | null;
  attendance_complete: boolean | null;
};

const OVERDUE_MS = 3 * 24 * 60 * 60 * 1000;

export function isBpfIncomplete(row: {
  bpf_funder_type?: string | null;
  subcontracting?: string | null;
  partner_of_name?: string | null;
  status?: string | null;
}): boolean {
  const statusIdx = FORMATION_DOSSIER_STATUSES.indexOf(
    String(row.status ?? "") as FormationDossierStatus,
  );
  // Pastille dès Convention (index 2) et au-delà, ou toujours si champs vides en amont
  const relevant = statusIdx >= 2 || statusIdx < 0;
  if (!relevant && statusIdx >= 0) return false;
  if (!row.bpf_funder_type) return true;
  if (!row.subcontracting) return true;
  if (
    (row.subcontracting === "recue" || row.subcontracting === "confiee") &&
    !String(row.partner_of_name ?? "").trim()
  ) {
    return true;
  }
  if (row.subcontracting === "recue" && row.bpf_funder_type !== "autres_of") return true;
  return false;
}

export function isDossierOverdue(row: {
  status: string;
  updated_at?: string | null;
  pending_confirm_fields?: unknown;
}): boolean {
  const pending = Array.isArray(row.pending_confirm_fields)
    ? row.pending_confirm_fields.length
    : 0;
  if (pending > 0) return true;
  if (!["qualification", "devis", "convention"].includes(row.status)) return false;
  const updated = row.updated_at ? Date.parse(row.updated_at) : NaN;
  if (!Number.isFinite(updated)) return false;
  return Date.now() - updated > OVERDUE_MS;
}

export function ownerInitials(label: string | null | undefined): string | null {
  const parts = String(label ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
