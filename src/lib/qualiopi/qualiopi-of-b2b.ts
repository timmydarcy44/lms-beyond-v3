/** Périmètre OF formation continue / B2B — indicateurs hors scope à justifier N/A (RNQ V10). */

export const QUALIOPI_OF_NA_INDICATORS = [
  {
    id: 3,
    note: "N/A OF B2B — Byound ne délivre pas de certifications professionnelles RNCP/RS ; pas de suivi de taux d’obtention ni de blocs de compétences.",
  },
  {
    id: 7,
    note: "N/A OF B2B — pas de prestations conduisant à une certification professionnelle ; pas de contrôle d’adéquation RNCP/RS.",
  },
  {
    id: 13,
    note: "N/A OF B2B — hors périmètre formations en alternance (coordination centre / entreprise).",
  },
  {
    id: 14,
    note: "N/A OF B2B — hors périmètre apprentissage (accompagnement socio-professionnel / citoyenneté).",
  },
  {
    id: 15,
    note: "N/A OF B2B — hors périmètre apprentissage (droits et devoirs des apprentis, médiateur).",
  },
  {
    id: 16,
    note: "N/A OF B2B — pas de présentation à une certification professionnelle délivrée par une autorité de certification.",
  },
  {
    id: 20,
    note: "N/A OF B2B — hors périmètre apprentissage (mobilité, conseil de perfectionnement, supervision CFA). Le référent handicap OF reste tracé sur les ind. 10 et 26.",
  },
  {
    id: 28,
    note: "N/A OF B2B — pas de périodes de formation en situation de travail (PFST) dans le catalogue audit initial.",
  },
  {
    id: 29,
    note: "N/A OF B2B — hors périmètre promotion / insertion par la voie de l’apprentissage.",
  },
  {
    id: 33,
    note: "N/A OF B2B — indicateur réservé à l’apprentissage / CFA (évaluation des contenus distincte de la satisfaction).",
  },
] as const;

export const QUALIOPI_OF_NA_IDS = new Set(
  QUALIOPI_OF_NA_INDICATORS.map((i) => i.id),
);

export function qualiopiOfNaNote(indicatorId: number): string | null {
  return QUALIOPI_OF_NA_INDICATORS.find((i) => i.id === indicatorId)?.note ?? null;
}

export type QualiopiProcessDocKind =
  | "reclamations"
  | "paq"
  | "formateurs"
  | "handicap"
  | "moyens"
  | "signalements";

