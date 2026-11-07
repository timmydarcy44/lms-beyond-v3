/** Documents PDF gérés Lots 4a + 4b (hors facture = Lot 5). */
export const LOT4_DOCUMENT_KINDS = [
  "devis",
  "convention",
  "cgv",
  "reglement",
  "programme",
  "convocation",
  "livret",
  "certificat",
  "attestation",
] as const;

export type Lot4DocumentKind = (typeof LOT4_DOCUMENT_KINDS)[number];

/** @deprecated alias Lot 4a */
export const LOT4A_DOCUMENT_KINDS = [
  "devis",
  "convention",
  "cgv",
  "reglement",
  "convocation",
] as const;
export type Lot4aDocumentKind = (typeof LOT4A_DOCUMENT_KINDS)[number];

/** Pack joint automatiquement à l'envoi de la convention. */
export const CONVENTION_PACK_KINDS = ["cgv", "reglement"] as const;

export const DOC_TITLES: Record<Lot4DocumentKind, string> = {
  devis: "Devis",
  convention: "Convention de formation",
  cgv: "CGV",
  reglement: "Règlement intérieur",
  programme: "Programme",
  convocation: "Convocation",
  livret: "Livret d'accueil",
  certificat: "Certificat de réalisation",
  attestation: "Attestation de fin",
};

export const MAIL_COPY: Record<
  Lot4DocumentKind,
  { subject: string; title: string; body: string; cta: string }
> = {
  devis: {
    subject: "Votre devis de formation — Byound",
    title: "Votre devis",
    body: "Voici le devis pour la formation prévue. Vous pouvez le consulter et l'accepter en ligne.",
    cta: "Voir le devis",
  },
  convention: {
    subject: "Votre convention de formation — Byound",
    title: "Convention de formation",
    body: "La convention de formation est prête. Les CGV et le règlement intérieur sont joints.",
    cta: "Voir la convention",
  },
  cgv: {
    subject: "Conditions générales de vente — Byound",
    title: "Conditions générales de vente",
    body: "Voici les conditions générales de vente applicables à votre formation.",
    cta: "Voir les CGV",
  },
  reglement: {
    subject: "Règlement intérieur — Byound",
    title: "Règlement intérieur",
    body: "Voici le règlement intérieur applicable pendant la formation.",
    cta: "Voir le règlement",
  },
  programme: {
    subject: "Programme de formation — Byound",
    title: "Programme",
    body: "Voici le programme détaillé de votre formation.",
    cta: "Voir le programme",
  },
  convocation: {
    subject: "Convocation à votre formation — Byound",
    title: "Vous êtes convoqué·e",
    body: "Retrouvez les informations pratiques de votre session. Présentez-vous le jour J avec votre téléphone pour émarger.",
    cta: "Voir la convocation",
  },
  livret: {
    subject: "Livret d'accueil — Byound",
    title: "Livret d'accueil",
    body: "Voici le livret d'accueil de votre formation Byound.",
    cta: "Voir le livret",
  },
  certificat: {
    subject: "Certificat de réalisation — Byound",
    title: "Certificat de réalisation",
    body: "Voici votre certificat de réalisation, basé sur les demi-journées effectivement suivies.",
    cta: "Voir le certificat",
  },
  attestation: {
    subject: "Attestation de fin de formation — Byound",
    title: "Attestation de fin",
    body: "Voici votre attestation de fin de formation.",
    cta: "Voir l'attestation",
  },
};

export function isLot4Kind(kind: string): kind is Lot4DocumentKind {
  return (LOT4_DOCUMENT_KINDS as readonly string[]).includes(kind);
}

/** @deprecated */
export function isLot4aKind(kind: string): kind is Lot4aDocumentKind {
  return (LOT4A_DOCUMENT_KINDS as readonly string[]).includes(kind);
}

export type ScheduledMailKind =
  | "devis_relance_j3"
  | "devis_relance_j7"
  | "convention_relance_j3"
  | "convention_relance_j7"
  | "convocation_j7"
  | "positionnement_j3"
  | "positionnement_synth_formateur"
  | "pack_formateur_j1"
  | "absent_relance"
  | "eval_froid_j60"
  | "questionnaire_entreprise_j60";
