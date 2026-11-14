import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getQualiopiStatus, type QualiopiStatusSignals } from "@/lib/qualiopi/get-status";
import type { QualiopiDocument, QualiopiSession } from "@/lib/crm/qualiopi-shared";

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
      supabase.from("training_courses").select("id, objectives, published, is_public, quality_indicators"),
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

  const courses = trainingRes.error ? [] : trainingRes.data ?? [];
  const publicCourses = courses.filter(
    (c) => c.published === true || c.is_public === true || c.published == null,
  );
  const coursesPublicTotal = publicCourses.length || courses.length;
  let coursesWithObjectives = 0;
  let coursesWithResults = 0;
  let coursesPublicWithInfo = 0;
  for (const row of courses) {
    const objs = row.objectives;
    const hasObj =
      (Array.isArray(objs) && objs.filter((o) => String(o).trim()).length >= 3) ||
      (typeof objs === "string" && objs.trim().length >= 20);
    if (hasObj) {
      coursesWithObjectives += 1;
      coursesPublicWithInfo += 1;
    }
    const qi = row.quality_indicators;
    if (qi && (Array.isArray(qi) ? qi.length > 0 : typeof qi === "object")) {
      coursesWithResults += 1;
    }
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

  const signals: QualiopiStatusSignals = {
    coursesPublicWithInfo,
    coursesPublicTotal,
    coursesWithResults,
    coursesWithObjectives,
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
    handicapProfilesCount: await safeCount(() =>
      supabase.from("handicap_profiles").select("id", { count: "exact", head: true }),
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
