import { NextRequest, NextResponse } from "next/server";

import { assessQualiopiCompliance } from "@/lib/qualiopi/qualiopi-compliance-audit";
import type {
  QualiopiAuditSignals,
  QualiopiIndicatorAttestation,
} from "@/lib/qualiopi/qualiopi-compliance-signals";
import { buildQualiopiGrillePdf } from "@/lib/qualiopi/grille-pdf";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

function countCoursesWithObjectives(
  trainingRows: { objectives?: string[] | null }[] | null,
  courseRows: { objectives?: string | null }[] | null,
): number {
  let n = 0;
  for (const row of trainingRows ?? []) {
    if (Array.isArray(row.objectives) && row.objectives.filter((o) => String(o).trim()).length >= 3) {
      n += 1;
    }
  }
  for (const row of courseRows ?? []) {
    const raw = row.objectives;
    if (!raw || typeof raw !== "string") continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.filter((o) => String(o).trim()).length >= 3) n += 1;
    } catch {
      if (raw.trim().length >= 20) n += 1;
    }
  }
  return n;
}

async function safeSelect<T>(
  run: () => PromiseLike<{ data: T | null; error: { message: string } | null; count?: number | null }>,
): Promise<{ data: T | null; count: number }> {
  try {
    const res = await run();
    if (res.error) return { data: null, count: 0 };
    return { data: res.data, count: res.count ?? 0 };
  } catch {
    return { data: null, count: 0 };
  }
}

