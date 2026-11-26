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

/** Modalités de financement — une seule formulation partout. */
export const QUALIOPI_FINANCING_COPY =
  "Financement par l'entreprise cliente. Prise en charge OPCO possible après obtention de la certification Qualiopi (en cours).";

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
