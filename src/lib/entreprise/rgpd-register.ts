/**
 * Registre des traitements EDGE Entreprise (art. 30 RGPD) — socle applicatif.
 * Document de référence pour transparence et exercice des droits.
 */

export type LegalBasis =
  | "contract"
  | "legitimate_interest"
  | "consent"
  | "legal_obligation";

export type ProcessingRecord = {
  id: string;
  name: string;
  purpose: string;
  categories: string[];
  recipients: string[];
  retention: string;
  legalBasis: LegalBasis;
  legalBasisLabel: string;
  transfersOutsideEu: boolean;
  securityMeasures: string[];
};

export const EDGE_DPO_CONTACT = {
  email: "contact@edgebs.fr",
  organization: "EDGE Business Solutions",
  address: "France",
};

export const EDGE_PROCESSING_REGISTER: ProcessingRecord[] = [
  {
    id: "account-auth",
    name: "Compte et authentification",
    purpose: "Créer et sécuriser l’accès au dashboard entreprise EDGE.",
    categories: ["Identité", "Identifiants de connexion", "Logs de session"],
    recipients: ["Équipe technique EDGE", "Sous-traitant hébergement (Supabase / Vercel)"],
    retention: "Durée du contrat + 3 ans après clôture du compte (sauf obligation légale).",
    legalBasis: "contract",
    legalBasisLabel: "Exécution du contrat (art. 6.1.b)",
    transfersOutsideEu: false,
    securityMeasures: ["HTTPS", "Contrôle d’accès", "Chiffrement au repos (hébergeur)"],
  },
  {
    id: "hr-directory",
    name: "Annuaire collaborateurs",
    purpose: "Gérer les fiches salariés (identité, poste, département) pour le pilotage RH.",
    categories: ["Identité", "Coordonnées professionnelles", "Poste / métier"],
    recipients: ["Responsables RH de l’organisation cliente", "Support EDGE (si assistance)"],
    retention: "Durée de la relation de travail / contrat entreprise + 5 ans (archives RH).",
    legalBasis: "legitimate_interest",
    legalBasisLabel: "Intérêt légitime — gestion RH (art. 6.1.f)",
    transfersOutsideEu: false,
    securityMeasures: ["ACL organisation", "Journalisation d’accès API"],
  },
  {
    id: "diagnostics",
    name: "Diagnostics compétences & comportement",
    purpose: "Cartographier soft skills, IDMC et profil comportemental pour recommandations.",
    categories: ["Résultats de tests", "Scores", "Recommandations"],
    recipients: ["RH / managers autorisés de l’organisation", "Moteur d’analyse EDGE"],
    retention: "Durée du contrat + 2 ans, ou suppression sur demande / fin de consentement de partage.",
    legalBasis: "consent",
    legalBasisLabel: "Consentement de partage entreprise (art. 6.1.a) le cas échéant + intérêt légitime RH",
    transfersOutsideEu: false,
    securityMeasures: ["Consentement de partage", "Accès restreint aux rôles RH"],
  },
  {
    id: "inclusion",
    name: "Inclusion & accessibilité",
    purpose: "Proposer des aménagements à partir d’éléments déclarés ou documentés.",
    categories: ["Éléments d’inclusion", "Aménagements recommandés", "Notes RH"],
    recipients: ["RH de l’organisation", "Référent inclusion si désigné"],
    retention: "Durée de nécessité des aménagements + 3 ans.",
    legalBasis: "consent",
    legalBasisLabel: "Consentement / obligation d’accessibilité selon le cas (art. 6.1.a / 6.1.c)",
    transfersOutsideEu: false,
    securityMeasures: ["Accès RH uniquement", "Minimisation des données de santé"],
  },
  {
    id: "messaging",
    name: "Messagerie RH ↔ collaborateur",
    purpose: "Échanges internes courts sans email pour questions opérationnelles.",
    categories: ["Contenu des messages", "Horodatage", "Identifiants interlocuteurs"],
    recipients: ["RH et collaborateur concernés"],
    retention: "24 mois après le dernier message du fil.",
    legalBasis: "legitimate_interest",
    legalBasisLabel: "Intérêt légitime — communication interne (art. 6.1.f)",
    transfersOutsideEu: false,
    securityMeasures: ["Périmètre organisation", "API authentifiée"],
  },
  {
    id: "recruitment",
    name: "Recrutement & offres",
    purpose: "Publier des offres et suivre les candidatures.",
    categories: ["Offres", "Candidatures", "Profils candidats"],
    recipients: ["Équipe recrutement de l’organisation", "EDGE (support)"],
    retention: "24 mois après clôture de l’offre / candidature (sauf consentement plus long).",
    legalBasis: "legitimate_interest",
    legalBasisLabel: "Intérêt légitime — recrutement (art. 6.1.f)",
    transfersOutsideEu: false,
    securityMeasures: ["Accès rôles recrutement", "Suppression sur demande"],
  },
  {
    id: "training-requests",
    name: "Demandes de formation",
    purpose: "Transmettre les besoins de formation à l’équipe EDGE.",
    categories: ["Contact", "Entreprise", "Besoin formation", "Message"],
    recipients: ["contact@edgebs.fr", "Équipe commerciale / pédagogique EDGE"],
    retention: "3 ans à compter de la demande.",
    legalBasis: "contract",
    legalBasisLabel: "Mesures précontractuelles / contrat (art. 6.1.b)",
    transfersOutsideEu: false,
    securityMeasures: ["Email sécurisé", "Accès limité équipe EDGE"],
  },
  {
    id: "billing",
    name: "Abonnement & facturation",
    purpose: "Gérer l’offre EDGE (Skills / Learning) et la relation commerciale.",
    categories: ["Identité contact", "Organisation", "Formule", "Échanges devis"],
    recipients: ["EDGE", "Prestataire de paiement le cas échéant"],
    retention: "10 ans (obligations comptables).",
    legalBasis: "legal_obligation",
    legalBasisLabel: "Obligation légale comptable + contrat (art. 6.1.c / 6.1.b)",
    transfersOutsideEu: false,
    securityMeasures: ["Accès restreint", "Conservation archivée"],
  },
  {
    id: "support",
    name: "Support & journalisation",
    purpose: "Assistance utilisateurs, sécurité et amélioration du service.",
    categories: ["Logs techniques", "Tickets support", "Adresse IP technique"],
    recipients: ["Support EDGE", "Hébergeurs"],
    retention: "12 mois pour les logs ; tickets support 3 ans.",
    legalBasis: "legitimate_interest",
    legalBasisLabel: "Intérêt légitime — sécurité et support (art. 6.1.f)",
    transfersOutsideEu: false,
    securityMeasures: ["Surveillance d’accès", "Minimisation des logs"],
  },
];

export type RgpdRequestType = "access" | "erasure" | "rectification" | "opposition";

export const RGPD_REQUEST_LABELS: Record<RgpdRequestType, string> = {
  access: "Droit d’accès (export)",
  erasure: "Droit à l’effacement",
  rectification: "Droit de rectification",
  opposition: "Droit d’opposition",
};
