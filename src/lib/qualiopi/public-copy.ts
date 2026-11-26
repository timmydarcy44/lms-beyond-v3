/**
 * Libellés publics Qualiopi — source unique (fiches, livret, convocation, procédures).
 * Toute mention visible par l’auditeur / le client doit importer depuis ici.
 */

export const QUALIOPI_PUBLIC_CONTACT_EMAIL = "jessica.contentin@byound.fr";

export const QUALIOPI_PUBLIC_CONTACT_LINE =
  `Jessica Contentin — ${QUALIOPI_PUBLIC_CONTACT_EMAIL}`;

export const QUALIOPI_HANDICAP_REFERENT_LINE =
  `Jessica Contentin — ${QUALIOPI_PUBLIC_CONTACT_EMAIL}, étude personnalisée de chaque situation.`;

export const QUALIOPI_HANDICAP_REFERENT_SHORT =
  `Jessica Contentin · ${QUALIOPI_PUBLIC_CONTACT_EMAIL}`;

/** Phrase publique par défaut — sans OPCO ni Qualiopi. */
export const QUALIOPI_FINANCING_DEFAULT = "Financement par l'entreprise cliente.";

/**
 * Option admin / back-office uniquement (conservée en base).
 * Ne doit pas être affichée sur le front tant que `show_opco_public` est faux.
 */
export const QUALIOPI_FINANCING_OPCO_ADMIN =
  "Financement entreprise et/ou prise en charge OPCO (selon éligibilité).";

/** @deprecated alias — préférer QUALIOPI_FINANCING_DEFAULT sur le front. */
export const QUALIOPI_FINANCING_COPY = QUALIOPI_FINANCING_DEFAULT;

const OPCO_OR_QUALIOPI_RE = /\bopco\b|\bqualiopi\b/i;

export function financingMentionsOpcoOrQualiopi(value: string | null | undefined): boolean {
  return OPCO_OR_QUALIOPI_RE.test(String(value ?? ""));
}

type PublicFinancingOpts = {
  /** Flag admin — désactivé par défaut : masque OPCO/Qualiopi sur le front. */
  showOpcoPublic?: boolean;
  qualiopiCertified?: boolean;
};

/**
 * Front public uniquement.
 * Par défaut (`showOpcoPublic = false`) : toujours la phrase entreprise, jamais OPCO/Qualiopi.
 * Si `showOpcoPublic` est true : on peut afficher le texte fiche (y compris option OPCO admin).
 * 2e argument : boolean (legacy = qualiopiCertified) ou options.
 */
export function resolvePublicFinancingCopy(
  courseFinancing: string | null | undefined,
  qualiopiCertifiedOrOpts?: boolean | PublicFinancingOpts,
): string {
  const opts: PublicFinancingOpts =
    typeof qualiopiCertifiedOrOpts === "boolean"
      ? { showOpcoPublic: false, qualiopiCertified: qualiopiCertifiedOrOpts }
      : (qualiopiCertifiedOrOpts ?? {});
  const showOpcoPublic = opts.showOpcoPublic === true;
  if (!showOpcoPublic) return QUALIOPI_FINANCING_DEFAULT;
  const raw = String(courseFinancing ?? "").trim();
  if (!raw) return QUALIOPI_FINANCING_DEFAULT;
  if (!opts.qualiopiCertified && financingMentionsOpcoOrQualiopi(raw)) {
    return QUALIOPI_FINANCING_DEFAULT;
  }
  return raw;
}

/** Délais d'accès — fiche catalogue / livret. */
export const QUALIOPI_ACCESS_DELAYS_COPY =
  "Intra : démarrage sous 3 à 4 semaines après acceptation du devis. Modules en ligne : accès sous 48 h ouvrées.";

/** Horaires — livret (la convocation garde les horaires de session). */
export const QUALIOPI_SCHEDULE_COPY =
  "Journées de 7 heures ; horaires précis indiqués dans la convocation.";

/** Réclamations. */
export const QUALIOPI_COMPLAINTS_COPY =
  `Pour toute réclamation : ${QUALIOPI_PUBLIC_CONTACT_EMAIL} — accusé de réception sous 2 jours ouvrés, réponse écrite sous 10 jours ouvrés.`;

export const QUALIOPI_COMPLAINTS_PROCEDURE_DELAYS = [
  "Accusé de réception sous 2 jours ouvrés",
  "Réponse écrite sous 10 jours ouvrés",
] as const;

/** Émargement. */
export const QUALIOPI_ATTENDANCE_COPY =
  "Émargement électronique par demi-journée (stagiaire et formateur).";

/** Version livret d'accueil. */
export const QUALIOPI_LIVRET_VERSION = "1.1";
export const QUALIOPI_LIVRET_VERSION_LABEL = "Version 1.1 — novembre 2026";

/** Taux de réussite — méthode affichée sur les fiches. */
export const QUALIOPI_SUCCESS_RATE_METHOD =
  "% de participants ayant validé le quiz final. L'Open Badge Byound reste un complément de reconnaissance.";

/** Modalités pédagogiques — module court e-learning 3 h (réel). */
export const QUALIOPI_ELEARNING_3H_MODALITY =
  "Module e-learning asynchrone de 3 h sur la plateforme Byound, suivi en autonomie : vidéos courtes, quiz par séquence, exercice d'application. Suivi des connexions et de la progression sur le LMS.";

export const QUALIOPI_ELEARNING_3H_METHODS = [
  "Vidéos courtes sur la plateforme Byound",
  "Quiz de validation par séquence",
  "Exercice d'application",
  "Suivi des connexions et de la progression (LMS)",
] as const;

/** Accessibilité — texte commun + contact référent en fin de bloc. */
export const QUALIOPI_ACCESSIBILITY_BODY =
  "Formation accessible aux personnes en situation de handicap. Adaptations possibles sur demande, en lien si besoin avec nos partenaires (Agefiph, Cap Emploi).";

export const QUALIOPI_ACCESSIBILITY_CONTACT_LINE =
  `Contact référent handicap : ${QUALIOPI_PUBLIC_CONTACT_EMAIL}`;

export const QUALIOPI_ACCESSIBILITY_COPY =
  `${QUALIOPI_ACCESSIBILITY_BODY} ${QUALIOPI_ACCESSIBILITY_CONTACT_LINE}`;
