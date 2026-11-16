export const RECLAMATION_SOURCES = [
  "espace_entreprise",
  "espace_apprenant",
  "espace_formateur",
  "email",
  "telephone",
  "saisie_interne",
] as const;

export type ReclamationSource = (typeof RECLAMATION_SOURCES)[number];

export const RECLAMATION_SOURCE_LABELS: Record<ReclamationSource, string> = {
  espace_entreprise: "l'espace entreprise",
  espace_apprenant: "l'espace apprenant",
  espace_formateur: "l'espace formateur",
  email: "e-mail",
  telephone: "téléphone",
  saisie_interne: "saisie interne",
};

export function parseReclamationSource(v: unknown): ReclamationSource | null {
  const s = String(v ?? "").trim();
  return (RECLAMATION_SOURCES as readonly string[]).includes(s) ? (s as ReclamationSource) : null;
}

/** Dérive une source lisible depuis channel / audience legacy. */
export function deriveReclamationSource(input: {
  source?: string | null;
  channel?: string | null;
  audience?: string | null;
}): ReclamationSource {
  const parsed = parseReclamationSource(input.source);
  if (parsed) return parsed;
  if (input.audience === "entreprise" || input.channel === "dashboard") return "espace_entreprise";
  if (input.audience === "apprenant") return "espace_apprenant";
  if (input.audience === "expert") return "espace_formateur";
  if (input.channel === "email") return "email";
  return "saisie_interne";
}