async function buildSnapshot() {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 90);
  const sinceIso = since.toISOString();

  const [docsRes, sessionsRes, trainingRes, coursesRes, expertsRes] = await Promise.all([
    supabase.from("crm_qualiopi_documents").select("*").order("kind"),
    supabase.from("crm_qualiopi_sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("training_courses").select("objectives"),
    supabase.from("courses").select("objectives").limit(500),
    supabase.from("experts").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
  ]);

  let attestRes = await supabase
    .from("crm_qualiopi_indicator_attestations")
    .select("indicator_id, note, updated_at, kind");
  if (attestRes.error && /kind|column/i.test(attestRes.error.message)) {
    attestRes = await supabase
      .from("crm_qualiopi_indicator_attestations")
      .select("indicator_id, note, updated_at");
  }

  const highlightsSafe = await safeSelect(() =>
    supabase
      .from("crm_qualiopi_veille_highlights")
      .select("status, theme, updated_at, created_at")
      .gte("created_at", sinceIso)
      .limit(200),
  );
  const processSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_process_docs").select("kind, status"),
  );
  const reclamationsSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_reclamations").select("id", { count: "exact", head: true }),
  );
  const signalementsSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_signalements").select("id", { count: "exact", head: true }),
  );
  const risksSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_risks").select("id", { count: "exact", head: true }),
  );
  const risksOpenSafe = await safeSelect(() =>
    supabase
      .from("crm_qualiopi_risks")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "monitoring"]),
  );
  const expertsEmploymentSafe = await safeSelect(() =>
    supabase
      .from("experts")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "approved")
      .not("employment_status", "is", null),
  );
  const expertsSalarieSafe = await safeSelect(() =>
    supabase
      .from("experts")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "approved")
      .eq("employment_status", "salarie"),
  );
  const today = new Date().toISOString().slice(0, 10);
  const expertsSstMetaSafe = await safeSelect(() =>
    supabase
      .from("experts")
      .select("id", { count: "exact", head: true })
      .eq("review_status", "approved")
      .in("employment_status", ["independant", "portage"])
      .not("subcontract_signed_at", "is", null)
      .not("quality_commitment_at", "is", null)
      .or(`subcontract_ends_at.is.null,subcontract_ends_at.gte.${today}`),
  );
  const actionsSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_actions").select("id, status, reviewed_at"),
  );
  const plansSafe = await safeSelect(() =>
    supabase.from("crm_qualiopi_formateur_plans").select("id", { count: "exact", head: true }),
  );
  const formateurActionsSafe = await safeSelect(() =>
    supabase
      .from("crm_qualiopi_formateur_actions")
      .select("id", { count: "exact", head: true })
      .eq("status", "done"),
  );
  const lmsEnrollmentsSafe = await safeSelect(() =>
    supabase.from("formation_lms_enrollments").select("id", { count: "exact", head: true }),
  );
  const pedagogicalReferentsSafe = await safeSelect(() =>
    supabase
      .from("formation_dossier_trainers")
      .select("dossier_id", { count: "exact", head: true })
      .eq("is_pedagogical_referent", true),
  );
  const exitsSafe = await safeSelect(() =>
    supabase.from("formation_participant_exits").select("id", { count: "exact", head: true }),
  );
  const handicapProfilesSafe = await safeSelect(() =>
    supabase.from("handicap_profiles").select("id", { count: "exact", head: true }),
  );
  const handicapDocsSafe = await safeSelect(() =>
    supabase.from("handicap_documents").select("id", { count: "exact", head: true }),
  );

  // Exclure les sessions liées à un dossier spécimen (Lot 7)
  const specimenSafe = await safeSelect(() =>
    supabase
      .from("formation_dossiers")
      .select("legacy_qualiopi_session_id, session_id")
      .eq("is_specimen", true),
  );
  const specimenSessionIds = new Set<string>();
  for (const row of (specimenSafe.data as Array<{
    legacy_qualiopi_session_id?: string | null;
    session_id?: string | null;
  }> | null) ?? []) {
    if (row.legacy_qualiopi_session_id) specimenSessionIds.add(String(row.legacy_qualiopi_session_id));
    if (row.session_id) specimenSessionIds.add(String(row.session_id));
  }

  const sessions = (sessionsRes.data ?? []).filter(
    (s) => !specimenSessionIds.has(String(s.id)),
  );
  const ids = sessions.map((s) => s.id as string);
  let attendees: Record<string, unknown>[] = [];
  if (ids.length) {
    const { data } = await supabase.from("crm_qualiopi_attendees").select("*").in("session_id", ids);
    attendees = data ?? [];
  }

  const sessionsEnriched = sessions.map((s) => ({
    ...s,
    attendees: attendees.filter((a) => a.session_id === s.id),
  }));

  const attestations: QualiopiIndicatorAttestation[] =
    attestRes.error || !attestRes.data
      ? []
      : attestRes.data.map((row) => ({
          indicatorId: row.indicator_id as number,
          note: (row.note as string | null) ?? null,
          updatedAt: String(row.updated_at),
          kind:
            row.kind === "na" || row.kind === "evidence"
              ? (row.kind as "na" | "evidence")
              : undefined,
        }));

  const highlights = (highlightsSafe.data as Array<{ status: string; theme: string | null }> | null) ?? [];
  const reglementaireDone = highlights.filter((h) => h.status === "done" && h.theme === "reglementaire").length;
  const metierDone = highlights.filter((h) => h.status === "done" && h.theme === "metier").length;
  const pedagogieDone = highlights.filter((h) => h.status === "done" && h.theme === "pedagogie").length;
  const anyDone = highlights.filter((h) => h.status === "done").length;
  const anySaved = highlights.length;

  const processDocsReady: NonNullable<QualiopiAuditSignals["processDocsReady"]> = {};
  for (const row of (processSafe.data as Array<{ kind: string; status: string }> | null) ?? []) {
    if (row.status === "ready" || row.status === "attested") {
      processDocsReady[row.kind as keyof typeof processDocsReady] = true;
    }
  }

  const actions = (actionsSafe.data as Array<{ status: string; reviewed_at: string | null }> | null) ?? [];
  const actionsDoneCount = actions.filter((a) => a.status === "done").length;
  const actionsReviewed = actions.some((a) => a.reviewed_at || a.status === "done");

  return assessQualiopiCompliance({
    documents: (docsRes.data ?? []) as Parameters<typeof assessQualiopiCompliance>[0]["documents"],
    sessions: sessionsEnriched as Parameters<typeof assessQualiopiCompliance>[0]["sessions"],
    signals: {
      coursesWithObjectives: countCoursesWithObjectives(trainingRes.data, coursesRes.data),
      approvedExperts: expertsRes.count ?? 0,
      attestations,
      veille: {
        reglementaireDone: reglementaireDone || (anyDone >= 3 ? 1 : 0),
        metierDone: metierDone || (anyDone >= 3 ? 1 : 0),
        pedagogieDone: pedagogieDone || (anyDone >= 3 ? 1 : 0),
        anyDone,
        anySaved,
      },
      reclamationsProcessReady: Boolean(processDocsReady.reclamations),
      reclamationsCount: reclamationsSafe.count,
      signalementsProcessReady: Boolean(processDocsReady.signalements),
      signalementsCount: signalementsSafe.count,
      risksCount: risksSafe.count,
      risksOpenCount: risksOpenSafe.count,
      subcontractExpertsCount: expertsEmploymentSafe.count,
      subcontractReadyCount:
        (expertsSalarieSafe.count ?? 0) + (expertsSstMetaSafe.count ?? 0),
      actionsReviewed,
      actionsDoneCount,
      formateurPlansCount: plansSafe.count,
      formateurActionsDoneCount: formateurActionsSafe.count,
      processDocsReady,
      lmsEnrollmentsCount: lmsEnrollmentsSafe.count,
      pedagogicalReferentsCount: pedagogicalReferentsSafe.count,
      exitsCount: exitsSafe.count,
      handicapProfilesCount: handicapProfilesSafe.count,
      handicapDocsCount: handicapDocsSafe.count,
    },
  });
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const snapshot = await buildSnapshot();
  if (!snapshot) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  if (req.nextUrl.searchParams.get("format") === "pdf") {
    const pdf = buildQualiopiGrillePdf(snapshot);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="grille-qualiopi-rnq-v10-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  return NextResponse.json(snapshot);
}
