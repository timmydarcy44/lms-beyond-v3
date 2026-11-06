/** Périmètre OF formation continue / B2B — indicateurs hors scope à attester N/A. */

export const QUALIOPI_OF_NA_INDICATORS = [
  {
    id: 3,
    note: "N/A OF B2B — Byound ne délivre pas de certifications professionnelles RNCP/RS ; pas de suivi de taux d’obtention.",
  },
  {
    id: 7,
    note: "N/A OF B2B — pas de contrôle d’adéquation RNCP/RS (pas de titres délivrés).",
  },
  {
    id: 12,
    note: "N/A OF B2B — pas d’accompagnement vers l’emploi ou la certification professionnelle hors offre catalogue.",
  },
  {
    id: 27,
    note: "N/A OF B2B — pas de sous-traitance pédagogique Qualiopi à date ; interventions gérées en experts internes / partenaires référencés.",
  },
  {
    id: 28,
    note: "N/A OF B2B — hors périmètre CFA / apprentissage pour cet audit initial.",
  },
  {
    id: 29,
    note: "N/A OF B2B — hors périmètre promotion / pilotage alternance pour cet audit initial.",
  },
] as const;

export type QualiopiProcessDocKind =
  | "reclamations"
  | "paq"
  | "formateurs"
  | "handicap"
  | "moyens";

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
    indicatorIds: [20, 26],
    template: `# Accueil PSH — Byound

## Référent handicap
Contact : referent-handicap@byound.fr

## Modalités
- Étude personnalisée de chaque situation
- Adaptation pédagogique / technique possible selon le parcours
- Information sur les fiches formation publiques

## Partenariats
À lister (Agefiph, Cap emploi, MDPH, partenaires locaux…).

## Preuve
Note + échanges datés + partenariats.
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
];

export function processDocByKind(kind: string) {
  return QUALIOPI_PROCESS_DOCS.find((d) => d.kind === kind) ?? null;
}
