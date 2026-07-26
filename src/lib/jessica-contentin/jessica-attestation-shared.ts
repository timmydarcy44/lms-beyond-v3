export type JessicaAttestationCivility = "Madame" | "Monsieur";

export type JessicaAttestationInput = {
  civility: JessicaAttestationCivility;
  fullName: string;
  /** Date de la consultation (YYYY-MM-DD) */
  consultationDate: string;
  /** Heure HH:mm */
  consultationTime: string;
  /** Ex. « sa fille Louise » — optionnel */
  concerning?: string | null;
  /** Date d’établissement du document (YYYY-MM-DD), défaut = aujourd’hui */
  issuedDate?: string | null;
  /** Corps libre (remplace le paragraphe généré si fourni) */
  bodyOverride?: string | null;
};

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

export function formatFrenchLongDate(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (!d) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatFrenchWeekday(isoDate: string): string {
  const d = parseLocalDate(isoDate);
  if (!d) return "";
  return WEEKDAYS[d.getDay()];
}

function parseLocalDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function guessCivility(firstName?: string | null, fullName?: string | null): JessicaAttestationCivility {
  const raw = (firstName || fullName || "").trim().toLowerCase();
  const first = raw.split(/\s+/)[0] ?? "";
  const masculine = ["jean", "pierre", "paul", "louis", "lucas", "hugo", "thomas", "nicolas", "alexandre", "antoine", "maxime", "julien"];
  if (masculine.includes(first)) return "Monsieur";
  return "Madame";
}

/** Génère le corps principal de l’attestation (sans en-tête / signature). */
export function buildJessicaAttestationBody(input: JessicaAttestationInput): string {
  if (input.bodyOverride?.trim()) return input.bodyOverride.trim();

  const civility = input.civility;
  const name = input.fullName.trim();
  const weekday = formatFrenchWeekday(input.consultationDate);
  const longDate = formatFrenchLongDate(input.consultationDate);
  const time = formatFrenchTime(input.consultationTime);
  const presented = civility === "Madame" ? "présentée" : "présenté";
  const interested = civility === "Madame" ? "intéressée" : "intéressé";

  const concerning = input.concerning?.trim();
  const concerningClause = concerning
    ? `, dans le cadre d'une consultation concernant ${concerning}`
    : ", dans le cadre d'une consultation";

  return [
    `Je soussignée, Jessica CONTENTIN, professeure en santé et psychopédagogue certifiée en neuroéducation, atteste que :`,
    ``,
    `${civility} ${name} s'est ${presented} à mon cabinet le ${weekday} ${longDate} à ${time}${concerningClause}.`,
    ``,
    `La présente attestation est établie à la demande de l'${interested} pour servir et valoir ce que de droit.`,
  ].join("\n");
}

export function formatFrenchTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm.trim();
  return `${Number(m[1])}h${m[2]}`;
}

export function buildJessicaAttestationEmailHtml(params: {
  recipientFirstName?: string | null;
  bodyText?: string | null;
}): string {
  const greeting = params.recipientFirstName?.trim()
    ? `Bonjour ${params.recipientFirstName.trim()},`
    : "Bonjour,";
  const note =
    params.bodyText?.trim() ||
    "Veuillez trouver en pièce jointe votre attestation de présence à une consultation.";

  const paragraphs = note
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map(
      (b) =>
        `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(b).replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");

  return `
    <div style="font-family:Georgia,serif;color:#2F2A25;max-width:560px;margin:0 auto;">
      <p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(greeting)}</p>
      ${paragraphs}
      <p style="margin:32px 0 0;font-size:13px;color:#8B6F47;">Jessica CONTENTIN — Psychopédagogue</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
