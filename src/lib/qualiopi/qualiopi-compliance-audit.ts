import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_RNQ_CRITERIA } from "@/lib/qualiopi/qualiopi-rnq-reference";
import {
  QUALIOPI_CORE_DOCS,
  buildSessionEvidence,
  type QualiopiAuditSignals,
} from "@/lib/qualiopi/qualiopi-compliance-signals";

export type QualiopiComplianceStatus = "validated" | "partial" | "missing";

export type QualiopiValidatedSource = "evidence" | "attestation";

export type QualiopiIndicatorCompliance = {
  indicatorId: number;
  status: QualiopiComplianceStatus;
  reason: string;
  nextStep?: string;
  validatedSource?: QualiopiValidatedSource;
  attestationNote?: string | null;
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
    coursesWithObjectives: number;
    approvedExperts: number;
    attestationsCount: number;
  };
};

type DraftRow = Omit<QualiopiIndicatorCompliance, "validatedSource" | "attestationNote">;

function row(
  id: number,
  status: QualiopiComplianceStatus,
  reason: string,
  nextStep?: string,
): DraftRow {
  return { indicatorId: id, status, reason, nextStep };
}

/** Audit produit + données CRM + attestations super-admin. */
export function assessQualiopiCompliance(input: {
  documents: QualiopiDocument[];
  sessions: QualiopiSession[];
  signals?: QualiopiAuditSignals;
}): QualiopiComplianceSnapshot {
  const signals: QualiopiAuditSignals = input.signals ?? {
    coursesWithObjectives: 0,
    approvedExperts: 0,
    attestations: [],
  };
  const ev = buildSessionEvidence(input);
  const attestationById = new Map(signals.attestations.map((a) => [a.indicatorId, a]));
  const hasCatalogObjectives = signals.coursesWithObjectives > 0;
  const hasExperts = signals.approvedExperts > 0;

  const drafts: DraftRow[] = [
    ev.coreUploaded === QUALIOPI_CORE_DOCS.length && ev.scheduledSessions >= 1
      ? row(
          1,
          "validated",
          `Coffre admin complet (${ev.coreUploaded}/${QUALIOPI_CORE_DOCS.length}) et ${ev.scheduledSessions} session(s) programmée(s) avec information catalogue.`,
        )
      : ev.coreUploaded === QUALIOPI_CORE_DOCS.length
        ? row(
            1,
            "partial",
            "Les 3 modèles admin sont déposés ; programmer au moins une session B2B datée.",
            "Pipeline B2B → programmer une formation.",
          )
        : row(
            1,
            "partial",
            `Fiches formation B2B OK ; coffre admin ${ev.coreUploaded}/${QUALIOPI_CORE_DOCS.length} modèles PDF.`,
            "Compléter convention, règlement et livret dans Super → Qualiopi → Coffre.",
          ),

    ev.sessionsWithFullSatisfaction >= 1 && ev.satisfactionResponses >= 3
      ? row(
          2,
          "validated",
          `${ev.satisfactionResponses} réponses satisfaction ; au moins une session avec collecte complète.`,
        )
      : ev.satisfactionResponses > 0
        ? row(
            2,
            "partial",
            `${ev.satisfactionResponses} réponse(s) satisfaction — indicateurs de résultats à consolider (taux, publication).`,
            "Clôturer une session et obtenir les questionnaires de tous les participants.",
          )
        : row(
            2,
            "missing",
            "Indicateurs de résultats (satisfaction, réussite) non alimentés.",
            "Envoyer les questionnaires fin de session ou attester une publication hors site.",
          ),

    row(
      3,
      "missing",
      "Pas de suivi RNCP / taux d’obtention certifications pro dans l’outil.",
      "Non applicable si vous ne délivrez pas de titres — sinon attester avec preuves.",
    ),

    hasCatalogObjectives
      ? row(
          4,
          "validated",
          `${signals.coursesWithObjectives} formation(s) catalogue avec objectifs pédagogiques renseignés.`,
        )
      : row(
          4,
          "partial",
          "Objectifs pédagogiques prévus sur le studio ; aucune formation avec ≥ 3 objectifs détectée.",
          "Super → Studio : compléter les objectifs sur chaque offre B2B.",
        ),

    ev.sessionsWithConventionSent >= 1 && ev.sessions.some((s) => (s.attendees?.length ?? 0) > 0)
      ? row(
          5,
          "validated",
          "Pack d’information envoyé et participants identifiés — adaptation traçable via dossier session / convention.",
        )
      : row(
          5,
          "partial",
          "Diagnostics Byound orientent le parcours ; trace « adaptation public » par session à consolider.",
          "Programmer une session, envoyer le pack admin et archiver le positionnement dans le deal.",
        ),

    ev.hasAnySession && ev.sessions.some((s) => (s.attendees?.length ?? 0) > 0)
      ? row(
          6,
          "validated",
          "Sessions CRM avec participants — besoins identifiés via pipeline et diagnostics associés au parcours.",
        )
      : row(
          6,
          "partial",
          "Positionnement via DISC / IDMC / soft skills ; lier explicitement au dossier Qualiopi du deal.",
          "Créer une session avec participants depuis un deal signé.",
        ),

    row(
      7,
      "missing",
      "Pas de contrôle d’adéquation RNCP/RS dans le produit.",
      "Attester si certifications délivrées (hors Byound).",
    ),

    hasCatalogObjectives
      ? row(
          8,
          "validated",
          "Modalités d’évaluation décrites via objectifs / parcours formation (quiz, badges, cas).",
        )
      : row(
          8,
          "partial",
          "Modalités d’évaluation sur les pages formation à aligner avec les grilles réelles.",
          "Compléter objectifs et évaluations sur les fiches catalogue.",
        ),

    ev.sessionsWithInfoPackSent >= 1
      ? row(
          9,
          "validated",
          `${ev.sessionsWithInfoPackSent} session(s) avec envoi convention + règlement + livret horodaté.`,
        )
      : ev.hasConvention
        ? row(
            9,
            "partial",
            "Modèle convention OK ; déclencher l’envoi automatique à la programmation / démarrage.",
            "Pipeline → démarrer la formation Qualiopi pour une session.",
          )
        : row(
            9,
            "missing",
            "Workflow d’information prévu, mais convention modèle absente.",
            "Déposer la convention type dans le coffre Qualiopi.",
          ),

    ev.sessionsWithLivretSent >= 1
      ? row(
          10,
          "validated",
          `${ev.sessionsWithLivretSent} session(s) avec livret d’accueil envoyé.`,
        )
      : ev.hasLivret
        ? row(
            10,
            "partial",
            "Livret modèle déposé ; envoi aux stagiaires à déclencher.",
            "Démarrer une session B2B pour envoyer le livret.",
          )
        : row(
            10,
            "missing",
            "Livret modèle non déposé.",
            "Uploader le livret d’accueil dans le coffre.",
          ),

    ev.sessions.some((s) => s.status === "in_progress" || s.status === "done")
      ? row(
          11,
          "validated",
          "Au moins une formation en cours ou terminée — suivi LMS / progression apprenant actif.",
        )
      : ev.hasAnySession
        ? row(
            11,
            "partial",
            "Session programmée ; démarrer la formation pour activer le suivi de progression.",
            "Passer la session en « en cours » depuis le pipeline.",
          )
        : row(
            11,
            "partial",
            "Suivi de progression apprenant disponible — aucune session exploitée.",
            "Programmer et démarrer une formation B2B.",
          ),

    row(
      12,
      "partial",
      "Objectif pro + Skills / badges ; pas de module « insertion » dédié.",
      "Attester l’accompagnement emploi si applicable.",
    ),

    ev.sessionsWithFullSignature >= 1
      ? row(
          13,
          "validated",
          `${ev.sessionsWithFullSignature} session(s) avec parcours individualisé (participants + émargement complet).`,
        )
      : row(
          13,
          "partial",
          "Parcours personnalisés (diagnostic, recommandations) ; preuve par stagiaire à archiver.",
          "Compléter émargements sur une session multi-participants.",
        ),

    hasCatalogObjectives
      ? row(
          14,
          "validated",
          "Ressources pédagogiques liées aux formations catalogue (studio / Learn).",
        )
      : row(
          14,
          "partial",
          "Ressources pédagogiques (Learn, studio) ; inventaire par formation à formaliser.",
          "Publier ou compléter le contenu des offres catalogue.",
        ),

    ev.sessionsWithFullSignature >= 1
      ? row(
          15,
          "validated",
          `${ev.sessionsWithFullSignature} session(s) avec émargement horodaté complet en base.`,
        )
      : ev.hasAnySession
        ? row(
            15,
            "partial",
            "Émargement horodaté disponible ; signatures incomplètes ou absentes.",
            "Faire signer tous les participants (lien émargement).",
          )
        : row(
            15,
            "partial",
            "Fonctionnalité émargement prête ; aucune session exploitée.",
            "Programmer une formation et envoyer les liens d’émargement.",
          ),

    ev.sessionsDoneFullySigned >= 1
      ? row(
          16,
          "validated",
          "Session terminée avec émargement complet — preuve de fin de prestation.",
        )
      : ev.sessionsWithFullSignature >= 1
        ? row(
            16,
            "partial",
            "Émargement complet ; clôturer la session (statut terminé) pour la preuve finale.",
            "Marquer la formation comme terminée dans le pipeline.",
          )
        : row(
            16,
            "partial",
            "Open Badges / évaluations possibles ; preuve de fin de prestation à uniformiser.",
            "Terminer une session avec émargement complet.",
          ),

    row(
      17,
      "partial",
      "Plateforme LMS + outils numériques ; locaux = hors produit.",
      "Attester les moyens matériels hors ligne si audit sur site.",
    ),

    ev.hasAnySession
      ? row(
          18,
          "validated",
          "CRM pipeline + sessions : coordination formateurs / experts traçable par intervention.",
        )
      : row(
          18,
          "partial",
          "CRM pipeline, formateurs / experts référencés ; matrice par intervention à formaliser.",
          "Créer une session liée à un deal B2B.",
        ),

    hasCatalogObjectives
      ? row(
          19,
          "validated",
          "Catalogue et ressources studio rattachés aux formations.",
        )
      : row(
          19,
          "partial",
          "Catalogue et supports ; liste des ressources par action à compléter.",
          "Compléter les formations catalogue.",
        ),

    row(
      20,
      "partial",
      "Module école handicap + référent sur fiches ; mobilité alternance hors produit.",
      "Attester process alternance / mobilité si applicable.",
    ),

    hasExperts && signals.approvedExperts >= 2
      ? row(
          21,
          "validated",
          `${signals.approvedExperts} expert(s) validés (review approuvé) — qualification des intervenants.`,
        )
      : hasExperts
        ? row(
            21,
            "partial",
            `${signals.approvedExperts} expert validé ; viser au moins 2 profils approuvés pour l’audit.`,
            "Super → valider les fiches experts actifs.",
          )
        : row(
            21,
            "partial",
            "Fiche expert avec validation prévue ; aucun expert approuvé en base.",
            "Approuver les intervenants dans l’espace experts.",
          ),

    row(
      22,
      "missing",
      "Pas de plan de développement des compétences internes dans l’outil.",
      "Attester avec document RH + preuves de formation des formateurs.",
    ),
    row(
      23,
      "missing",
      "Pas de module de veille réglementaire.",
      "Attester veille externe + registre.",
    ),
    row(
      24,
      "missing",
      "Pas de veille métiers/compétences structurée dans l’outil.",
      "Attester veille métier documentée.",
    ),
    row(
      25,
      "partial",
      "Innovations intégrées (IA, diagnostics) ; registre de veille pédagogique à documenter.",
      "Attester veille pédagogique annuelle.",
    ),
    row(
      26,
      "partial",
      "Parcours référent handicap + contact sur fiches ; partenariats à lister.",
      "Attester partenariats handicap dans le dossier qualité.",
    ),
    row(
      27,
      "missing",
      "Pas de gestion sous-traitants Qualiopi.",
      "Attester contrats sous-traitants si concerné.",
    ),
    row(
      28,
      "missing",
      "Alternance marketing / contenu ; pas de cockpit CFA–entreprise complet.",
      "Attester process alternance hors Byound.",
    ),
    row(
      29,
      "partial",
      "Pages alternance / CFA 2027 ; pilotage promotion alternance à documenter.",
      "Attester plan promotion alternance.",
    ),

    ev.sessionsWithFullSatisfaction >= 1
      ? row(
          30,
          "validated",
          `${ev.sessionsWithFullSatisfaction} session(s) avec satisfaction complète de tous les participants.`,
        )
      : ev.satisfactionResponses > 0
        ? row(
            30,
            "partial",
            `${ev.satisfactionResponses} réponse(s) satisfaction — collecter tous les retours sur une session.`,
            "Relancer les questionnaires satisfaction manquants.",
          )
        : row(
            30,
            "partial",
            "Questionnaire satisfaction disponible ; peu ou pas de retours en base.",
            "Clôturer une session et collecter les questionnaires.",
          ),

    row(
      31,
      "missing",
      "Pas de workflow réclamations formation dédié.",
      "Attester procédure réclamations + registre.",
    ),
    row(
      32,
      "missing",
      "Pas de boucle d’actions correctives liée aux enquêtes.",
      "Attester comité qualité + plan d’actions.",
    ),
  ];

  const indicators: QualiopiIndicatorCompliance[] = drafts.map((d) => {
    const att = attestationById.get(d.indicatorId);
    if (att) {
      return {
        ...d,
        status: "validated",
        reason: d.reason,
        validatedSource: "attestation",
        attestationNote: att.note,
        nextStep: undefined,
      };
    }
    if (d.status === "validated") {
      return { ...d, validatedSource: "evidence" };
    }
    return { ...d };
  });

  const validated = indicators.filter((r) => r.status === "validated").length;
  const partial = indicators.filter((r) => r.status === "partial").length;
  const missing = indicators.filter((r) => r.status === "missing").length;
  const total = indicators.length;
  const readinessPercent = Math.round(((validated + partial * 0.5) / total) * 100);

  return {
    indicators,
    summary: { validated, partial, missing, total, readinessPercent },
    runtime: {
      coreDocsUploaded: ev.coreUploaded,
      coreDocsTotal: QUALIOPI_CORE_DOCS.length,
      sessionsTotal: ev.sessionsTotal,
      sessionsWithSignedAttendance: ev.sessionsWithFullSignature,
      satisfactionResponses: ev.satisfactionResponses,
      coursesWithObjectives: signals.coursesWithObjectives,
      approvedExperts: signals.approvedExperts,
      attestationsCount: signals.attestations.length,
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
