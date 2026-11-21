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
    case 1:
    case 2: {
      const published = Math.max(sig.coursesPublicTotal, 0);
      const complete = sig.coursesCompliantCount ?? 0;
      const publicHref =
        publicFormationHref(
          sig.examplePublicFormationSlug,
          id === 2 ? "qualite" : undefined,
        ) ?? "/super/crm/qualiopi/catalogue";
      const p = proof(
        id === 2
          ? "Indicateurs de résultats sur fiche publique"
          : "Fiche formation publique (catalogue)",
        publicHref,
        null,
        `${complete} / ${Math.max(published, 1)} fiches complètes`,
      );
      if (published > 0 && complete >= published) {
        return withManual({
          status: "proven",
          proofs: [p],
          nextAction: { label: "Voir la preuve", href: publicHref },
        });
      }
      if (complete > 0) {
        return withManual({
          status: "todo",
          proofs: [p],
          nextAction: { label: "Compléter", href: "/super/crm/qualiopi/catalogue" },
        });
      }
      return withManual({
        status: published > 0 ? "todo" : "missing",
        proofs: published > 0 ? [p] : [],
        nextAction: { label: "Compléter", href: "/super/crm/qualiopi/catalogue" },
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
      if (completeCount >= 1) {
        return withManual({
          status: "proven",
          proofs: [p],
          nextAction: { label: "Voir la preuve", href },
        });
      }
      return withManual({
        status: "missing",
        proofs: [p],
        nextAction: { label: "Ouvrir un compte client", href: "/super/organisations" },
      });
    }
    case 5: {
      const publicHref =
        publicFormationHref(sig.examplePublicFormationSlug, "objectifs") ??
        "/super/crm/qualiopi/catalogue";
      const p = proof(
        "Objectifs pédagogiques (fiche publique)",
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
    case 9:
    case 10: {
      const sessionPack = ctx.sessions.filter(
        (s) => s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at,
      ).length;
      const complete = Math.max(sessionPack, sig.infoPackCompleteCount ?? 0);
      const partial = Math.max(complete, sig.infoPackPartialCount ?? 0);
      const handicapOk = sig.handicapProcessReady || sig.handicapProfilesCount >= 1;
      const p = proof(
        "Pack information (convention / règlement / livret)",
        "/super/crm/programmation",
        null,
        `${complete} dossier(s) complets · ${partial} avec envoi`,
      );
      // Ind. 10 : adaptation publics — pack info OU dossier handicap
      if (complete >= 1 || (id === 10 && handicapOk && partial >= 1)) {
        return withManual({
          status: "proven",
          proofs: [
            p,
            ...(id === 10 && handicapOk
              ? [
                  proof(
                    "Adaptation / handicap",
                    "/super/crm/qualiopi/handicap",
                    null,
                    `${sig.handicapProfilesCount} fiche(s)`,
                  ),
                ]
              : []),
          ],
          nextAction: {
            label: "Voir la preuve",
            href: id === 10 ? "/super/crm/qualiopi/handicap" : "/super/crm/programmation",
          },
        });
      }
      if (partial >= 1 || sessionsTotal >= 1 || (id === 10 && handicapOk)) {
        return withManual({
          status: "todo",
          proofs: [p],
          nextAction: {
            label: "Compléter",
            href: id === 10 ? "/super/crm/qualiopi/handicap" : "/super/crm/programmation",
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
      const p = proof(
        "Évaluations à chaud / à froid",
        "/super/crm/programmation",
        null,
        templatesOk
          ? `${responses} réponse(s) · ${chaud} à chaud · ${froid} à froid · gabarits actifs`
          : `${responses} réponse(s)`,
      );
      if (responses >= 1 || sessionsComplete >= 1) {
        return withManual({
          status: "proven",
          proofs: [
            p,
            ...(sessionsComplete >= 1
              ? [
                  proof(
                    "Émargements / clôtures",
                    "/super/crm/qualiopi?tab=emargements",
                    null,
                    `${sessionsComplete} / ${Math.max(sessionsTotal, 1)}`,
                  ),
                ]
              : []),
          ],
          nextAction: { label: "Voir la preuve", href: "/super/crm/programmation" },
        });
      }
      // Dispositif en place (gabarits) mais pas encore de réponses collectées
      if (templatesOk || sessionsTotal >= 1) {
        return withManual({
          status: "todo",
          proofs: [p],
          nextAction: { label: "Compléter", href: "/super/crm/programmation" },
        });
      }
      return withManual({
        status: "missing",
        proofs: [],
        nextAction: { label: "Ajouter", href: "/super/crm/programmation" },
      });
    }
    case 12: {
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
            proof("Sorties tracées", "/super/crm/programmation", null, `${sig.exitsCount}`),
            proof("Registre signalements", "/super/crm/qualiopi/qualite#signalements", null, null),
          ],
          nextAction: {
            label: "Voir la preuve",
            href: "/super/crm/qualiopi/process?kind=signalements",
          },
        });
      }
      if (sig.exitsCount >= 1) {
        return withManual({
          status: "todo",
          proofs: [proof("Sorties", "/super/crm/programmation", null, `${sig.exitsCount}`)],
          nextAction: {
            label: "Compléter",
            href: "/super/crm/qualiopi/process?kind=signalements",
          },
        });
      }
      return withManual({
        status: "missing",
        proofs: [],
        nextAction: {
          label: "Ajouter",
          href: "/super/crm/qualiopi/process?kind=signalements",
        },
      });
    }
    case 17:
      return withManual(
        sig.meansProcessReady
          ? {
              status: "proven",
              proofs: [
                proof("Note moyens", "/super/crm/qualiopi/process?kind=moyens", null, null),
              ],
              nextAction: {
                label: "Voir la preuve",
                href: "/super/crm/qualiopi/process?kind=moyens",
              },
            }
          : {
              status: "todo",
              proofs: [],
              nextAction: {
                label: "Compléter",
                href: "/super/crm/qualiopi/process?kind=moyens",
              },
            },
      );
    case 18:
      return withManual(
        sessionsTotal >= 1
          ? {
              status: "proven",
              proofs: [proof("Sessions / intervenants", "/super/crm/programmation", null, `${sessionsTotal}`)],
              nextAction: { label: "Voir la preuve", href: "/super/crm/programmation" },
            }
          : {
              status: "todo",
              proofs: [],
              nextAction: { label: "Ajouter", href: "/super/crm/programmation" },
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
    case 21:
      return withManual(
        sig.approvedExperts >= 2
          ? {
              status: "proven",
              proofs: [proof("Experts validés", "/super/experts", null, `${sig.approvedExperts}`)],
              nextAction: { label: "Voir la preuve", href: "/super/experts" },
            }
          : {
              status: "todo",
              proofs: [
                proof("Experts validés", "/super/experts", null, `${sig.approvedExperts}`),
              ],
              nextAction: { label: "Compléter", href: "/super/experts" },
            },
      );
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
      const axisLabel =
        id === 23 ? "réglementaire" : id === 24 ? "métier" : "pédagogie";

      if (exploited || autoActive) {
        const proofs: QualiopiProofRef[] = [];
        if (sig.veilleDigestCount >= 1) {
          proofs.push(
            proof(
              "Veille automatique (digests)",
              "/super/crm/qualiopi/veilles",
              null,
              `${sig.veilleDigestCount} digest(s) / 90 j`,
            ),
          );
        }
        if (exploited) {
          proofs.push(
            proof(
              `Highlight ${axisLabel} traité`,
              "/super/crm/qualiopi/veilles",
              null,
              themeDone >= 1 ? `${themeDone} traité(s)` : `${sig.veilleAnyDone} traité(s)`,
            ),
          );
        } else if (sig.veilleAnySaved >= 1) {
          proofs.push(
            proof(
              "Surlignages enregistrés",
              "/super/crm/qualiopi/veilles",
              null,
              `${sig.veilleAnySaved} — passer en Traité pour renforcer la preuve`,
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
      const sat = ctx.sessions.filter((s) => {
        const a = s.attendees ?? [];
        return a.length > 0 && a.every((x) => x.satisfaction_at || x.satisfaction_score != null);
      }).length;
      return withManual(
        sat >= 1
          ? {
              status: "proven",
              proofs: [
                proof("Satisfaction sessions", "/super/crm/qualiopi?tab=emargements", null, `${sat}`),
              ],
              nextAction: { label: "Voir la preuve", href: "/super/crm/qualiopi?tab=emargements" },
            }
          : {
              status: "todo",
              proofs: [],
              nextAction: { label: "Compléter", href: "/super/crm/qualiopi?tab=emargements" },
            },
      );
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
