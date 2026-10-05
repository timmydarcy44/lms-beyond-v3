import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_RNQ_CRITERIA } from "@/lib/qualiopi/qualiopi-rnq-reference";

export type QualiopiComplianceStatus = "validated" | "partial" | "missing";

export type QualiopiIndicatorCompliance = {
  indicatorId: number;
  status: QualiopiComplianceStatus;
  reason: string;
  nextStep?: string;
};

export type QualiopiComplianceSnapshot = {
  indicators: QualiopiIndicatorCompliance[];
  summary: {
    validated: number;
    partial: number;
    missing: number;
    total: number;
    readinessPercent: number;
  };
  runtime: {
    coreDocsUploaded: number;
    coreDocsTotal: number;
    sessionsTotal: number;
    sessionsWithSignedAttendance: number;
    satisfactionResponses: number;
  };
};

function docUploaded(docs: QualiopiDocument[], kind: string) {
  return docs.some((d) => d.kind === kind && Boolean(d.file_url) && !d.session_id);
}

function countSignedSessions(sessions: QualiopiSession[]) {
  let withSign = 0;
  for (const s of sessions) {
    const attendees = s.attendees ?? [];
    if (attendees.length > 0 && attendees.every((a) => a.signed_at)) withSign += 1;
  }
  return withSign;
}

function countSatisfactionResponses(sessions: QualiopiSession[]) {
  let n = 0;
  for (const s of sessions) {
    for (const a of s.attendees ?? []) {
      if (a.satisfaction_at || a.satisfaction_score != null) n += 1;
    }
  }
  return n;
}

