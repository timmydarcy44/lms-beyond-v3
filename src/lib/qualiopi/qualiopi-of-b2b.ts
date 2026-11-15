/**
 * Justifications N/A par défaut selon le profil d'activités.
 * Avec OF+CFA (défaut) : certifiant + PFST hors scope → 3, 7, 16, 28.
 */

import { listNaIndicators, DEFAULT_QUALIOPI_ACTIVITIES } from "@/lib/qualiopi/activity-profile";

const DEFAULT_NA_NOTES: Record<number, string> = {
  3: "N/A — Byound ne délivre pas de certifications professionnelles RNCP/RS dans le périmètre audit actuel.",
  7: "N/A — pas de prestations conduisant à une certification professionnelle (contrôle d’adéquation RNCP/RS).",
  13: "N/A — hors périmètre formations en alternance (activer CFA dans le profil d’activités).",
  14: "N/A — hors périmètre apprentissage (activer CFA).",
  15: "N/A — hors périmètre apprentissage (activer CFA).",
  16: "N/A — pas de présentation à une certification professionnelle.",
  20: "N/A — hors périmètre apprentissage / CFA (mobilité, conseil de perfectionnement).",
  28: "N/A — pas de périodes de formation en situation de travail (PFST) dans le catalogue actuel.",
  29: "N/A — hors périmètre insertion / poursuite d’études par l’apprentissage (activer CFA).",
};

/** Liste N/A pour le profil courant (défaut OF+CFA). */
export function qualiopiNaDefaultsForProfile(
  profile = DEFAULT_QUALIOPI_ACTIVITIES,
): Array<{ id: number; note: string }> {
  return listNaIndicators(profile).map((ind) => ({
    id: ind.id,
    note: DEFAULT_NA_NOTES[ind.id] ?? `N/A — hors périmètre (${ind.shortTitle}).`,
  }));
}

/** @deprecated Utiliser qualiopiNaDefaultsForProfile — conservé pour bulk-na. */
export const QUALIOPI_OF_NA_INDICATORS = qualiopiNaDefaultsForProfile(
  DEFAULT_QUALIOPI_ACTIVITIES,
);

export const QUALIOPI_OF_NA_IDS = new Set(QUALIOPI_OF_NA_INDICATORS.map((i) => i.id));

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

## Canaux
- Module Qualité dans /super/crm/qualiopi/qualite
- Questionnaire de satisfaction (note basse)

## Délais
- Accusé de réception sous 5 jours ouvrés
- Réponse écrite sous 15 jours ouvrés

## Preuve
Registre des réclamations + cette procédure.
`,
  },
  {
    kind: "paq",
    title: "Comité qualité et plan d’actions",
    indicatorIds: [32],
    template: `# Comité qualité & plan d’actions — Byound

## Objet
Amélioration continue à partir des retours, réclamations, risques et veilles.

## Preuve
Module /super/crm/qualiopi/qualite + registre des risques.
`,
  },
  {
    kind: "formateurs",
    title: "Plan de développement des compétences formateurs",
    indicatorIds: [22],
    template: `# Plan de développement des compétences — intervenants Byound

## Objet
Maintenir et développer les compétences pédagogiques et métier des experts / formateurs.
`,
  },
  {
    kind: "handicap",
    title: "Accueil des personnes en situation de handicap",
    indicatorIds: [10, 26],
    template: `# Accueil PSH — Byound

## Référente handicap
Jessica CONTENTIN — jessica.contentin@byound.fr

## Preuve
Note process + annuaire partenaires + espace Handicap.
`,
  },
  {
    kind: "moyens",
    title: "Moyens matériels et locaux",
    indicatorIds: [17],
    template: `# Moyens humains et techniques — Byound (OF)

## Périmètre
Document **OF** (pas une fiche par formation). Couvre les moyens mobilisés pour les prestations Business : distanciel / hybride via plateforme Byound, et moyens présentiels éventuels.

## 1. Moyens humains
- Direction / référent qualité / référent handicap / référent signalements
- Intervenants (salariés, indépendants, portage) validés avant mission
- Coordination pédagogique des sessions

## 2. Moyens techniques & plateforme
- LMS Byound (accès stagiaires, ressources, suivi de progression, émargement numérique)
- Outils de visioconférence / collaboration le cas échéant
- Coffre documentaire (conventions, attestations, enquêtes)

## 3. Locaux & accessibilité (si présentiel)
- Adresse(s) d’accueil
- Capacité, matériel pédagogique, accessibilité PMR
- Consignes sécurité / règlement intérieur

## 4. Mise à jour
Revue annuelle ou à chaque changement majeur d’outil / d’effectif formateurs.
`,
  },
  {
    kind: "signalements",
    title: "Procédure signalements violences / harcèlement / discriminations",
    indicatorIds: [12],
    template: `# Procédure — engagement, prévention des ruptures & signalements VHD

## 1. Objet
Prévenir les ruptures de parcours et traiter tout signalement de violence, harcèlement ou discrimination (VHD) lié à une action de formation Byound.

## 2. Canaux de signalement (déjà en place)
- Formulaire dédié dans les espaces : apprenant, expert / formateur, salarié
- Contact référent signalements (Paramètres OF)
- Possibilité d’anonymat selon le formulaire

## 3. Réception & délais
1. Enregistrement automatique dans le registre Qualité (signalements)
2. Accusé de réception sous X jours ouvrés (réglage OF)
3. Qualification (violence / harcèlement / discrimination / autre sensible)
4. Mesures de protection immédiates si nécessaire
5. Clôture documentée (sans données inutiles)

## 4. Prévention des ruptures / abandons
- Détection des difficultés (absences, inactivité LMS, réclamations)
- Entretien de remobilisation / aménagement si pertinent
- Traçage des sorties / abandons dans le dossier formation (motif, date, suite)

## 5. Information des parties
- Stagiaires et intervenants informés des canaux en démarrage de session (pack info / livret)
- Rappel du règlement intérieur et des sanctions applicables

## 6. Preuves pour l’audit
- La présente procédure marquée « prêt »
- Registre des signalements (même si volume = 0)
- Sorties / abandons tracés dans les dossiers
`,
  },
];

export function processDocByKind(kind: string) {
  return QUALIOPI_PROCESS_DOCS.find((d) => d.kind === kind) ?? null;
}
