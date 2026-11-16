import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_RNQ_CRITERIA } from "@/lib/qualiopi/qualiopi-rnq-reference";
import { QUALIOPI_OF_NA_IDS, qualiopiOfNaNote } from "@/lib/qualiopi/qualiopi-of-b2b";
import {
  QUALIOPI_CORE_DOCS,
  buildSessionEvidence,
  type QualiopiAuditSignals,
} from "@/lib/qualiopi/qualiopi-compliance-signals";

export type QualiopiComplianceStatus =
  | "validated"
  | "partial"
  | "missing"
  | "not_applicable";

export type QualiopiValidatedSource = "evidence" | "attestation";

export type QualiopiIndicatorCompliance = {
  indicatorId: number;
  status: QualiopiComplianceStatus;
  reason: string;
  nextStep?: string;
  validatedSource?: QualiopiValidatedSource;
  attestationNote?: string | null;
  /** Justification N/A (défaut OF B2B ou note d’attestation). */
  naJustification?: string | null;
};

export type QualiopiComplianceSnapshot = {
  indicators: QualiopiIndicatorCompliance[];
  summary: {
    validated: number;
    partial: number;
    missing: number;
    notApplicable: number;
    /** Indicateurs applicables (= total − N/A). */
    applicable: number;
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

type DraftRow = Omit<
  QualiopiIndicatorCompliance,
  "validatedSource" | "attestationNote" | "naJustification"
>;

function row(
  id: number,
  status: QualiopiComplianceStatus,
  reason: string,
  nextStep?: string,
): DraftRow {
  return { indicatorId: id, status, reason, nextStep };
}

function naDraft(id: number): DraftRow {
  const note = qualiopiOfNaNote(id) ?? "N/A OF B2B.";
  return row(id, "not_applicable", note);
}

/** Audit produit + données CRM + attestations super-admin (RNQ V10 / 33 ind.). */
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
  const handicapReady =
    Boolean(signals.processDocsReady?.handicap) ||
    (signals.handicapProfilesCount ?? 0) >= 1 ||
    (signals.handicapDocsCount ?? 0) >= 1;

  const drafts: DraftRow[] = [
    // —— Critère 1 ——
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

    naDraft(3),

    // —— Critère 2 (libellés V10 corrigés) ——
    ev.hasAnySession && ev.sessions.some((s) => (s.attendees?.length ?? 0) > 0)
      ? row(
          4,
          "validated",
          "Sessions CRM avec participants — analyse du besoin traçable via pipeline / deal / diagnostics associés.",
        )
      : row(
          4,
          "partial",
          "Positionnement via diagnostics Byound ; lier explicitement l’analyse de besoin au dossier session.",
          "Créer une session avec participants depuis un deal signé.",
        ),

    hasCatalogObjectives
      ? row(
          5,
          "validated",
          `${signals.coursesWithObjectives} formation(s) catalogue avec objectifs pédagogiques opérationnels renseignés.`,
        )
      : row(
          5,
          "partial",
          "Objectifs pédagogiques prévus sur le studio ; aucune formation avec ≥ 3 objectifs détectée.",
          "Super → Studio / Catalogue : compléter les objectifs sur chaque offre B2B.",
        ),

    hasCatalogObjectives && ev.hasAnySession
      ? row(
          6,
          "validated",
          "Contenus catalogue + modalités de mise en œuvre tracées via sessions CRM.",
        )
      : hasCatalogObjectives
        ? row(
            6,
            "partial",
            "Contenus catalogue renseignés ; programmer une session pour prouver les modalités.",
            "Pipeline B2B → programmer une formation.",
          )
        : row(
            6,
            "partial",
            "Contenus et modalités à aligner sur les objectifs et publics (fiches catalogue).",
            "Compléter les fiches formation catalogue.",
          ),

    naDraft(7),

    hasCatalogObjectives ||
    ev.sessions.some((s) => (s.attendees?.length ?? 0) > 0)
      ? row(
          8,
          "validated",
          "Procédures de positionnement / évaluation à l’entrée tracées (diagnostics, objectifs, participants).",
        )
      : row(
          8,
          "partial",
          "Positionnement prévu (diagnostics Byound) ; formaliser la procédure d’entrée sur une session.",
          "Lier un diagnostic / positionnement à une session B2B.",
        ),

    // —— Critère 3 ——
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

    ev.sessionsWithLivretSent >= 1 && handicapReady
      ? row(
          10,
          "validated",
          `Livret d’accueil envoyé + preuves handicap (process / fiches / documents) — adaptation aux publics.`,
        )
      : ev.sessionsWithLivretSent >= 1 || handicapReady || ev.hasLivret
        ? row(
            10,
            "partial",
            handicapReady
              ? "Preuves handicap en place ; finaliser l’envoi du livret d’accueil sur une session."
              : "Accueil / livret partiel — compléter process handicap et envoi livret.",
            "Qualiopi → Handicap + démarrer une session pour envoyer le livret.",
          )
        : row(
            10,
            "missing",
            "Pas de livret envoyé ni de preuves d’adaptation / handicap.",
            "Uploader le livret + renseigner le module Handicap.",
          ),

    ev.sessionsDoneFullySigned >= 1
      ? row(
          11,
          "validated",
          "Session terminée avec émargement complet — évaluation de l’atteinte des objectifs traçable.",
        )
      : ev.sessions.some((s) => s.status === "in_progress" || s.status === "done")
        ? row(
            11,
            "partial",
            "Formation en cours / terminée ; clôturer avec émargement complet pour la preuve d’évaluation.",
            "Compléter évaluations / émargements puis clôturer la session.",
          )
        : row(
            11,
            "partial",
            "Évaluation des acquis prévue (quiz, badges) ; aucune session exploitée.",
            "Programmer et clôturer une formation B2B.",
          ),

    (() => {
      const signalementsOk =
        Boolean(signals.signalementsProcessReady) ||
        Boolean(signals.processDocsReady?.signalements);
      const exits = signals.exitsCount ?? 0;
      if (signalementsOk) {
        return row(
          12,
          "validated",
          `Engagement / prévention ruptures + procédure signalements VHD en place${
            exits > 0 ? ` · ${exits} sortie(s) tracée(s)` : ""
          }${
            (signals.signalementsCount ?? 0) > 0
              ? ` · ${signals.signalementsCount} signalement(s)`
              : ""
          }.`,
        );
      }
      if (exits >= 1) {
        return row(
          12,
          "partial",
          `${exits} sortie(s) tracée(s) — activer la procédure signalements VHD.`,
          "Qualiopi → Qualité → Signalements + Process docs.",
        );
      }
      return row(
        12,
        "missing",
        "Pas de procédure engagement / signalements violences-harcèlement-discriminations.",
        "Qualiopi → Qualité → Signalements + Process docs.",
      );
    })(),

    row(
      13,
      "partial",
      "CFA — coordination alternance centre / entreprise : preuves à formaliser.",
      "Dépôt manuel indicateur 13.",
    ),
    row(
      14,
      "partial",
      "CFA — accompagnement socio-professionnel : preuves à formaliser.",
      "Dépôt manuel indicateur 14.",
    ),
    row(
      15,
      "partial",
      "CFA — droits et devoirs des apprentis : preuves à formaliser.",
      "Dépôt manuel indicateur 15.",
    ),
    naDraft(16),

    // —— Critère 4 ——
    signals.processDocsReady?.moyens
      ? row(17, "validated", "Note moyens matériels / locaux documentée.")
      : row(
          17,
          "partial",
          "Plateforme LMS + outils numériques ; locaux = hors produit.",
          "Process docs → Moyens, ou attestation.",
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

    (signals.lmsEnrollmentsCount ?? 0) >= 1 && hasCatalogObjectives
      ? row(
          19,
          "validated",
          `Ressources catalogue + suivi distanciel LMS (${signals.lmsEnrollmentsCount} inscription(s)${
            (signals.pedagogicalReferentsCount ?? 0) >= 1
              ? ` · ${signals.pedagogicalReferentsCount} référent(s) pédagogique(s)`
              : ""
          }).`,
        )
      : hasCatalogObjectives || (signals.lmsEnrollmentsCount ?? 0) >= 1
        ? row(
            19,
            "partial",
            hasCatalogObjectives
              ? "Ressources catalogue OK — lier au moins une inscription LMS pour le suivi distanciel."
              : "Suivi LMS partiel — compléter les ressources catalogue.",
            "Dossier formation → Suivi LMS / référent pédagogique.",
          )
        : row(
            19,
            "partial",
            "Ressources et suivi distanciel à formaliser (catalogue + enrollments LMS).",
            "Compléter le catalogue et activer le suivi LMS sur un dossier.",
          ),

    row(
      20,
      "partial",
      "CFA — mobilité, référent handicap, conseil de perfectionnement : preuves à formaliser.",
      "Dépôt manuel indicateur 20.",
    ),

    // —— Critère 5 ——
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

    (signals.formateurPlansCount ?? 0) >= 1 && (signals.formateurActionsDoneCount ?? 0) >= 1
      ? row(
          22,
          "validated",
          `${signals.formateurPlansCount} plan(s) formateur et ${signals.formateurActionsDoneCount} action(s) réalisée(s).`,
        )
      : signals.processDocsReady?.formateurs
        ? row(
            22,
            "partial",
            "Procédure compétences formateurs rédigée ; enregistrer un plan + une action réalisée.",
            "Qualiopi → Formateurs : créer un plan et marquer une action faite.",
          )
        : row(
            22,
            "missing",
            "Pas de plan de développement des compétences dans l’outil.",
            "Rédiger le process Formateurs puis saisir un plan expert.",
          ),

    // —— Critère 6 ——
    (signals.veille?.reglementaireDone ?? 0) >= 1
      ? row(23, "validated", "Au moins une info réglementaire surlignée et traitée (90 j).")
      : (signals.veille?.anySaved ?? 0) >= 1
        ? row(
            23,
            "partial",
            "Veille active ; passer au moins un highlight réglementaire en « Traité ».",
            "Veilles → surligner une actu réglementaire → statut Traité.",
          )
        : row(
            23,
            "partial",
            "Veille fusionnée (RAG 1/2) prête — aucune info encore exploitée.",
            "Générer la veille et surligner une info réglementaire.",
          ),

    (signals.veille?.metierDone ?? 0) >= 1
      ? row(24, "validated", "Au moins une info métier surlignée et traitée (90 j).")
      : (signals.veille?.anySaved ?? 0) >= 1
        ? row(
            24,
            "partial",
            "Veille active ; traiter un highlight métier.",
            "Veilles → highlight métier → Traité.",
          )
        : row(
            24,
            "partial",
            "Veille métier incluse dans la synthèse globale — à exploiter.",
            "Surligner une info métier.",
          ),

    (signals.veille?.pedagogieDone ?? 0) >= 1
      ? row(25, "validated", "Au moins une info pédagogie surlignée et traitée (90 j).")
      : (signals.veille?.anySaved ?? 0) >= 1
        ? row(
            25,
            "partial",
            "Veille active ; traiter un highlight pédagogie.",
            "Veilles → highlight pédagogie → Traité.",
          )
        : row(
            25,
            "partial",
            "Veille pédagogie incluse dans la synthèse globale — à exploiter.",
            "Surligner une info pédagogie.",
          ),

    handicapReady
      ? row(
          26,
          "validated",
          signals.processDocsReady?.handicap
            ? `Note handicap / partenariats documentée${
                (signals.handicapProfilesCount ?? 0) > 0
                  ? ` · ${signals.handicapProfilesCount} fiche(s) PSH`
                  : ""
              }.`
            : `${signals.handicapProfilesCount ?? 0} fiche(s) PSH / documents — formaliser aussi la note process.`,
        )
      : row(
          26,
          "partial",
          "Référent handicap sur fiches ; formaliser partenariats et preuves d’accueil.",
          "Qualiopi → Handicap + Process docs → Handicap.",
        ),

    (signals.subcontractReadyCount ?? 0) >= 1 ||
    (signals.subcontractExpertsCount ?? 0) >= 1
      ? row(
          27,
          (signals.subcontractReadyCount ?? 0) >= 1 ? "validated" : "partial",
          (signals.subcontractReadyCount ?? 0) >= 1
            ? `Sous-traitance cadrée — ${signals.subcontractReadyCount} intervenant(s) conforme(s) (statut + contrat / salarié).`
            : `${signals.subcontractExpertsCount} expert(s) avec statut d'emploi — compléter contrats SST si indépendant/portage.`,
        )
      : row(
          27,
          "missing",
          "Pas de statut d'emploi / contrats de sous-traitance renseignés.",
          "Qualiopi → Formateurs : renseigner salarié / indépendant / portage + contrats.",
        ),

    naDraft(28),
    // Ind. 29 : applicable si CFA (profil) — scorer legacy : partiel en attendant preuves CFA
    row(
      29,
      "partial",
      "CFA — insertion / poursuite d’études : preuves à formaliser (taux, actions).",
      "Dépôt manuel ou module CFA.",
    ),

    // —— Critère 7 ——
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

    (() => {
      const st = signals.reclamationsIndicatorStatus;
      if (st === "proven") {
        return row(31, "validated", signals.reclamationsProofLabel || "Registre réclamations conforme (12 mois).");
      }
      if (st === "todo") {
        return row(
          31,
          "partial",
          signals.reclamationsProofLabel || "Réclamation ouverte en retard ou close sans réponse.",
          "Qualiopi → Qualité : traiter les réclamations en retard / sans réponse.",
        );
      }
      if (st === "missing") {
        return row(
          31,
          "missing",
          "Pas de workflow réclamations formation dédié.",
          "Qualiopi → Qualité : activer la procédure et le registre.",
        );
      }
      return signals.reclamationsProcessReady || signals.processDocsReady?.reclamations
        ? row(
            31,
            "validated",
            signals.reclamationsCount
              ? `Procédure réclamations active — ${signals.reclamationsCount} ticket(s) au registre.`
              : "Procédure / registre réclamations en place (registre prêt, 0 ticket OK).",
          )
        : row(
            31,
            "missing",
            "Pas de workflow réclamations formation dédié.",
            "Qualiopi → Qualité : activer la procédure et le registre.",
          );
    })(),

    (() => {
      const st = signals.ameliorationIndicatorStatus;
      if (st === "proven") {
        return row(32, "validated", signals.ameliorationProofLabel || "PAQ et revue qualité datée.");
      }
      if (st === "todo") {
        return row(
          32,
          "partial",
          signals.ameliorationProofLabel || "Actions ou revue qualité incomplets.",
          "Qualiopi → Qualité : clôturer une action PAQ et enregistrer une revue.",
        );
      }
      if (st === "missing") {
        return row(
          32,
          "missing",
          "Pas de registre des risques ni de boucle d’actions correctives.",
          "Qualiopi → Risques : créer le registre, ou Qualité → action PAQ.",
        );
      }
      return signals.actionsReviewed ||
        (signals.actionsDoneCount ?? 0) >= 1 ||
        signals.processDocsReady?.paq ||
        (signals.risksCount ?? 0) >= 1
        ? row(
            32,
            "validated",
            (signals.risksCount ?? 0) >= 1
              ? `Registre des risques actif (${signals.risksCount} risque(s)${
                  (signals.risksOpenCount ?? 0) > 0
                    ? `, ${signals.risksOpenCount} ouvert(s)`
                    : ""
                })${
                  (signals.actionsDoneCount ?? 0) >= 1
                    ? ` · ${signals.actionsDoneCount} action(s) PAQ clôturée(s)`
                    : ""
                }.`
              : (signals.actionsDoneCount ?? 0) >= 1
                ? `Plan d’actions qualité avec ${signals.actionsDoneCount} action(s) clôturée(s) / revue.`
                : "Comité / plan d’actions documenté.",
          )
        : row(
            32,
            "missing",
            "Pas de registre des risques ni de boucle d’actions correctives.",
            "Qualiopi → Risques : créer le registre, ou Qualité → action PAQ.",
          );
    })(),

  ];

  // Garde-fou : tout id N/A OF doit rester not_applicable même si draft divergé.
  const draftsNormalized = drafts.map((d) =>
    QUALIOPI_OF_NA_IDS.has(d.indicatorId) ? { ...d, status: "not_applicable" as const } : d,
  );

  const indicators: QualiopiIndicatorCompliance[] = draftsNormalized.map((d) => {
    const att = attestationById.get(d.indicatorId);
    const isNa = QUALIOPI_OF_NA_IDS.has(d.indicatorId) || att?.kind === "na";

    if (isNa) {
      const justification =
        (att?.kind === "na" ? att.note : null) ||
        qualiopiOfNaNote(d.indicatorId) ||
        att?.note ||
        d.reason;
      return {
        ...d,
        status: "not_applicable",
        reason: justification,
        naJustification: justification,
        validatedSource: att ? "attestation" : undefined,
        attestationNote: att?.note ?? null,
        nextStep: undefined,
      };
    }

    if (att && att.kind !== "na") {
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
      return { ...d, validatedSource: "evidence" as const };
    }
    return { ...d };
  });

  const validated = indicators.filter((r) => r.status === "validated").length;
  const partial = indicators.filter((r) => r.status === "partial").length;
  const missing = indicators.filter((r) => r.status === "missing").length;
  const notApplicable = indicators.filter((r) => r.status === "not_applicable").length;
  const total = indicators.length;
  const applicable = Math.max(1, total - notApplicable);
  const readinessPercent = Math.round(((validated + partial * 0.5) / applicable) * 100);

  return {
    indicators,
    summary: {
      validated,
      partial,
      missing,
      notApplicable,
      applicable,
      total,
      readinessPercent,
    },
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
