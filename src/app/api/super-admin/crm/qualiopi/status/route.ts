import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadDisabilityReferentContact } from "@/lib/handicap/referent-contact";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getQualiopiStatus, type QualiopiStatusSignals } from "@/lib/qualiopi/get-status";
import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";
import { assessQualiopiFicheCompliance } from "@/lib/training-courses/qualiopi-fiche";

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
          "id, objectives, is_active, results_method_override, formats, badge_name, badge_class_id, recognition_type, pedagogical_modality, pedagogical_modality_detail, financing_modalities, duration, price_on_quote, intra_price, inter_price",
        ),
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

  const courses = (trainingRes.error ? [] : trainingRes.data ?? []) as Array<{
    id: string;
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
  }>;
  if (trainingRes.error) {
    console.warn("[qualiopi/status] training_courses:", trainingRes.error.message);
  }
  const publicCourses = courses.filter((c) => c.is_active === true);
  const coursesPublicTotal = publicCourses.length;
  let coursesWithObjectives = 0;
  let coursesWithResults = 0;
  let coursesPublicWithInfo = 0;
  let coursesCompliantCount = 0;
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
    if (compliance.ok) coursesCompliantCount += 1;
  }

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

  const disabilityCasesCount = await safeCount(() =>
    supabase.from("disability_cases").select("id", { count: "exact", head: true }),
  );
  const disabilityAccommodationsCount = await safeCount(() =>
    supabase.from("disability_accommodations").select("id", { count: "exact", head: true }),
  );
  const handicapProfilesRaw = await safeCount(() =>
    supabase.from("handicap_profiles").select("id", { count: "exact", head: true }),
  );

  const signals: QualiopiStatusSignals = {
    coursesPublicWithInfo,
    coursesPublicTotal,
    coursesCompliantCount,
    coursesWithResults,
    coursesWithObjectives,
    infoPackCompleteCount,
    infoPackPartialCount,
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
    reclamationsOpenCount: await safeCount(() =>
      supabase
        .from("crm_qualiopi_reclamations")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "pending", "nouveau", "en_cours"]),
    ),
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
  };

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
