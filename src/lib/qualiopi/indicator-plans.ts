/** « Ce que l’on va faire » — exemples process + document, indicateur par indicateur. */

export type QualiopiIndicatorPlan = {
  processTitle: string;
  processSteps: string[];
  documentTitle: string;
  documentBody: string;
};

export const QUALIOPI_INDICATOR_PLANS: Record<number, QualiopiIndicatorPlan> = {
  1: {
    processTitle: "Publier une fiche formation complète",
    processSteps: [
      "Compléter sur chaque offre publique : objectifs (≥ 3), durée, modalités, tarifs, accessibilité.",
      "Vérifier la page publique catalogue (/business/formations/…).",
      "Archiver un one-pager PDF pour l’auditeur si demandé.",
    ],
    documentTitle: "One-pager fiche formation",
    documentBody: `Fiche formation — [Titre]

Objectifs (3+) :
1. …
2. …
3. …

Durée · Modalités · Tarif HT
Public · Prérequis · Accessibilité handicap
Contact référente handicap`,
  },
  2: {
    processTitle: "Diffuser les indicateurs de résultats",
    processSteps: [
      "Choisir les indicateurs (satisfaction, réussite, insertion…) et la méthode de calcul.",
      "Renseigner la méthode globale OF puis, si besoin, une surcharge par fiche.",
      "Contrôler la section « Nos indicateurs qualité » sur la fiche publique (#qualite).",
    ],
    documentTitle: "Note méthode de calcul",
    documentBody: `Indicateurs de résultats — méthode

Périmètre : sessions clôturées N-1
Satisfaction = moyenne des enquêtes à chaud
Taux de réussite = attestations / inscrits
Mise à jour : trimestrielle
Source : LMS / enquêtes Qualiopi`,
  },
  3: {
    processTitle: "Publier les taux de certification",
    processSteps: [
      "Recenser les sessions certifiantes et les résultats d’examen.",
      "Calculer le taux d’obtention (et blocs si applicable).",
      "Publier sur la fiche du titre avec la méthode de calcul.",
    ],
    documentTitle: "Tableau taux d’obtention",
    documentBody: `Certification [code RNCP/RS]

Année | Présentés | Obtenus | Taux
2025  | …         | …       | …

Blocs / équivalences / débouchés : …`,
  },
  4: {
    processTitle: "Tracer l’analyse du besoin",
    processSteps: [
      "En prospection (pipeline B2B), renseigner Besoin + Besoins identifiés sur le deal.",
      "Compléter effectif, décideur, budget / financeur avant envoi catalogue ou devis.",
      "Conserver la trace sur le deal (puis session / dossier une fois signé).",
    ],
    documentTitle: "Compte-rendu d’analyse du besoin",
    documentBody: `Analyse du besoin — [Client]

Date · Interlocuteurs
Contexte / métier
Objectifs attendus
Public concerné · Contraintes
Proposition pédagogique retenue
Source : deal pipeline B2B`,
  };
  5: {
    processTitle: "Rédiger des objectifs opérationnels",
    processSteps: [
      "Formuler ≥ 3 objectifs observables et évaluables par formation.",
      "Les publier sur la fiche catalogue publique (section Objectifs).",
      "Les reprendre dans le positionnement / évaluation.",
    ],
    documentTitle: "Objectifs pédagogiques",
    documentBody: `À l’issue de la formation, le stagiaire sera capable de :
1. …
2. …
3. …

Critères d’évaluation associés : …`,
  },
  6: {
    processTitle: "Aligner contenus et modalités",
    processSteps: [
      "Découper le programme (séquences, formats, durée).",
      "Adapter présentiel / distanciel / mixte au public.",
      "Mettre à jour la fiche (modalités + description).",
    ],
    documentTitle: "Programme détaillé",
    documentBody: `Programme — [Titre]

Séquence 1 (… h) — …
Séquence 2 (… h) — …
Modalités : présentiel / distanciel / mixte
Supports : …`,
  },
  7: {
    processTitle: "Mapper le référentiel de certification",
    processSteps: [
      "Identifier le référentiel (RNCP/RS) et les compétences exigées.",
      "Croiser chaque bloc avec le programme.",
      "Joindre la matrice d’adéquation au dossier.",
    ],
    documentTitle: "Matrice d’adéquation",
    documentBody: `Certification [code]

Bloc / Compétence | Module | Preuve
…                 | …      | …`,
  },
  8: {
    processTitle: "Mettre en place le positionnement",
    processSteps: [
      "Créer un test / questionnaire d’entrée lié aux objectifs.",
      "Faire passer le positionnement avant ou en début de session.",
      "Conserver les résultats dans le dossier stagiaire.",
    ],
    documentTitle: "Fiche de positionnement",
    documentBody: `Positionnement — [Stagiaire] · [Session]

Objectifs évalués
Score / niveau
Écarts identifiés
Ajustements pédagogiques`,
  },
  9: {
    processTitle: "Informer avant le démarrage",
    processSteps: [
      "Générer et envoyer le pack (convocation, règlement, livret).",
      "Vérifier l’accusé de réception / lecture.",
      "Archiver les envois dans le dossier session.",
    ],
    documentTitle: "Convocation / livret d’accueil",
    documentBody: `Convocation — [Formation] · [Dates]

Lieu / lien · Horaires
Documents à apporter
Règlement intérieur (lien)
Référente handicap · Contacts utiles`,
  },
  10: {
    processTitle: "Adapter le suivi aux publics",
    processSteps: [
      "Identifier les besoins spécifiques (dont handicap) en amont.",
      "Noter les aménagements dans le dossier.",
      "Assurer le suivi pédagogique pendant la session.",
    ],
    documentTitle: "Fiche d’adaptation / suivi",
    documentBody: `Suivi — [Stagiaire]

Besoins / aménagements
Actions mises en œuvre
Points de suivi
Bilan intermédiaire`,
  },
  11: {
    processTitle: "Évaluer l’atteinte des objectifs",
    processSteps: [
      "Définir les modalités d’évaluation (quiz, mise en situation…).",
      "Collecter les résultats en fin de parcours.",
      "Conserver les preuves (copies, grilles, attestations).",
    ],
    documentTitle: "Grille d’évaluation",
    documentBody: `Évaluation — [Session]

Objectif | Critère | Atteint (O/N) | Commentaire
…        | …       | …             | …`,
  },
  12: {
    processTitle: "Prévenir ruptures et VHD",
    processSteps: [
      "Rédiger la procédure engagement / ruptures / signalements.",
      "Informer stagiaires et formateurs des canaux de signalement.",
      "Tracer les cas traités (sans données inutiles).",
    ],
    documentTitle: "Procédure VHD / ruptures",
    documentBody: `Procédure — engagement & signalements

Canaux : formulaire / mail / référent
Délais de traitement
Mesures de protection
Archivage et confidentialité`,
  },
  13: {
    processTitle: "Coordonner centre et entreprise (CFA)",
    processSteps: [
      "Planifier les missions en entreprise avec le maître d’apprentissage.",
      "Tenir un livret de liaison / échanges réguliers.",
      "Archiver les comptes-rendus de coordination.",
    ],
    documentTitle: "Livret de liaison alternance",
    documentBody: `Liaison CFA / entreprise — [Apprenti]

Période · Missions
Compétences visées
Points de coordination
Signatures CFA / entreprise`,
  },
  14: {
    processTitle: "Accompagner le parcours CFA",
    processSteps: [
      "Désigner le référent socio-pro / éducatif.",
      "Planifier les entretiens d’accompagnement.",
      "Traiter sans délai les alertes (rupture, discrimination).",
    ],
    documentTitle: "Fiche d’entretien d’accompagnement",
    documentBody: `Entretien — [Apprenti] · [Date]

Situation · Difficultés
Actions / orientation
Suivi prévu
Alertes signalées`,
  },
  15: {
    processTitle: "Informer droits et devoirs des apprentis",
    processSteps: [
      "Intégrer la notice droits/devoirs au livret d’accueil CFA.",
      "Présenter SST, signalements et médiateur en démarrage.",
      "Faire signer la prise de connaissance.",
    ],
    documentTitle: "Notice droits & devoirs",
    documentBody: `Droits et devoirs de l’apprenti

Santé-sécurité · Signalements
Médiateur de l’apprentissage
Contacts utiles
Accusé de réception`,
  },
  16: {
    processTitle: "Préparer la présentation à la certification",
    processSteps: [
      "Vérifier les prérequis d’inscription à l’examen.",
      "Constituer le dossier candidat selon l’autorité.",
      "Tracer la décision de présentation.",
    ],
    documentTitle: "Checklist présentation certification",
    documentBody: `Présentation — [Certification]

Prérequis OK
Dossier complet
Date d’examen
Décision OF / jury`,
  },
  17: {
    processTitle: "Documenter les moyens H&T",
    processSteps: [
      "Lister salles, outils, plateformes et effectifs formateurs.",
      "Mettre à jour la fiche moyens OF.",
      "Joindre photos / inventaire si utile à l’audit.",
    ],
    documentTitle: "Fiche moyens pédagogiques",
    documentBody: `Moyens — [Lieu / plateforme]

Salles · Matériel · LMS
Capacité · Accessibilité
Intervenants mobilisables`,
  },
  18: {
    processTitle: "Coordonner les intervenants",
    processSteps: [
      "Établir le planning et les rôles par session.",
      "Brief commun (objectifs, public, consignes qualité).",
      "Conserver le compte-rendu de coordination.",
    ],
    documentTitle: "Brief intervenants",
    documentBody: `Coordination — [Session]

Intervenants · Rôles
Objectifs partagés
Consignes qualité / émargement
Points de synchro`,
  },
  19: {
    processTitle: "Assurer le suivi distanciel",
    processSteps: [
      "Mettre à disposition les ressources sur le LMS.",
      "Vérifier connexions / progression à distance.",
      "Désigner un référent pédagogique si seuil d’intervenants dépassé.",
    ],
    documentTitle: "Journal de suivi distanciel",
    documentBody: `Suivi distanciel — [Session]

Ressources publiées
Connexions / progression
Relances
Référent pédagogique`,
  },
  20: {
    processTitle: "Structurer la gouvernance CFA",
    processSteps: [
      "Désigner référent handicap, mobilité, conseil de perfectionnement.",
      "Planifier les réunions de pilotage.",
      "Archiver PV et décisions.",
    ],
    documentTitle: "PV conseil de perfectionnement",
    documentBody: `Conseil de perfectionnement — [Date]

Présents
Ordre du jour
Décisions / suivi
Prochaine réunion`,
  },
  21: {
    processTitle: "Valider les compétences des intervenants",
    processSteps: [
      "Recueillir CV, titres et expériences.",
      "Valider le profil avant mission (review approved).",
      "Évaluer après session (feedback).",
    ],
    documentTitle: "Fiche compétence intervenant",
    documentBody: `Intervenant — [Nom]

Titres · Expériences
Domaines d’intervention
Validation · Date
Évaluation post-session`,
  },
  22: {
    processTitle: "Plan de développement des compétences",
    processSteps: [
      "Recenser les besoins (entretien / plan formateur).",
      "Programmer actions (formation, tutorat, veille).",
      "Tracer la réalisation et le bilan.",
    ],
    documentTitle: "Plan de développement formateurs",
    documentBody: `Plan compétences — [Année]

Besoin | Action | Échéance | Statut
…      | …      | …        | …`,
  },
  23: {
    processTitle: "Exploiter la veille réglementaire",
    processSteps: [
      "Consulter le digest / highlights réglementaires.",
      "Identifier les impacts sur l’OF.",
      "Décider et tracer les actions (Traité).",
    ],
    documentTitle: "Fiche d’exploitation veille légale",
    documentBody: `Veille réglementaire — [Période]

Source / alerte
Impact OF
Action | Responsable | Échéance
Statut Traité`,
  },
  24: {
    processTitle: "Exploiter la veille métiers",
    processSteps: [
      "Collecter les évolutions métiers / compétences.",
      "Partager avec l’équipe pédagogique.",
      "Mettre à jour programmes ou objectifs si besoin.",
    ],
    documentTitle: "Synthèse veille métiers",
    documentBody: `Veille métiers — [Thème]

Évolutions repérées
Impacts programmes
Actions pédagogiques
Date de revue`,
  },
  25: {
    processTitle: "Exploiter la veille pédagogique",
    processSteps: [
      "Repérer innovations (outils, formats, IA…).",
      "Tester ou documenter l’intérêt pédagogique.",
      "Intégrer ou classer « hors scope » avec justification.",
    ],
    documentTitle: "Fiche innovation pédagogique",
    documentBody: `Innovation — [Outil / méthode]

Description
Test / retour
Décision d’intégration
Suivi`,
  },
  26: {
    processTitle: "Orienter et accueillir le handicap",
    processSteps: [
      "Configurer le contact référente handicap.",
      "Étudier chaque situation (entretien, aménagements).",
      "Tracer les aménagements dans le dossier confidentiel.",
    ],
    documentTitle: "Fiche étude de situation handicap",
    documentBody: `Situation — [Réf. anonymisée]

Besoins exprimés
Aménagements retenus
Partenaires mobilisés
Suivi`,
  },
  27: {
    processTitle: "Sécuriser sous-traitance / portage",
    processSteps: [
      "Utiliser un contrat type Qualiopi (obligations qualité).",
      "Vérifier documents (compétence, assurance, engagement).",
      "Archiver le contrat signé et le suivi.",
    ],
    documentTitle: "Contrat de sous-traitance (extrait)",
    documentBody: `Sous-traitance — [Prestataire]

Objet · Périmètre
Obligations Qualiopi
Traçabilité / preuves
Signatures`,
  },
  28: {
    processTitle: "Structurer une PFST",
    processSteps: [
      "Identifier le partenaire entreprise.",
      "Co-construire l’ingénierie (objectifs, tutorat).",
      "Tracer la convention PFST et le suivi.",
    ],
    documentTitle: "Convention PFST",
    documentBody: `PFST — [Entreprise partenaire]

Objectifs · Durée
Tutorat entreprise
Rôle OF
Suivi et évaluation`,
  },
  29: {
    processTitle: "Suivre insertion / poursuite d’études",
    processSteps: [
      "Collecter les situations à 3 / 6 mois.",
      "Consolider les taux d’insertion.",
      "Publier ou joindre le bilan pour l’audit CFA.",
    ],
    documentTitle: "Bilan insertion",
    documentBody: `Insertion — promotion [année]

Emploi / poursuite / autre
Taux
Sources (enquête)
Actions d’accompagnement`,
  },
  30: {
    processTitle: "Recueillir les appréciations",
    processSteps: [
      "Envoyer l’enquête à chaud / à froid.",
      "Collecter aussi financeurs / entreprises si pertinent.",
      "Consolider les résultats pour le pilotage.",
    ],
    documentTitle: "Synthèse des appréciations",
    documentBody: `Appréciations — [Période]

Bénéficiaires · Financeurs · Entreprises
Points forts
Axes d’amélioration
Taux de réponse`,
  },
  31: {
    processTitle: "Traiter les réclamations",
    processSteps: [
      "Rendre le canal de réclamation accessible.",
      "Enregistrer, qualifier, traiter sous délai.",
      "Clôturer avec retour au demandeur et archivage.",
    ],
    documentTitle: "Fiche de traitement de réclamation",
    documentBody: `Réclamation — [Réf.]

Date · Canal · Demandeur
Faits
Analyse · Décision
Réponse · Clôture`,
  },
  32: {
    processTitle: "Piloter l’amélioration et les risques",
    processSteps: [
      "Analyser appréciations + réclamations + incidents.",
      "Décider d’actions correctives / préventives.",
      "Mettre à jour la cartographie des risques qualité.",
    ],
    documentTitle: "Plan d’amélioration & risques",
    documentBody: `Amélioration continue — [Trimestre]

Constat | Action | Pilote | Échéance
Risque qualité | Gravité | Maîtrise
Revue de direction`,
  },
};

export function getQualiopiIndicatorPlan(indicatorId: number): QualiopiIndicatorPlan | null {
  return QUALIOPI_INDICATOR_PLANS[indicatorId] ?? null;
}
