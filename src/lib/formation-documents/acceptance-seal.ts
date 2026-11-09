import { createHash, createHmac } from "crypto";

export type AcceptanceSealInput = {
  documentId: string;
  dossierId: string;
  kind: "devis" | "convention" | string;
  signedAt: string;
  signerName: string;
  pdfContentHash?: string | null;
  /** Secret optionnel — sinon hash déterministe public (toujours vérifiable hors secret). */
  secret?: string | null;
};

export type AcceptanceSeal = {
  /** Numéro de suivi lisible, ex. BYS-7K3M-9P2Q-4X8R */
  trackingId: string;
  /** Empreinte courte du sceau (12 hex) */
  sealShort: string;
  /** Hash SHA-256 complet du payload de signature */
  sealHash: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I

function toGroups(raw: string, size = 4, groups = 4): string {
  const cleaned = raw.replace(/[^A-Z0-9]/g, "").toUpperCase();
  const parts: string[] = [];
  for (let i = 0; i < groups; i += 1) {
    parts.push(cleaned.slice(i * size, i * size + size).padEnd(size, "X"));
  }
  return parts.join("-");
}

function bytesToAlphabet(buf: Buffer, length: number): string {
  let out = "";
  for (let i = 0; i < buf.length && out.length < length; i += 1) {
    out += ALPHABET[buf[i]! % ALPHABET.length];
  }
  return out.slice(0, length);
}

/**
 * Sceau / numéro de suivi cryptographique pour une acceptation devis|convention.
 * Déterministe pour un même document + date + signataire (+ hash PDF).
 */
export function buildAcceptanceSeal(input: AcceptanceSealInput): AcceptanceSeal {
  const kindTag = String(input.kind || "doc").slice(0, 3).toUpperCase();
  const payload = [
    input.documentId,
    input.dossierId,
    input.kind,
    input.signedAt,
    input.signerName.trim().toLowerCase(),
    input.pdfContentHash || "",
  ].join("|");

  const secret =
    input.secret ||
    process.env.FORMATION_ACCEPTANCE_SEAL_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "byound-formation-seal";

  const sealHash = createHmac("sha256", secret).update(payload).digest("hex");
  const publicHash = createHash("sha256").update(payload).digest("hex");
  const material = Buffer.from(sealHash, "hex");
  const body = bytesToAlphabet(material, 16);
  const trackingId = `BYS-${kindTag}-${toGroups(body, 4, 3)}`;

  return {
    trackingId,
    sealShort: publicHash.slice(0, 12).toUpperCase(),
    sealHash,
  };
}

/** Reprend un sceau déjà stocké dans meta, ou en calcule un nouveau. */
export function resolveAcceptanceSeal(
  meta: Record<string, unknown> | null | undefined,
  input: AcceptanceSealInput,
): AcceptanceSeal {
  const existingId = meta?.acceptance_tracking_id
    ? String(meta.acceptance_tracking_id)
    : "";
  const existingShort = meta?.acceptance_seal_short
    ? String(meta.acceptance_seal_short)
    : "";
  const existingHash = meta?.acceptance_seal_hash
    ? String(meta.acceptance_seal_hash)
    : "";
  if (existingId && existingShort && existingHash) {
    return {
      trackingId: existingId,
      sealShort: existingShort,
      sealHash: existingHash,
    };
  }
  return buildAcceptanceSeal(input);
}