/** Audit produit + données CRM (documents / sessions). */
export function assessQualiopiCompliance(input: {
  documents: QualiopiDocument[];
  sessions: QualiopiSession[];
}): QualiopiComplianceSnapshot {
  const templates = input.documents.filter((d) => !d.session_id);
  const hasConvention = docUploaded(templates, "convention");
  const hasReglement = docUploaded(templates, "reglement");
  const hasLivret = docUploaded(templates, "livret");
  const coreUploaded = [hasConvention, hasReglement, hasLivret].filter(Boolean).length;
  const signedSessions = countSignedSessions(input.sessions);
  const satisfactionResponses = countSatisfactionResponses(input.sessions);
  const hasAnySession = input.sessions.length > 0;

  const status = (
    id: number,
    s: QualiopiComplianceStatus,
    reason: string,
    nextStep?: string,
  ): QualiopiIndicatorCompliance => ({ indicatorId: id, status: s, reason, nextStep });

  const rows: QualiopiIndicatorCompliance[] = [
    status(
      1,
      coreUploaded === QUALIOPI_CORE_DOCS.length ? "partial" : "partial",
      coreUploaded === QUALIOPI_CORE_DOCS.length
        ? "Fiches formation B2B + les 3 modèles admin déposés (information publique + dossier type)."
        : `Fiches formation B2B OK ; coffre admin ${coreUploaded}/${QUALIOPI_CORE_DOCS.length} modèles PDF.`,
      coreUploaded < QUALIOPI_CORE_DOCS.length
        ? "Compléter convention, règlement et livret dans Super → Qualiopi → Coffre."
        : undefined,
    ),
    status(
      2,
      "missing",
      "Indicateurs de résultats (satisfaction, réussite, complétion) non publiés — placeholder Qualiopi sur le site.",
      "Alimenter les stats réelles ou documenter la méthode de calcul hors plateforme.",
    ),
    status(3, "missing", "Pas de suivi RNCP / taux d’obtention certifications pro dans l’outil.", "Process + preuves si vous certifiez des titres."),
    status(
      4,
      "partial",
      "Objectifs pédagogiques générés sur les fiches formation (studio / CMS).",
      "Vérifier que chaque formation catalogue a des objectifs opérationnels à jour.",
    ),
    status(5, "partial", "Diagnostics EDGE orientent le parcours ; pas de trace audit « adaptation public » par session.", "Documenter l’adaptation dans le dossier client / convention."),
    status(
      6,
      "partial",
      "Positionnement via DISC / IDMC / soft skills et matching métier.",
      "Archiver les résultats diagnostic dans le dossier Qualiopi du deal.",
    ),
    status(7, "missing", "Pas de contrôle d’adéquation RNCP/RS dans le produit.", "Preuve manuelle si certifications délivrées."),
    status(
      8,
      "partial",
      "Modalités d’évaluation décrites sur les pages formation (quiz, cas, badge).",
      "Aligner avec les grilles réelles utilisées en session.",
    ),
    status(
      9,
      hasConvention ? "partial" : "missing",
      hasConvention
        ? "Envoi automatique du pack convention / règlement / livret à la programmation."
        : "Workflow d’information prévu, mais convention modèle absente.",
      !hasConvention ? "Déposer la convention type dans le coffre Qualiopi." : undefined,
    ),
    status(
      10,
      hasLivret ? "partial" : "missing",
      hasLivret ? "Livret d’accueil modèle + mention accueil sur fiches formation." : "Livret modèle non déposé.",
      !hasLivret ? "Uploader le livret d’accueil." : undefined,
    ),
    status(
      11,
      "partial",
      "Suivi de progression apprenant (LMS, % complétion, tests) — côté école / apprenant.",
      "Exporter ou capturer les relevés pour le dossier audit.",
    ),
    status(12, "partial", "Objectif pro + Skills / badges ; pas de module « insertion » dédié.", "Tracer l’accompagnement emploi/certif dans le CRM si applicable."),
    status(13, "partial", "Parcours personnalisés (diagnostic, recommandations formation).", "Preuve d’individualisation par stagiaire à archiver."),
    status(14, "partial", "Ressources pédagogiques (Learn, contenus studio, NEVO).", "Inventaire des ressources par formation."),
    status(
      15,
      signedSessions > 0 ? "validated" : hasAnySession ? "partial" : "partial",
      signedSessions > 0
        ? `${signedSessions} session(s) avec émargement complet en base.`
        : hasAnySession
          ? "Émargement horodaté disponible ; signatures incomplètes ou absentes."
          : "Fonctionnalité émargement prête ; aucune session exploitée en prod.",
      signedSessions === 0 ? "Programmer une formation et faire signer tous les participants." : undefined,
    ),
    status(
      16,
      "partial",
      "Open Badges et évaluations finales possibles ; pas de grille unique « fin de prestation » pour toutes les offres.",
      "Uniformiser la preuve d’évaluation finale par parcours.",
    ),
    status(17, "partial", "Plateforme LMS + outils numériques ; locaux = hors produit.", "Documenter les moyens matériels hors ligne."),
    status(18, "partial", "CRM pipeline, formateurs / experts / validateurs référencés.", "Matrice de coordination par intervention à formaliser."),
    status(19, "partial", "Catalogue, ressources studio, supports formation.", "Liste des ressources par action de formation."),
    status(
      20,
      "partial",
      "Module école handicap + référent handicap sur fiches formation ; pas de suivi mobilité apprentissage.",
      "Compléter par process alternance / mobilité si critère applicable.",
    ),
    status(
      21,
      "partial",
      "Fiche expert avec validation (`review_status`), certifications affichables.",
      "Vérifier CV / diplômes à jour pour chaque intervenant actif.",
    ),
    status(22, "missing", "Pas de plan de développement des compétences internes dans l’outil.", "Document RH + preuves de formation des formateurs."),
    status(23, "missing", "Pas de module de veille réglementaire.", "Veille externe + registre de preuves."),
    status(24, "missing", "Pas de veille métiers/compétences structurée dans l’outil.", "Veille métier documentée hors LMS."),
    status(25, "partial", "Innovations intégrées (IA, diagnostics) ; pas de registre de veille pédagogique.", "Documenter veille pédagogique annuelle."),
    status(26, "partial", "Parcours référent handicap + contact dédié sur fiches formation.", "Partenariages handicap à lister dans le dossier qualité."),
    status(27, "missing", "Pas de gestion sous-traitants Qualiopi.", "Contrats + audit sous-traitants si concerné."),
    status(28, "missing", "Alternance marketing / contenu ; pas de cockpit CFA–entreprise–apprenti.", "Process alternance hors ou partiellement hors Byound."),
    status(29, "partial", "Pages alternance / CFA 2027 ; pas de pilotage promotion alternance.", "Plan promotion alternance documenté."),
    status(
      30,
      satisfactionResponses > 0 ? "partial" : "partial",
      satisfactionResponses > 0
        ? `${satisfactionResponses} réponse(s) satisfaction enregistrée(s) via sessions CRM.`
        : "Questionnaire satisfaction envoyé en fin de session ; peu ou pas de retours en base.",
      satisfactionResponses === 0 ? "Clôturer une session et collecter les questionnaires." : undefined,
    ),
    status(31, "missing", "Pas de workflow réclamations formation dédié (hors mentions RGPD entreprise).", "Procédure réclamations + registre."),
    status(32, "missing", "Pas de boucle d’actions correctives liée aux satisfaction / réclamations.", "Comité qualité + plan d’actions après enquêtes."),
  ];

  const validated = rows.filter((r) => r.status === "validated").length;
  const partial = rows.filter((r) => r.status === "partial").length;
  const missing = rows.filter((r) => r.status === "missing").length;
  const total = rows.length;
  const readinessPercent = Math.round(((validated + partial * 0.5) / total) * 100);

  return {
    indicators: rows,
    summary: { validated, partial, missing, total, readinessPercent },
    runtime: {
      coreDocsUploaded: coreUploaded,
      coreDocsTotal: QUALIOPI_CORE_DOCS.length,
      sessionsTotal: input.sessions.length,
      sessionsWithSignedAttendance: signedSessions,
      satisfactionResponses,
    },
  };
}

export function complianceByIndicatorId(snapshot: QualiopiComplianceSnapshot) {
  return new Map(snapshot.indicators.map((i) => [i.indicatorId, i]));
}

export function mergeComplianceIntoCriteria(snapshot: QualiopiComplianceSnapshot) {
  const byId = complianceByIndicatorId(snapshot);
  return QUALIOPI_RNQ_CRITERIA.map((c) => ({
    ...c,
    indicators: c.indicators.map((ind) => ({
      ...ind,
      compliance: byId.get(ind.id),
    })),
  }));
}
