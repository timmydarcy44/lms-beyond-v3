import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadDisabilityReferentContact } from "@/lib/handicap/referent-contact";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getQualiopiStatus, type QualiopiStatusSignals } from "@/lib/qualiopi/get-status";
import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { formationDocumentPublicUrl } from "@/lib/formation-documents/public-url";
import { assessQualiopiFicheCompliance } from "@/lib/training-courses/qualiopi-fiche";
import {
  scoreIndicator31,
  scoreIndicator32,
  type ActionIndicatorRow,
  type ReclamationIndicatorRow,
} from "@/lib/qualiopi/reclamation-indicators";
import { computeDeadlineBadge } from "@/lib/qualiopi/reclamation-deadlines";
import { DEFAULT_RECLAMATION_DEADLINES } from "@/lib/qualiopi/reclamation-deadlines";
import { isOpenStep, resolveReclamationStep } from "@/lib/qualiopi/reclamation-status";

export const dynamic = "force-dynamic";

const OF_SETTINGS_ID = "00000000-0000-4000-8000-000000000001";

/** Cache mémoire 5 minutes */
let cache: { at: number; payload: unknown } | null = null;
const CACHE_MS = 5 * 60 * 1000;

async function safeCount(
  run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  try {
    const res = await run();
    if (res.error) return 0;
    return res.count ?? 0;
  } catch {
    return 0;
  }
}

/** Snapshot statut indicateurs — partagé avec l’export PDF par indicateur. */
export async function buildStatusForEvidence(force = false) {
  return buildStatus(force);
}

