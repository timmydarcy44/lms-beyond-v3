import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import {
  DEFAULT_QUALIOPI_ACTIVITIES,
  isIndicatorApplicable,
  parseActivityProfile,
  type QualiopiActivityProfile,
} from "@/lib/qualiopi/activity-profile";
import { QUALIOPI_AUDIT_PROOF_RECAP } from "@/lib/qualiopi/audit-proof-recap";
import { getCoffreAdminStatus } from "@/lib/qualiopi/coffre-admin";
import { QUALIOPI_INDICATORS } from "@/lib/qualiopi/indicators";
import type {
  QualiopiIndicatorStatus,
  QualiopiProofRef,
  QualiopiStatusSnapshot,
  QualiopiUiStatus,
} from "@/lib/qualiopi/status-types";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { TRAINING_FORMATION_BASE_PATH } from "@/lib/training-courses/types";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/** Specimens PDF audit (public/qualiopi). */
const QUALIOPI_SPECIMEN = {
  harcelementPrevention: "/qualiopi/Byound_Business_Harcelement_Fiche_Prevention.pdf",
  conventionExemple: "/qualiopi/Convention_exemple_Byound.pdf",
} as const;

/** Fiche publique catalogue (preuve ind. 1 / 2 / 5…). */
function publicFormationHref(slug: string | null | undefined, hash?: string): string | null {
  const s = String(slug ?? "").trim();
  if (!s) return null;
  const path = `${TRAINING_FORMATION_BASE_PATH}/${encodeURIComponent(s)}`;
  const base = `${BYOUND_PUBLIC_ORIGIN}${path}`;
  return hash ? `${base}#${hash}` : base;
}

export type QualiopiManualProof = {
  indicatorId: number;
  label: string;
  comment: string | null;
  fileUrl: string | null;
  proofAt: string;
  updatedAt: string;
};

export type QualiopiNaAttestation = {
  indicatorId: number;
  note: string | null;
};

export type QualiopiStatusSignals = {
  coursesPublicWithInfo: number;
  coursesPublicTotal: number;
  /** Fiches publiées conformes Lot 1 (Preuves catalogue). */
  coursesCompliantCount: number;
  coursesWithResults: number;
  coursesWithObjectives: number;
  /** Sessions/dossiers avec pack info envoyé (convention + règlement + livret/convocation). */
  infoPackCompleteCount: number;
  /** Au moins un document d’information envoyé (convention / règlement / livret / convocation). */
  infoPackPartialCount: number;
  /** Réponses complétées éval à chaud / à froid. */
  evalChaudCompleted: number;
  evalFroidCompleted: number;
  /** Gabarits éval à chaud / à froid présents. */
  evalTemplatesReady: boolean;
  approvedExperts: number;
  formateurPlansCount: number;
  formateurActionsDoneCount: number;
  veilleReglementaireDone: number;
  veilleMetierDone: number;
  veillePedagogieDone: number;
  veilleToReadThisMonth: number;
  /** Digests générés (veille auto) sur 90 j. */
  veilleDigestCount: number;
  veilleAnySaved: number;
  veilleAnyDone: number;
  reclamationsProcessReady: boolean;
  reclamationsOpenCount: number;
  /** Ind. 31 brief — hors is_test, 12 mois. */
  reclamationsTreatedCount?: number;
  reclamationsAvgReplyLabel?: string | null;
  reclamationsIndicatorStatus?: "proven" | "todo" | "missing";
  reclamationsProofLabel?: string | null;
  signalementsProcessReady: boolean;
  exitsCount: number;
  risksCount: number;
  actionsDoneCount: number;
  /** Ind. 32 brief. */
  actionsDoneLast12Count?: number;
  lastQualityReviewAt?: string | null;
  ameliorationIndicatorStatus?: "proven" | "todo" | "missing";
  ameliorationProofLabel?: string | null;
  subcontractReadyCount: number;
  handicapProfilesCount: number;
  handicapProcessReady: boolean;
  lmsEnrollmentsCount: number;
  pedagogicalReferentsCount: number;
  meansProcessReady: boolean;
  /**
   * Exemple de fiche publique (slug) pour deep-link « Voir la preuve »
   * → /business/formations/{slug} sur le site public.
   */
  examplePublicFormationSlug: string | null;
  /** Formation CMS (id) pour ouvrir `/super/formations?edit=…` — ind. 11. */
  exampleTrainingCourseId?: string | null;
  /**
   * Exemple de convocation (URL publique /doc?token=…) — ind. 9.
   * Complète le pack information : une preuve concrète remise au stagiaire.
   */
  exampleConvocationHref?: string | null;
  /** Horodatage d’envoi de la convocation exemple. */
  exampleConvocationSentAt?: string | null;
  /** Fiche expert preuve compétences (ex. Jérôme Picot) — ind. 21. */
  exampleExpertHref?: string | null;
  /** Onglet bilans de l’expert preuve — ind. 21. */
  exampleExpertBilansHref?: string | null;
  /** Analyses du besoin complètes (compte client) — ind. 4. */
  needAnalysesCompleteCount?: number;
  /** Exemple d’org avec analyse complète pour deep-link preuve. */
  exampleNeedAnalysisOrgId?: string | null;
  /** Procédures qualité validées (preuves PDF). */
  validatedProcedures?: Array<{
    id: string;
    title: string;
    current_version: string;
    validated_at: string | null;
    indicators: number[] | null;
  }>;
  procedureReviewOverdue?: boolean;
};