export const QUALIOPI_PROCESS_DOCS: Array<{
  kind: QualiopiProcessDocKind;
  title: string;
  indicatorIds: number[];
  template: string;
}> = [
  {
    kind: "reclamations",
    title: "Procédure de traitement des réclamations",
    indicatorIds: [31],
    template: `# Procédure de traitement des réclamations — Byound

## Objet
Décrire comment toute réclamation relative à une action de formation est recueillie, traitée et clôturée.

## Destinataires
Apprenants, entreprises clientes, financeurs, partenaires.

## Canaux
- Formulaire / e-mail qualité : qualite@byound.fr (à confirmer)
- Module Qualité dans /super/crm/qualiopi/qualite
- Remontée via questionnaire de satisfaction (note basse)

## Délais
- Accusé de réception sous 5 jours ouvrés
- Réponse écrite sous 15 jours ouvrés (sauf complexité signalée)

## Étapes
1. Enregistrement dans le registre des réclamations
2. Analyse des faits et pièces
3. Proposition de réponse / action corrective
4. Clôture et information du demandeur
5. Lien éventuel vers le plan d’actions qualité (ind. 32)

## Conservation
Registre conservé 3 ans minimum.
`,
  },
  {
    kind: "paq",
    title: "Comité qualité et plan d’actions",
    indicatorIds: [32],
    template: `# Comité qualité & plan d’actions — Byound

## Objet
Assurer l’amélioration continue à partir des retours, réclamations et veilles.

## Fréquence
Revue mensuelle (1 h) + revue annuelle.

## Entrées
- Satisfactions sessions
- Réclamations
- Veille (highlights traités)
- Feedback formateurs / experts

## Sorties
- Plan d’actions : cause → action → responsable → échéance → statut
- Compte rendu daté

## Preuve
Module /super/crm/qualiopi/qualite (actions) + export PDF.
`,
  },
  {
    kind: "formateurs",
    title: "Plan de développement des compétences formateurs",
    indicatorIds: [22],
    template: `# Plan de développement des compétences — intervenants Byound

## Objet
Maintenir et développer les compétences pédagogiques et métier des experts / formateurs.

## Diagnostic
Grille compétences par expert (technique, pédagogique, digital, Qualiopi).

## Actions types
- Observation croisée / co-animation
- Formation courte (outil, pédagogie, IA)
- Retour d’expérience session

## Suivi
Chaque action : date, objectif, preuve (attest. / capture), statut.
Module experts + synthèse annuelle.
`,
  },
  {
    kind: "handicap",
    title: "Accueil des personnes en situation de handicap",
    indicatorIds: [10, 26],
    template: `# Accueil PSH — Byound

## Référente handicap
Jessica CONTENTIN — jessica.contentin@byound.fr

## Modalités
- Étude personnalisée de chaque situation
- Adaptation pédagogique / technique possible selon le parcours
- Information sur les fiches formation publiques
- Procédure associée : PR-HAN-01 · Fiche suivi : FS-HAN-01

## Partenariats (AN-HAN-01)
Annuaire des partenaires handicap — version 1.0 du 13/11/2026 (prochaine revue : novembre 2027).
Premier recours : Ressource Handicap Formation (RHF) Normandie, puis partenaire adapté
(Agefiph Normandie, Cap emploi Calvados, MDPH 14, France Travail, Mission Locale, PRITH,
Mission ville-handicap Caen, Unafam 14, Valentin Haüy Caen, interlocuteurs entreprise cliente).
Espace produit : Qualiopi → Handicap → Annuaire.

## Preuve
Note process + AN-HAN-01 + échanges datés (colonne « Contact établi le » / fiche FS-HAN-01).
`,
  },
  {
    kind: "moyens",
    title: "Moyens matériels et locaux",
    indicatorIds: [17],
    template: `# Moyens matériels et locaux — Byound

## Périmètre
Formations distancielles / hybrides via plateforme Byound + moyens éventuels en présentiel.

## Plateforme
LMS Byound (accès, supports, émargement, satisfaction).

## Présentiel (si applicable)
Locaux partenaires / client — capacité, accessibilité, matériel.

## Preuve
Cette note + captures / contrats locaux si présentiel.
`,
  },
  {
    kind: "signalements",
    title: "Procédure signalements violences / harcèlement / discriminations",
    indicatorIds: [12],
    template: `# Procédure signalements sensibles — Byound

## Objet
Recueillir et traiter tout signalement de violence, harcèlement ou discrimination lié à une action de formation, dans le respect de la confidentialité.

## Destinataires
Apprenants, formateurs / experts, entreprises clientes, salariés.

## Canaux
- Formulaire dédié (espaces dashboard + Qualité)
- Anonymat possible

## Référent
Désigné dans les paramètres OF (\`referent_signalement_user_id\`). Accès au registre restreint (RLS).

## Délais (paramétrables)
- Accusé de réception sous N jours ouvrés (défaut : 2)
- Traitement et clôture documentés dans le registre

## Étapes
1. Enregistrement (statut « reçu »)
2. Accusé de réception
3. Traitement (statut « en traitement »)
4. Clôture et, si non anonyme, information du déclarant
5. Conservation séparée du registre des réclamations qualité

## Preuve
Registre Qualiopi → Qualité → Signalements + cette procédure (PDF éventuel).
`,
  },
];

export function processDocByKind(kind: string) {
  return QUALIOPI_PROCESS_DOCS.find((d) => d.kind === kind) ?? null;
}