async function buildStatus(force = false) {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) {
    return cache.payload;
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const withTimeout = <T>(p: Promise<T>, ms = 12_000): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Délai dépassé — réessayez")), ms),
      ),
    ]);

  const [
    docsRes,
    sessionsRes,
    settingsRes,
    attestRes,
    proofsRes,
    trainingRes,
  ] = await withTimeout(
    Promise.all([
      supabase.from("crm_qualiopi_documents").select("*").is("session_id", null),
      supabase
        .from("crm_qualiopi_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("of_settings").select("*").eq("id", OF_SETTINGS_ID).maybeSingle(),
      supabase
        .from("crm_qualiopi_indicator_attestations")
        .select("indicator_id, note, kind"),
      supabase
        .from("crm_qualiopi_indicator_proofs")
        .select("indicator_id, label, comment, file_url, proof_at, updated_at"),
      supabase
        .from("training_courses")
        .select(
          "id, slug, title, objectives, is_active, results_method_override, formats, badge_name, badge_class_id, recognition_type, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, price_on_quote, intra_price, inter_price, organization_id, source",
        )
        .is("organization_id", null),
    ]),
  );

  // Fallback si colonnes / tables absentes
  const documents = (docsRes.error ? [] : docsRes.data ?? []) as QualiopiDocument[];
  let sessions = (sessionsRes.error ? [] : sessionsRes.data ?? []) as QualiopiSession[];

  const sessionIds = sessions.map((s) => s.id as string);
  if (sessionIds.length) {
    const { data: attendees } = await supabase
      .from("crm_qualiopi_attendees")
      .select("*")
      .in("session_id", sessionIds);
    sessions = sessions.map((s) => ({
      ...s,
      attendees: (attendees ?? []).filter((a) => a.session_id === s.id),
    })) as QualiopiSession[];
  }

  // Exclure spécimens + sessions de test si possible
  const { data: specimenRows } = await supabase
    .from("formation_dossiers")
    .select("legacy_qualiopi_session_id, session_id, is_specimen")
    .eq("is_specimen", true);
  const specimenIds = new Set<string>();
  for (const row of specimenRows ?? []) {
    if (row.legacy_qualiopi_session_id) specimenIds.add(String(row.legacy_qualiopi_session_id));
    if (row.session_id) specimenIds.add(String(row.session_id));
  }
  sessions = sessions.filter((s) => !specimenIds.has(String(s.id)));

  const settings = settingsRes.data as Record<string, unknown> | null;
  const globalResultsMethod = String(settings?.results_indicators_method ?? "").trim();
  const handicapContact = await loadDisabilityReferentContact(supabase);
  const accessibilityOk = Boolean(handicapContact.email);

  type StatusCourseRow = {
    id: string;
    slug?: string | null;
    title?: string | null;
    objectives?: unknown;
    is_active?: boolean | null;
    results_method_override?: string | null;
    formats?: string[] | null;
    badge_name?: string | null;
    badge_class_id?: string | null;
    recognition_type?: string | null;
    pedagogical_modality?: string | null;
    pedagogical_modality_detail?: string | null;
    financing_modalities?: string | null;
    duration?: string | null;
    price_on_quote?: boolean | null;
    intra_price?: number | null;
    inter_price?: number | null;
    organization_id?: string | null;
    source?: string | null;
  };
  let courses = (trainingRes.error ? [] : trainingRes.data ?? []) as StatusCourseRow[];
  if (trainingRes.error) {
    console.warn("[qualiopi/status] training_courses:", trainingRes.error.message);
    // Fallback si filtre organization_id non supporté
    if (/organization_id/i.test(trainingRes.error.message)) {
      const fallback = await supabase
        .from("training_courses")
        .select(
          "id, slug, title, objectives, is_active, results_method_override, formats, badge_name, badge_class_id, recognition_type, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, price_on_quote, intra_price, inter_price, organization_id, source",
        );
      courses = (fallback.data ?? []) as StatusCourseRow[];
    }
  }
  const publicCourses = courses.filter(
    (c) =>
      c.is_active === true &&
      !c.organization_id &&
      (c.source == null || c.source === "catalogue"),
  );
  const coursesPublicTotal = publicCourses.length;
  let coursesWithObjectives = 0;
  let coursesWithResults = 0;
  let coursesPublicWithInfo = 0;
  let coursesCompliantCount = 0;
  let examplePublicFormationSlug: string | null = null;
  let exampleCompliantSlug: string | null = null;
  for (const row of publicCourses) {
    const objs = Array.isArray(row.objectives)
      ? row.objectives.filter((o) => String(o).trim())
      : typeof row.objectives === "string" && row.objectives.trim().length >= 20
        ? [row.objectives]
        : [];
    const hasObj = objs.length >= 3;
    if (hasObj) {
      coursesWithObjectives += 1;
      coursesPublicWithInfo += 1;
    }
    const override = String(row.results_method_override ?? "").trim();
    if (override || globalResultsMethod) {
      coursesWithResults += 1;
    }
    const compliance = assessQualiopiFicheCompliance(
      {
        ...row,
        objectives: objs,
        duration: row.duration != null ? String(row.duration) : null,
      },
      { accessibilityOk },
    );
    const slug = String(row.slug ?? "").trim();
    if (slug && !examplePublicFormationSlug) examplePublicFormationSlug = slug;
    if (compliance.ok) {
      coursesCompliantCount += 1;
      if (slug && !exampleCompliantSlug) exampleCompliantSlug = slug;
    }
  }
  examplePublicFormationSlug = exampleCompliantSlug ?? examplePublicFormationSlug;

  const processSafe = await supabase.from("crm_qualiopi_process_docs").select("kind, status");
  const processReady: Record<string, boolean> = {};
  for (const row of processSafe.data ?? []) {
    if (row.status === "ready" || row.status === "attested") {
      processReady[String(row.kind)] = true;
    }
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const since90 = new Date();
  since90.setUTCDate(since90.getUTCDate() - 90);
  const since90Iso = since90.toISOString();

  // Pack information : dossiers (formation_documents) + sessions Qualiopi
  let infoPackCompleteCount = 0;
  let infoPackPartialCount = 0;
  try {
    const { data: sentDocs } = await supabase
      .from("formation_documents")
      .select("dossier_id, kind, sent_at")
      .in("kind", ["convention", "reglement", "livret", "convocation"])
      .not("sent_at", "is", null)
      .limit(500);
    const byDossier = new Map<string, Set<string>>();
    for (const row of sentDocs ?? []) {
      const did = String(row.dossier_id ?? "");
      if (!did) continue;
      if (!byDossier.has(did)) byDossier.set(did, new Set());
      byDossier.get(did)!.add(String(row.kind));
    }
    for (const kinds of byDossier.values()) {
      const hasConv = kinds.has("convention");
      const hasReg = kinds.has("reglement");
      const hasLiv = kinds.has("livret") || kinds.has("convocation");
      if (hasConv || hasReg || hasLiv) infoPackPartialCount += 1;
      if (hasConv && hasReg && hasLiv) infoPackCompleteCount += 1;
    }
  } catch (e) {
    console.warn("[qualiopi/status] formation_documents pack:", e);
  }
  // Fallback sessions CRM (workflow historique)
  const sessionPackComplete = sessions.filter(
    (s) => s.convention_sent_at && s.reglement_sent_at && s.livret_sent_at,
  ).length;
  const sessionPackPartial = sessions.filter(
    (s) => s.convention_sent_at || s.reglement_sent_at || s.livret_sent_at,
  ).length;
  infoPackCompleteCount = Math.max(infoPackCompleteCount, sessionPackComplete);
  infoPackPartialCount = Math.max(infoPackPartialCount, sessionPackPartial);

  /** Exemple de convocation publique pour multi-preuves ind. 9. */
  let exampleConvocationHref: string | null = null;
  let exampleConvocationSentAt: string | null = null;
  try {
    const { data: convRows } = await supabase
      .from("formation_documents")
      .select("access_token, sent_at, created_at")
      .eq("kind", "convocation")
      .not("access_token", "is", null)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(5);
    const best =
      (convRows ?? []).find((r) => r.sent_at && r.access_token) ??
      (convRows ?? []).find((r) => r.access_token) ??
      null;
    if (best?.access_token) {
      exampleConvocationHref = formationDocumentPublicUrl(String(best.access_token));
      exampleConvocationSentAt = best.sent_at
        ? String(best.sent_at)
        : best.created_at
          ? String(best.created_at)
          : null;
    }
  } catch (e) {
    console.warn("[qualiopi/status] example convocation:", e);
  }

  const disabilityCasesCount = await safeCount(() =>
    supabase.from("disability_cases").select("id", { count: "exact", head: true }),
  );
  const disabilityAccommodationsCount = await safeCount(() =>
    supabase.from("disability_accommodations").select("id", { count: "exact", head: true }),
  );
  const handicapProfilesRaw = await safeCount(() =>
    supabase.from("handicap_profiles").select("id", { count: "exact", head: true }),
  );

  let evalChaudCompleted = 0;
  let evalFroidCompleted = 0;
  let evalTemplatesReady = false;
  try {
    const [{ count: chaudDone }, { count: froidDone }, { data: tplRows }] = await Promise.all([
      supabase
        .from("formation_assessment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("kind", "eval_chaud")
        .not("completed_at", "is", null),
      supabase
        .from("formation_assessment_attempts")
        .select("id", { count: "exact", head: true })
        .eq("kind", "eval_froid")
        .not("completed_at", "is", null),
      supabase
        .from("formation_assessment_templates")
        .select("kind")
        .in("kind", ["eval_chaud", "eval_froid"]),
    ]);
    evalChaudCompleted = chaudDone ?? 0;
    evalFroidCompleted = froidDone ?? 0;
    const kinds = new Set((tplRows ?? []).map((r) => String(r.kind)));
    evalTemplatesReady = kinds.has("eval_chaud") && kinds.has("eval_froid");
  } catch (e) {
    console.warn("[qualiopi/status] eval chaud/froid:", e);
  }

  const signals: QualiopiStatusSignals = {
    coursesPublicWithInfo,
    coursesPublicTotal,
    coursesCompliantCount,
    coursesWithResults,
    coursesWithObjectives,
    infoPackCompleteCount,
    infoPackPartialCount,
    evalChaudCompleted,
    evalFroidCompleted,
    evalTemplatesReady,
    approvedExperts: await safeCount(() =>
      supabase
        .from("experts")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "approved"),
    ),
    formateurPlansCount: await safeCount(() =>
      supabase.from("crm_qualiopi_formateur_plans").select("id", { count: "exact", head: true }),
    ),
    formateurActionsDoneCount: await safeCount(() =>
      supabase
        .from("crm_qualiopi_formateur_actions")
        .select("id", { count: "exact", head: true })
        .eq("status", "done"),
    ),
    veilleReglementaireDone: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_highlights")
        .select("id", { count: "exact", head: true })
        .eq("status", "done")
        .eq("theme", "reglementaire"),
    ),
    veilleMetierDone: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_highlights")
        .select("id", { count: "exact", head: true })
        .eq("status", "done")
        .eq("theme", "metier"),
    ),
    veillePedagogieDone: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_highlights")
        .select("id", { count: "exact", head: true })
        .eq("status", "done")
        .eq("theme", "pedagogie"),
    ),
    veilleToReadThisMonth: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_highlights")
        .select("id", { count: "exact", head: true })
        .neq("status", "done")
        .gte("created_at", monthStart.toISOString()),
    ),
    veilleDigestCount: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_digests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since90Iso),
    ),
    veilleAnySaved: await safeCount(() =>
      supabase.from("crm_qualiopi_veille_highlights").select("id", { count: "exact", head: true }),
    ),
    veilleAnyDone: await safeCount(() =>
      supabase
        .from("crm_qualiopi_veille_highlights")
        .select("id", { count: "exact", head: true })
        .eq("status", "done"),
    ),
    reclamationsProcessReady: Boolean(processReady.reclamations),
    reclamationsOpenCount: 0,
    signalementsProcessReady: Boolean(processReady.signalements),
    exitsCount: await safeCount(() =>
      supabase.from("formation_participant_exits").select("id", { count: "exact", head: true }),
    ),
    risksCount: await safeCount(() =>
      supabase.from("crm_qualiopi_risks").select("id", { count: "exact", head: true }),
    ),
    actionsDoneCount: await safeCount(() =>
      supabase
        .from("crm_qualiopi_actions")
        .select("id", { count: "exact", head: true })
        .eq("status", "done"),
    ),
    subcontractReadyCount: await safeCount(() =>
      supabase
        .from("experts")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "approved")
        .not("employment_status", "is", null),
    ),
    handicapProfilesCount: Math.max(
      handicapProfilesRaw,
      disabilityCasesCount,
      disabilityAccommodationsCount,
    ),
    handicapProcessReady: Boolean(processReady.handicap),
    lmsEnrollmentsCount: await safeCount(() =>
      supabase.from("formation_lms_enrollments").select("id", { count: "exact", head: true }),
    ),
    pedagogicalReferentsCount: await safeCount(() =>
      supabase
        .from("formation_dossier_trainers")
        .select("dossier_id", { count: "exact", head: true })
        .eq("is_pedagogical_referent", true),
    ),
    meansProcessReady: Boolean(processReady.moyens),
    examplePublicFormationSlug,
    exampleConvocationHref,
    exampleConvocationSentAt,
    needAnalysesCompleteCount: 0,
    exampleNeedAnalysisOrgId: null as string | null,
  };

  try {
    const needRes = await supabase
      .from("organization_need_analyses")
      .select("id, organization_id")
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(50);
    if (!needRes.error && needRes.data) {
      signals.needAnalysesCompleteCount = needRes.data.length;
      signals.exampleNeedAnalysisOrgId = needRes.data[0]?.organization_id
        ? String(needRes.data[0].organization_id)
        : null;
      if (needRes.data.length >= 50) {
        const { count } = await supabase
          .from("organization_need_analyses")
          .select("id", { count: "exact", head: true })
          .eq("status", "complete");
        if (typeof count === "number") signals.needAnalysesCompleteCount = count;
      }
    }
  } catch (e) {
    console.warn("[qualiopi/status] need analyses:", e);
  }

  // Ind. 31 / 32 — brief Qualité v2 (hors is_test)
  try {
    const deadlineSettings = {
      ackBusinessDays:
        Number((settingsRes.data as { reclamation_ack_business_days?: number } | null)?.reclamation_ack_business_days) ||
        DEFAULT_RECLAMATION_DEADLINES.ackBusinessDays,
      replyBusinessDays:
        Number((settingsRes.data as { reclamation_reply_business_days?: number } | null)?.reclamation_reply_business_days) ||
        DEFAULT_RECLAMATION_DEADLINES.replyBusinessDays,
    };

    let recRes = await supabase
      .from("crm_qualiopi_reclamations")
      .select(
        "id, status, received_at, ack_at, answered_at, closed_at, response, is_test",
      )
      .order("received_at", { ascending: false })
      .limit(500);
    if (recRes.error && /is_test|answered_at|column/i.test(recRes.error.message)) {
      recRes = await supabase
        .from("crm_qualiopi_reclamations")
        .select("id, status, received_at, ack_at, closed_at, response")
        .order("received_at", { ascending: false })
        .limit(500);
    }
    const recRows = (recRes.error ? [] : recRes.data ?? []) as ReclamationIndicatorRow[];
    const nonTest = recRows.filter((r) => r.is_test !== true);
    const openNonTest = nonTest.filter((r) => isOpenStep(resolveReclamationStep(r)));
    signals.reclamationsOpenCount = openNonTest.length;

    const hasOpenOverdue = openNonTest.some((r) => {
      const badge = computeDeadlineBadge(r, deadlineSettings);
      return badge.overdue || badge.tone === "red";
    });
    const s31 = scoreIndicator31({
      processReady: Boolean(processReady.reclamations),
      rows: nonTest,
      hasOpenOverdue,
    });
    signals.reclamationsTreatedCount = s31.treatedCount;
    signals.reclamationsAvgReplyLabel = s31.avgReplyHours != null ? String(s31.avgReplyHours) : null;
    signals.reclamationsIndicatorStatus = s31.status;
    signals.reclamationsProofLabel = s31.proofLabel;

    const actRes = await supabase
      .from("crm_qualiopi_actions")
      .select("id, status, reviewed_at, source, created_at, updated_at")
      .limit(500);
    const actRows = (actRes.error ? [] : actRes.data ?? []) as ActionIndicatorRow[];
    const s32 = scoreIndicator32({
      actions: actRows,
      risksCount: signals.risksCount,
      processPaqReady: Boolean(processReady.paq),
    });
    signals.actionsDoneLast12Count = s32.actionsDoneCount;
    signals.lastQualityReviewAt = s32.lastReviewAt;
    signals.ameliorationIndicatorStatus = s32.status;
    signals.ameliorationProofLabel = s32.proofLabel;
  } catch (e) {
    console.warn("[qualiopi/status] ind 31/32:", e);
  }

  // Procédures validées → preuves par indicateur
  try {
    const procRes = await supabase
      .from("crm_qualiopi_procedures")
      .select("id, title, current_version, validated_at, indicators, status, next_review_at")
      .eq("status", "validated");
    if (!procRes.error && procRes.data) {
      signals.validatedProcedures = procRes.data.map((p) => ({
        id: String(p.id),
        title: String(p.title),
        current_version: String(p.current_version ?? "1.0"),
        validated_at: p.validated_at ? String(p.validated_at) : null,
        indicators: Array.isArray(p.indicators) ? (p.indicators as number[]) : [],
      }));
      const { isDateOnlyBeforeToday } = await import("@/lib/qualiopi/reclamation-format");
      signals.procedureReviewOverdue = procRes.data.some(
        (p) => p.next_review_at && isDateOnlyBeforeToday(String(p.next_review_at)),
      );
    }
  } catch (e) {
    console.warn("[qualiopi/status] procedures:", e);
  }

  const attestRows = attestRes.error ? [] : attestRes.data ?? [];
  const naAttestations = attestRows
    .filter((r) => r.kind === "na" || !r.kind)
    .map((r) => ({
      indicatorId: Number(r.indicator_id),
      note: (r.note as string | null) ?? null,
    }));

  const manualProofs = (proofsRes.error ? [] : proofsRes.data ?? []).map((r) => ({
    indicatorId: Number(r.indicator_id),
    label: String(r.label),
    comment: (r.comment as string | null) ?? null,
    fileUrl: (r.file_url as string | null) ?? null,
    proofAt: String(r.proof_at),
    updatedAt: String(r.updated_at),
  }));

  const snapshot = getQualiopiStatus({
    documents,
    sessions,
    signals,
    activities: settings?.qualiopi_activities,
    auditType: settings?.qualiopi_audit_type ? String(settings.qualiopi_audit_type) : null,
    auditAt: settings?.qualiopi_audit_at ? String(settings.qualiopi_audit_at) : null,
    naAttestations,
    manualProofs,
  });

  cache = { at: Date.now(), payload: snapshot };
  return snapshot;
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const force = req.nextUrl.searchParams.get("refresh") === "1";
    const snapshot = await buildStatus(force);
    if (!snapshot) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    return NextResponse.json(snapshot);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur statut Qualiopi" },
      { status: 500 },
    );
  }
}