function stale(iso: string | null | undefined): boolean {
  if (!iso) return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > TWELVE_MONTHS_MS;
}

function proof(
  label: string,
  href: string | null,
  updatedAt: string | null = null,
  counter: string | null = null,
): QualiopiProofRef {
  return { label, href, updatedAt, counter };
}

function helpFor(id: number): { where: string | null; how: string | null } {
  const row = QUALIOPI_AUDIT_PROOF_RECAP.find((r) => r.indicatorId === id);
  return { where: row?.where ?? null, how: row?.how ?? null };
}

function sessionComplete(s: QualiopiSession): boolean {
  const attendees = s.attendees ?? [];
  if (!attendees.length) return false;
  return attendees.every((a) => Boolean(a.signed_at));
}

type Draft = {
  status: QualiopiUiStatus;
  proofs: QualiopiProofRef[];
  nextAction: { label: string; href: string } | null;
};

function assessAuto(
  id: number,
  ctx: {
    coffre: ReturnType<typeof getCoffreAdminStatus>;
    sessions: QualiopiSession[];
    signals: QualiopiStatusSignals;
    manuals: QualiopiManualProof[];
  },
): Draft {
  const manuals = ctx.manuals.filter((m) => m.indicatorId === id);
  const manualProofs = manuals.map((m) =>
    proof(m.label, m.fileUrl, m.updatedAt || m.proofAt, null),
  );
  const withManual = (d: Draft): Draft => {
    if (!manualProofs.length) return d;
    const proofs = [...d.proofs, ...manualProofs];
    const fileHref =
      manuals.map((m) => m.fileUrl).find((u) => Boolean(u && String(u).trim())) ?? null;
    if (d.status === "missing" || d.status === "todo") {
      const fresh = manuals.some((m) => !stale(m.proofAt));
      return {
        status: fresh ? "proven" : "todo",
        proofs,
        nextAction: fresh
          ? {
              label: "Voir la preuve",
              href: fileHref || d.nextAction?.href || "/super/crm/qualiopi?tab=overview",
            }
          : { label: "Mettre à jour la preuve", href: "/super/crm/qualiopi?tab=overview" },
      };
    }
    if (fileHref) {
      return {
        ...d,
        proofs,
        nextAction: { label: "Voir la preuve", href: fileHref },
      };
    }
    return { ...d, proofs };
  };

  const sig = ctx.signals;
  const sessionsTotal = ctx.sessions.length;
  const sessionsComplete = ctx.sessions.filter(sessionComplete).length;

  switch (id) {
    case 1: {
      const published = Math.max(sig.coursesPublicTotal, 0);
      const complete = sig.coursesCompliantCount ?? 0;
      const publicHref =
        publicFormationHref(sig.examplePublicFormationSlug) ?? "/super/formations";
      const fiche = proof(
        "Page publique des formations",
        publicHref,
        null,
        `${complete} / ${Math.max(published, 1)} fiches complètes`,
      );
      const cms = proof(
        "Gestion des formations (CMS)",
        "/super/formations",
        null,
        null,
      );
      const proofs = [fiche, cms];
      if (published > 0 && complete >= published) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: { label: "Voir les preuves", href: publicHref },
        });
      }
      if (complete > 0 || published > 0) {
        return withManual({
          status: "todo",
          proofs,
          nextAction: { label: "Compléter", href: "/super/formations" },
        });
      }
      return withManual({
        status: "missing",
        proofs: [cms],
        nextAction: { label: "Compléter", href: "/super/formations" },
      });
    }
    case 2: {
      const published = Math.max(sig.coursesPublicTotal, 0);
      const complete = sig.coursesCompliantCount ?? 0;
      const publicHref = publicFormationHref(sig.examplePublicFormationSlug, "qualite");
      const fiche = proof(
        "Indicateurs de résultats sur fiche publique",
        publicHref,
        null,
        `${complete} / ${Math.max(published, 1)} fiches complètes`,
      );
      const proofs = publicHref ? [fiche] : [];
      if (published > 0 && complete >= published && publicHref) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: { label: "Voir la preuve", href: publicHref },
        });
      }
      if ((complete > 0 || published > 0) && publicHref) {
        return withManual({
          status: "todo",
          proofs,
          nextAction: { label: "Voir la preuve", href: publicHref },
        });
      }
      return withManual({
        status: "missing",
        proofs: [],
        nextAction: {
          label: "Compléter",
          href: "/super/crm/qualiopi/catalogue",
        },
      });
    }
    case 4: {
      // Analyse du besoin = fiche structurée sur compte client (organization_need_analyses).
      const completeCount = sig.needAnalysesCompleteCount ?? 0;
      const orgId = sig.exampleNeedAnalysisOrgId;
      const href = orgId
        ? `/super/organisations/${orgId}?tab=besoins`
        : "/super/organisations";
      const p = proof(
        "Compte client — analyse du besoin complète",
        href,
        null,
        completeCount > 0 ? `${completeCount} analyse(s) complète(s)` : null,
      );
      const crm = proof(
        "CRM / dossier formation (lien besoin → session)",
        "/super/crm/programmation",
        null,
        null,
      );
      if (completeCount >= 1) {
        return withManual({
          status: "proven",
          proofs: [p, crm],
          nextAction: { label: "Voir les preuves", href },
        });
      }
      return withManual({
        status: "missing",
        proofs: [p, crm],
        nextAction: { label: "Ouvrir un compte client", href: "/super/organisations" },
      });
    }
    case 5: {
      const publicHref =
        publicFormationHref(sig.examplePublicFormationSlug, "objectifs") ??
        "/super/crm/qualiopi/catalogue";
      const competencesHref =
        publicFormationHref(sig.examplePublicFormationSlug, "competences") ?? publicHref;
      const p = proof(
        "Objectifs pédagogiques (fiche publique)",
        publicHref,
        null,
        `${sig.coursesWithObjectives} formation(s)`,
      );
      const competences = proof(
        "Compétences · niveau · évaluation (fiche publique)",
        competencesHref,
        null,
        null,
      );
      const cms = proof(
        "Catalogue Qualiopi — objectifs CMS",
        "/super/crm/qualiopi/catalogue",
        null,
        null,
      );
      if (sig.coursesWithObjectives >= 1) {
        return withManual({
          status: "proven",
          proofs: [p, competences, cms],
          nextAction: { label: "Voir les preuves", href: publicHref },
        });
      }
      return withManual({
        status: "todo",
        proofs: [p, cms],
        nextAction: { label: "Compléter", href: "/super/crm/qualiopi/catalogue" },
      });
    }
    case 6:
    case 8: {
      const publicHref =
        publicFormationHref(
          sig.examplePublicFormationSlug,
          id === 6 ? "programme" : undefined,
        ) ?? "/super/crm/qualiopi/catalogue";
      const p = proof(
        id === 6 ? "Programme / modalités (fiche publique)" : "Positionnement / contenus",
        publicHref,
        null,
        `${sig.coursesWithObjectives} formation(s)`,
      );
      if (sig.coursesWithObjectives >= 1) {
        return withManual({
          status: "proven",
          proofs: [p],
          nextAction: { label: "Voir la preuve", href: publicHref },
        });
      }
      return withManual({
        status: "todo",
        proofs: [p],
        nextAction: { label: "Compléter", href: "/super/crm/qualiopi/catalogue" },
      });
    }
    case 9: {
      // Multi-preuves alignées sur le support audit : pack + programmation + exemple convocation.
      const sessionPack = ctx.sessions.filter(
        (s) => s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at,
      ).length;
      const complete = Math.max(sessionPack, sig.infoPackCompleteCount ?? 0);
      const partial = Math.max(complete, sig.infoPackPartialCount ?? 0);
      const pack = proof(
        "Pack information (convention / règlement / livret)",
        "/super/crm/programmation",
        null,
        `${complete} dossier(s) complets · ${partial} avec envoi`,
      );
      const convention = proof(
        "Convention exemple (PDF)",
        QUALIOPI_SPECIMEN.conventionExemple,
        null,
        null,
      );
      const pipeline = proof(
        "Programmation — démarrage session / dossier formation",
        "/super/crm/programmation",
        null,
        sessionsTotal > 0 ? `${sessionsTotal} session(s)` : null,
      );
      const convocation = sig.exampleConvocationHref
        ? proof(
            "Exemple de convocation (remise au stagiaire)",
            sig.exampleConvocationHref,
            sig.exampleConvocationSentAt ?? null,
            null,
          )
        : null;
      const proofs = [pack, convention, pipeline, ...(convocation ? [convocation] : [])];
      if (complete >= 1) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: {
            label: "Voir les preuves",
            href: QUALIOPI_SPECIMEN.conventionExemple,
          },
        });
      }
      if (partial >= 1 || sessionsTotal >= 1 || Boolean(convocation)) {
        return withManual({
          status: "todo",
          proofs,
          nextAction: { label: "Compléter", href: "/super/crm/programmation" },
        });
      }
      return withManual({
        status: "missing",
        proofs: [pack, convention, pipeline],
        nextAction: { label: "Ajouter", href: "/super/crm/programmation" },
      });
    }
    case 10: {
      const sessionPack = ctx.sessions.filter(
        (s) => s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at,
      ).length;
      const complete = Math.max(sessionPack, sig.infoPackCompleteCount ?? 0);
      const partial = Math.max(complete, sig.infoPackPartialCount ?? 0);
      const handicapOk = sig.handicapProcessReady || sig.handicapProfilesCount >= 1;
      const pack = proof(
        "Pack information (convention / règlement / livret)",
        "/super/crm/programmation",
        null,
        `${complete} dossier(s) complets · ${partial} avec envoi`,
      );
      const convention = proof(
        "Convention exemple (PDF)",
        QUALIOPI_SPECIMEN.conventionExemple,
        null,
        null,
      );
      const handicap = handicapOk
        ? proof(
            "Adaptation / handicap",
            "/super/crm/qualiopi/handicap",
            null,
            `${sig.handicapProfilesCount} fiche(s)`,
          )
        : null;
      const proofs = [pack, convention, ...(handicap ? [handicap] : [])];
      if (complete >= 1 || (handicapOk && partial >= 1)) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: {
            label: "Voir les preuves",
            href: handicapOk ? "/super/crm/qualiopi/handicap" : "/super/crm/programmation",
          },
        });
      }
      if (partial >= 1 || sessionsTotal >= 1 || handicapOk) {
        return withManual({
          status: "todo",
          proofs,
          nextAction: {
            label: "Compléter",
            href: handicapOk ? "/super/crm/qualiopi/handicap" : "/super/crm/programmation",
          },
        });
      }
      return withManual({
        status: "missing",
        proofs: [],
        nextAction: { label: "Ajouter", href: "/super/crm/programmation" },
      });
    }
    case 11: {
      const chaud = sig.evalChaudCompleted ?? 0;
      const froid = sig.evalFroidCompleted ?? 0;
      const responses = chaud + froid;
      const templatesOk = Boolean(sig.evalTemplatesReady);
      const courseId = sig.exampleTrainingCourseId;
      const formationHref = courseId
        ? `/super/formations?edit=${encodeURIComponent(courseId)}`
        : "/super/formations";
      const formation = proof(
        "Formation CMS — boutons évaluation à chaud / à froid",
        formationHref,
        null,
        templatesOk
          ? `${responses} réponse(s) · ${chaud} à chaud · ${froid} à froid · gabarits actifs`
          : `${responses} réponse(s)`,
      );
      const evalChaud = proof(
        "Aperçu évaluation à chaud",
        "/a/preview?kind=eval_chaud",
        null,
        null,
      );
      const evalFroid = proof(
        "Aperçu évaluation à froid",
        "/a/preview?kind=eval_froid",
        null,
        null,
      );
      const proofs = [formation, evalChaud, evalFroid];
      if (responses >= 1 || sessionsComplete >= 1 || templatesOk) {
        return withManual({
          status: responses >= 1 || sessionsComplete >= 1 ? "proven" : "todo",
          proofs,
          nextAction: {
            label: responses >= 1 || sessionsComplete >= 1 ? "Voir les preuves" : "Compléter",
            href: formationHref,
          },
        });
      }
      return withManual({
        status: "missing",
        proofs: [formation],
        nextAction: { label: "Ajouter", href: formationHref },
      });
    }
    case 12: {
      const ficheHarcelement = proof(
        "Fiche harcèlement — prévention",
        QUALIOPI_SPECIMEN.harcelementPrevention,
        null,
        null,
      );
      if (sig.signalementsProcessReady) {
        return withManual({
          status: "proven",
          proofs: [
            proof(
              "Procédure signalements VHD",
              "/super/crm/qualiopi/process?kind=signalements",
              null,
              null,
            ),
            ficheHarcelement,
            proof("Sorties tracées", "/super/crm/programmation", null, `${sig.exitsCount}`),
            proof("Registre signalements", "/super/crm/qualiopi/qualite#signalements", null, null),
          ],
          nextAction: {
            label: "Voir les preuves",
            href: QUALIOPI_SPECIMEN.harcelementPrevention,
          },
        });
      }
      if (sig.exitsCount >= 1) {
        return withManual({
          status: "todo",
          proofs: [
            ficheHarcelement,
            proof("Sorties", "/super/crm/programmation", null, `${sig.exitsCount}`),
          ],
          nextAction: {
            label: "Compléter",
            href: "/super/crm/qualiopi/process?kind=signalements",
          },
        });
      }
      return withManual({
        status: "missing",
        proofs: [ficheHarcelement],
        nextAction: {
          label: "Ajouter",
          href: "/super/crm/qualiopi/process?kind=signalements",
        },
      });
    }
    case 17: {
      const moyensProc = (sig.validatedProcedures ?? []).find(
        (p) => Array.isArray(p.indicators) && p.indicators.includes(17),
      );
      const procedureHref = moyensProc
        ? `/super/crm/qualiopi/process?id=${moyensProc.id}`
        : "/super/crm/qualiopi/process?kind=moyens";
      const procedure = proof(
        moyensProc
          ? `Procédure Moyens matériels et locaux · v${moyensProc.current_version}`
          : "Procédure Moyens matériels et locaux",
        procedureHref,
        moyensProc?.validated_at ?? null,
        null,
      );
      const rh = proof(
        "Formateurs / experts (ressources humaines)",
        "/super/crm/qualiopi/formateurs",
        null,
        sig.approvedExperts > 0 ? `${sig.approvedExperts} expert(s) validé(s)` : null,
      );
      const experts = proof(
        "Annuaire experts",
        "/super/experts",
        null,
        null,
      );
      const proofs = [procedure, rh, experts];
      if (sig.meansProcessReady || moyensProc) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: { label: "Voir les preuves", href: procedureHref },
        });
      }
      return withManual({
        status: "todo",
        proofs,
        nextAction: { label: "Compléter", href: procedureHref },
      });
    }
    case 18:
      return withManual(
        sessionsTotal >= 1
          ? {
              status: "proven",
              proofs: [
                proof(
                  "Agenda coordination (iCal)",
                  "/super/crm/programmation?view=agenda",
                  null,
                  `${sessionsTotal}`,
                ),
                proof(
                  "Dossier formation — intervenants assignés",
                  "/super/crm/programmation",
                  null,
                  null,
                ),
              ],
              nextAction: {
                label: "Voir les preuves",
                href: "/super/crm/programmation?view=agenda",
              },
            }
          : {
              status: "todo",
              proofs: [
                proof(
                  "Agenda coordination (iCal)",
                  "/super/crm/programmation?view=agenda",
                  null,
                  null,
                ),
                proof(
                  "Dossier formation — intervenants assignés",
                  "/super/crm/programmation",
                  null,
                  null,
                ),
              ],
              nextAction: {
                label: "Ouvrir l’agenda",
                href: "/super/crm/programmation?view=agenda",
              },
            },
      );
    case 19:
      if (sig.lmsEnrollmentsCount >= 1 && sig.coursesWithObjectives >= 1) {
        return withManual({
          status: "proven",
          proofs: [
            proof(
              "Suivi LMS distanciel",
              "/super/lms/suivi",
              null,
              `${sig.lmsEnrollmentsCount} inscription(s)`,
            ),
          ],
          nextAction: { label: "Voir la preuve", href: "/super/lms/suivi" },
        });
      }
      return withManual({
        status: "todo",
        proofs: [],
        nextAction: { label: "Compléter", href: "/super/lms/suivi" },
      });
    case 21: {
      const expertHref =
        sig.exampleExpertHref ?? "/super/experts/fcfb29ae-3398-421f-b4bf-9244b2be5572";
      const bilansHref =
        sig.exampleExpertBilansHref ?? `${expertHref}?tab=bilans`;
      const fiche = proof(
        "Fiche expert — Jérôme Picot",
        expertHref,
        null,
        sig.approvedExperts > 0 ? `${sig.approvedExperts} expert(s) validé(s)` : null,
      );
      const bilans = proof(
        "Bilans — Jérôme Picot",
        bilansHref,
        null,
        null,
      );
      const proofs = [fiche, bilans];
      if (sig.approvedExperts >= 1) {
        return withManual({
          status: "proven",
          proofs,
          nextAction: { label: "Voir les preuves", href: expertHref },
        });
      }
      return withManual({
        status: "todo",
        proofs,
        nextAction: { label: "Compléter", href: expertHref },
      });
    }
    case 22:
      return withManual(
        sig.formateurPlansCount >= 1 && sig.formateurActionsDoneCount >= 1
          ? {
              status: "proven",
              proofs: [
                proof(
                  "Plans formateurs",
                  "/super/crm/qualiopi/formateurs#plans",
                  null,
                  `${sig.formateurPlansCount} plan(s)`,
                ),
              ],
              nextAction: {
                label: "Voir la preuve",
                href: "/super/crm/qualiopi/formateurs#plans",
              },
            }
          : {
              status: "todo",
              proofs: [],
              nextAction: {
                label: "Compléter",
                href: "/super/crm/qualiopi/formateurs#plans",
              },
            },
      );
    case 23:
    case 24:
    case 25: {
      const themeDone =
        id === 23
          ? sig.veilleReglementaireDone
          : id === 24
            ? sig.veilleMetierDone
            : sig.veillePedagogieDone;
      // Highlight « Traité » sans thème / transversal : compte pour les 3 axes
      const exploited = themeDone >= 1 || sig.veilleAnyDone >= 1;
      const autoActive = sig.veilleDigestCount >= 1 || sig.veilleAnySaved >= 1;
      const axisTitle =
        id === 23
          ? "Veille légale et réglementaire"
          : id === 24
            ? "Veille compétences et métiers"
            : "Veille innovations pédagogiques";
      const axisLabel =
        id === 23 ? "réglementaire" : id === 24 ? "métier" : "pédagogie";

      if (exploited || autoActive) {
        const proofs: QualiopiProofRef[] = [];
        if (sig.veilleDigestCount >= 1) {
          proofs.push(
            proof(
              `${axisTitle} — synthèses auto`,
              "/super/crm/qualiopi/veilles",
              null,
              `${sig.veilleDigestCount} synthèse(s) hebdo · 90 j (lundi + recherche manuelle)`,
            ),
          );
        }
        if (exploited) {
          proofs.push(
            proof(
              `${axisTitle} — exploitation`,
              "/super/crm/qualiopi/veilles",
              null,
              themeDone >= 1
                ? `${themeDone} info(s) « Traité » (${axisLabel})`
                : `${sig.veilleAnyDone} info(s) « Traité »`,
            ),
          );
        } else if (sig.veilleAnySaved >= 1) {
          proofs.push(
            proof(
              `${axisTitle} — surlignages`,
              "/super/crm/qualiopi/veilles",
              null,
              `${sig.veilleAnySaved} enregistré(s) — passer en Traité pour renforcer la preuve`,
            ),
          );
        }
        return withManual({
          status: "proven",
          proofs,
          nextAction: { label: "Voir la preuve", href: "/super/crm/qualiopi/veilles" },
        });
      }
      return withManual({
        status: "missing",
        proofs: [],
        nextAction: { label: "Ajouter", href: "/super/crm/qualiopi/veilles" },
      });
    }
    case 26:
      return withManual(
        sig.handicapProcessReady || sig.handicapProfilesCount >= 1
          ? {
              status: "proven",
              proofs: [
                proof(
                  "Registre handicap (anonymisé)",
                  "/super/crm/qualiopi/handicap",
                  null,
                  `${sig.handicapProfilesCount} fiche(s)`,
                ),
              ],
              nextAction: { label: "Voir la preuve", href: "/super/crm/qualiopi/handicap" },
            }
          : {
              status: "todo",
              proofs: [],
              nextAction: { label: "Compléter", href: "/super/crm/qualiopi/handicap" },
            },
      );
    case 27:
      return withManual(
        sig.subcontractReadyCount >= 1
          ? {
              status: "proven",
              proofs: [
                proof(
                  "Contrats / statuts SST",
                  "/super/crm/qualiopi/formateurs#sous-traitance",
                  null,
                  `${sig.subcontractReadyCount}`,
                ),
              ],
              nextAction: {
                label: "Voir la preuve",
                href: "/super/crm/qualiopi/formateurs#sous-traitance",
              },
            }
          : {
              status: "missing",
              proofs: [],
              nextAction: {
                label: "Ajouter",
                href: "/super/crm/qualiopi/formateurs#sous-traitance",
              },
            },
      );
    case 30: {
      const chaud = sig.evalChaudCompleted ?? 0;
      const sat = ctx.sessions.filter((s) => {
        const a = s.attendees ?? [];
        return a.length > 0 && a.every((x) => x.satisfaction_at || x.satisfaction_score != null);
      }).length;
      const evalChaud = proof(
        "Test évaluation à chaud (recueil des appréciations)",
        "/a/preview?kind=eval_chaud",
        null,
        chaud > 0 ? `${chaud} réponse(s)` : null,
      );
      const proofs = [
        evalChaud,
        ...(sat >= 1
          ? [
              proof(
                "Satisfaction sessions",
                "/super/crm/qualiopi?tab=emargements",
                null,
                `${sat}`,
              ),
            ]
          : []),
      ];
      if (chaud >= 1 || sat >= 1 || Boolean(sig.evalTemplatesReady)) {
        return withManual({
          status: chaud >= 1 || sat >= 1 ? "proven" : "todo",
          proofs,
          nextAction: {
            label: chaud >= 1 || sat >= 1 ? "Voir la preuve" : "Compléter",
            href: "/a/preview?kind=eval_chaud",
          },
        });
      }
      return withManual({
        status: "todo",
        proofs: [evalChaud],
        nextAction: { label: "Compléter", href: "/a/preview?kind=eval_chaud" },
      });
    }
    case 31: {
      const ind31 = sig.reclamationsIndicatorStatus;
      if (ind31 === "proven" || ind31 === "todo" || ind31 === "missing") {
        return withManual(
          ind31 === "missing"
            ? {
                status: "missing",
                proofs: [],
                nextAction: { label: "Ajouter", href: "/super/crm/qualiopi/qualite" },
              }
            : {
                status: ind31 === "proven" ? "proven" : "todo",
                proofs: [
                  proof(
                    "Registre réclamations",
                    "/super/crm/qualiopi/qualite",
                    null,
                    sig.reclamationsProofLabel ??
                      (sig.reclamationsTreatedCount != null
                        ? `${sig.reclamationsTreatedCount} réclamations traitées`
                        : null),
                  ),
                ],
                nextAction: {
                  label: ind31 === "proven" ? "Voir la preuve" : "Traiter",
                  href: "/super/crm/qualiopi/qualite",
                },
              },
        );
      }
      return withManual(
        sig.reclamationsProcessReady
          ? {
              status: sig.reclamationsOpenCount > 0 ? "todo" : "proven",
              proofs: [
                proof(
                  "Registre réclamations",
                  "/super/crm/qualiopi/qualite",
                  null,
                  sig.reclamationsOpenCount > 0
                    ? `${sig.reclamationsOpenCount} sans réponse`
                    : "Procédure active",
                ),
              ],
              nextAction: {
                label: sig.reclamationsOpenCount > 0 ? "Traiter" : "Voir la preuve",
                href: "/super/crm/qualiopi/qualite",
              },
            }
          : {
              status: "missing",
              proofs: [],
              nextAction: { label: "Ajouter", href: "/super/crm/qualiopi/qualite" },
            },
      );
    }
    case 32: {
      const ind32 = sig.ameliorationIndicatorStatus;
      if (ind32 === "proven" || ind32 === "todo" || ind32 === "missing") {
        return withManual(
          ind32 === "missing"
            ? {
                status: "missing",
                proofs: [],
                nextAction: { label: "Ajouter", href: "/super/crm/qualiopi/qualite?tab=paq" },
              }
            : {
                status: ind32 === "proven" ? "proven" : "todo",
                proofs: [
                  proof(
                    "Plan d’amélioration",
                    "/super/crm/qualiopi/qualite?tab=paq",
                    null,
                    sig.ameliorationProofLabel ?? null,
                  ),
                  ...(sig.risksCount >= 1
                    ? [
                        proof(
                          "Registre des risques",
                          "/super/crm/qualiopi/risques",
                          null,
                          `${sig.risksCount}`,
                        ),
                      ]
                    : []),
                ],
                nextAction: {
                  label: ind32 === "proven" ? "Voir la preuve" : "Compléter",
                  href: "/super/crm/qualiopi/qualite?tab=paq",
                },
              },
        );
      }
      return withManual(
        sig.risksCount >= 1 || sig.actionsDoneCount >= 1
          ? {
              status: "proven",
              proofs: [
                proof("Registre des risques", "/super/crm/qualiopi/risques", null, `${sig.risksCount}`),
                proof("Actions PAQ", "/super/crm/qualiopi/qualite", null, `${sig.actionsDoneCount}`),
              ],
              nextAction: { label: "Voir la preuve", href: "/super/crm/qualiopi/risques" },
            }
          : {
              status: "missing",
              proofs: [],
              nextAction: { label: "Ajouter", href: "/super/crm/qualiopi/risques" },
            },
      );
    }
    // CFA / certifying / PFST without auto source yet → dépôt manuel
    default:
      return withManual(
        manuals.length
          ? {
              status: manuals.some((m) => !stale(m.proofAt)) ? "proven" : "todo",
              proofs: manualProofs,
              nextAction: { label: "Voir la preuve", href: "/super/crm/qualiopi?tab=overview" },
            }
          : {
              status: "missing",
              proofs: [],
              nextAction: { label: "Ajouter", href: "/super/crm/qualiopi?tab=overview" },
            },
      );
  }
}

