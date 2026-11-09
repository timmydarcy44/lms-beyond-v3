import {
  BYOUND_POSTAL_ADDRESS,
  formatByoundPostalAddress,
  formatPostalAddress,
} from "@/lib/formation-documents/postal-address";

/** Extrait « Lieu: … » des notes de demande. */
export function locationFromDossierNotes(notes: string | null | undefined): string | null {
  const match = String(notes ?? "").match(/Lieu\s*:\s*(.+)$/im);
  const value = match?.[1]?.trim();
  return value || null;
}

/**
 * Normalise le lieu choisi à la demande pour devis / convention.
 * « Chez le client » → adresse postale org ; « Chez Byound » → siège OF.
 */
export function resolveTrainingLocationLabel(params: {
  sessionLocation?: string | null;
  notesLocation?: string | null;
  modalityPresence?: string | null;
  organization?: {
    address_line?: string | null;
    address_zip?: string | null;
    address_city?: string | null;
  } | null;
}): string | null {
  const raw =
    String(params.sessionLocation ?? "").trim() ||
    String(params.notesLocation ?? "").trim() ||
    "";

  if (!raw) {
    const modality = String(params.modalityPresence ?? "").toLowerCase();
    if (modality.includes("distan")) return "Distanciel / visioconférence";
    return null;
  }

  const lower = raw.toLowerCase();
  if (lower.includes("distan") || lower.includes("visio")) {
    return "Distanciel / visioconférence";
  }
  if (lower.includes("byound")) {
    return `Chez Byound — ${formatByoundPostalAddress()}`;
  }
  if (lower.includes("chez le client") || lower === "client") {
    const addr = params.organization
      ? formatPostalAddress(params.organization)
      : "";
    return addr ? `Chez le client — ${addr}` : "Chez le client";
  }
  if (lower.includes("à définir") || lower.includes("a definir") || lower === "autre") {
    return raw;
  }
  return raw;
}

export function byoundSigningCity(): string {
  return BYOUND_POSTAL_ADDRESS.address_city;
}
