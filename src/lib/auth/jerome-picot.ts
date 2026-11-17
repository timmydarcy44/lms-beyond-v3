/** Compte commercial Jérôme Picot — e-mail canonique Byound (ex EDGE BS). */

export const JEROME_PICOT_EMAIL = "jerome.picot@byound.fr";

/** Ancienne adresse conservée en lecture seule pour la transition. */
export const JEROME_PICOT_LEGACY_EMAILS = ["jerome.picot@edgebs.fr"] as const;

const JEROME_EMAILS = new Set<string>([JEROME_PICOT_EMAIL, ...JEROME_PICOT_LEGACY_EMAILS]);

export function isJeromePicotEmail(email: string | null | undefined): boolean {
  const norm = email?.trim().toLowerCase() ?? "";
  return Boolean(norm) && JEROME_EMAILS.has(norm);
}