/** Calcule le statut de chaque indicateur (32) — côté serveur. */
export function getQualiopiStatus(input: {
  documents: QualiopiDocument[];
  sessions: QualiopiSession[];
  signals: QualiopiStatusSignals;
  activities?: unknown;
  auditType?: string | null;
  auditAt?: string | null;
  naAttestations?: QualiopiNaAttestation[];
  manualProofs?: QualiopiManualProof[];
}): QualiopiStatusSnapshot {
  const profile: QualiopiActivityProfile = parseActivityProfile(
    input.activities ?? DEFAULT_QUALIOPI_ACTIVITIES,
  );
  const coffre = getCoffreAdminStatus(input.documents);
  const naById = new Map(
    (input.naAttestations ?? []).map((a) => [a.indicatorId, a.note?.trim() || null]),
  );
  const manuals = input.manualProofs ?? [];

  const indicators: QualiopiIndicatorStatus[] = QUALIOPI_INDICATORS.map((def) => {
    const help = helpFor(def.id);
    const applicable = isIndicatorApplicable(def, profile);

    if (!applicable) {
      const justification = naById.get(def.id) ?? null;
      return {
        indicatorId: def.id,
        criterionId: def.criterionId,
        shortTitle: def.shortTitle,
        scopeTag: def.scopeTag,
        status: justification ? "na" : "todo",
        proofs: [],
        nextAction: justification
          ? null
          : {
              label: "Justifier N/A",
              href: `/super/crm/qualiopi?tab=overview&indicate=${def.id}`,
            },
        naJustification: justification,
        helpWhere: help.where,
        helpHow: help.how,
      };
    }

    const draft = assessAuto(def.id, {
      coffre,
      sessions: input.sessions,
      signals: input.signals,
      manuals,
    });

    const procProofs = (input.signals.validatedProcedures ?? [])
      .filter((p) => Array.isArray(p.indicators) && p.indicators.includes(def.id))
      .map((p) =>
        proof(
          `Procédure ${p.title} · v${p.current_version}${
            p.validated_at ? ` du ${String(p.validated_at).slice(0, 10)}` : ""
          }`,
          `/super/crm/qualiopi/process?id=${p.id}`,
          p.validated_at,
          null,
        ),
      );

    const proofs = [...procProofs, ...draft.proofs];
    let status = draft.status;
    if (procProofs.length && status === "missing") status = "proven";
    if (input.signals.procedureReviewOverdue && procProofs.length && status === "proven") {
      status = "todo";
    }

    return {
      indicatorId: def.id,
      criterionId: def.criterionId,
      shortTitle: def.shortTitle,
      scopeTag: def.scopeTag,
      status,
      proofs,
      nextAction: draft.nextAction,
      naJustification: null,
      helpWhere: help.where,
      helpHow: help.how,
    };
  });

  const proven = indicators.filter((i) => i.status === "proven").length;
  const todo = indicators.filter((i) => i.status === "todo").length;
  const missing = indicators.filter((i) => i.status === "missing").length;
  const na = indicators.filter((i) => i.status === "na").length;
  const applicable = indicators.length - na;

  const auditTypeRaw = String(input.auditType || "surveillance");
  const auditType =
    auditTypeRaw === "initial" || auditTypeRaw === "renouvellement"
      ? auditTypeRaw
      : "surveillance";
  const auditAt = input.auditAt ? String(input.auditAt).slice(0, 10) : null;
  let daysUntil: number | null = null;
  if (auditAt) {
    const diff = new Date(`${auditAt}T12:00:00`).getTime() - Date.now();
    daysUntil = Math.ceil(diff / (24 * 60 * 60 * 1000));
  }

  const sessionsComplete = input.sessions.filter(sessionComplete).length;

  return {
    generatedAt: new Date().toISOString(),
    activities: profile,
    audit: { type: auditType, at: auditAt, daysUntil },
    coffre: { deposited: coffre.deposited, expected: coffre.expected },
    emargements: { complete: sessionsComplete, total: input.sessions.length },
    veilles: { toReadThisMonth: input.signals.veilleToReadThisMonth },
    indicators,
    summary: {
      proven,
      todo,
      missing,
      na,
      applicable,
      total: indicators.length,
    },
  };
}
