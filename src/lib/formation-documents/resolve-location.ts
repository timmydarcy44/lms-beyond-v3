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

function isByoundPremises(lower: string): boolean {
  // « vos locaux (Byound) » côté demande, ou siège déjà normalisé.
  return (
    lower.includes("byound") ||
    (lower.includes("nos locaux") && lower.includes("bretteville"))
  );
}

function isClientPremises(lower: string): boolean {
  if (isByoundPremises(lower)) return false;
  return (
    lower.includes("chez le client") ||
    lower.includes("locaux du client") ||
    lower.includes("au sein de nos locaux") || // POV demande (client)
    lower.includes("au sein de vos locaux") || // POV docs déjà normalisé
    lower === "client"
  );
}

/**
 * Normalise le lieu pour devis / convention / convocations (POV Byound → client).
 * - Locaux client → « Au sein de vos locaux — {adresse} »
 * - Locaux Byound → « Au sein de nos locaux — {siège} »
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

  if (isByoundPremises(lower)) {
    return `Au sein de nos locaux — ${formatByoundPostalAddress()}`;
  }

  if (isClientPremises(lower)) {
    const addr = params.organization ? formatPostalAddress(params.organization) : "";
    return addr ? `Au sein de vos locaux — ${addr}` : "Au sein de vos locaux";
  }

  if (lower.includes("à définir") || lower.includes("a definir") || lower === "autre") {
    return raw;
  }
  return raw;
}

export function byoundSigningCity(): string {
  return BYOUND_POSTAL_ADDRESS.address_city;
}
