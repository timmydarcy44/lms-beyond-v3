/** Types de contrat qui permettent de signer en alternance (apprentissage / pro). */
const ALTERNANCE_RE = /apprend|professionnal|altern/i;

export function isAlternanceContractType(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  return ALTERNANCE_RE.test(raw);
}

export function wantedLabel(n: number) {
  return n <= 1 ? `${n} alternant recherché` : `${n} alternants recherchés`;
}

export function placedLabel(placed: number, wanted: number) {
  const unit = wanted <= 1 && placed <= 1 ? "alternant placé" : "alternants placés";
  return { ratio: `${placed} / ${wanted}`, unit };
}
