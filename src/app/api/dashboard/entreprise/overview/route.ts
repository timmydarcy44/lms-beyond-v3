import { NextResponse } from "next/server";
import { buildEmptyEntrepriseOverviewPayload } from "@/lib/entreprise/overview-empty";
import {
  enrichNutrisetDemoOverview,
  shouldEnrichNutrisetDemo,
} from "@/lib/entreprise/nutriset-demo-enrich";
import {
  resolveEmployeeTestStatus,
  syncCollaborateurDiagnosticFromTests,
} from "@/lib/entreprise/employee-test-status";
import {
  getEntrepriseOverviewServiceClient,
  resolveEntrepriseOverviewAccess,
} from "@/lib/entreprise/overview-route";

export const dynamic = "force-dynamic";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ActivityItem = { id: string; title: string; at: string; kind: "badge" | "course" | "diagnostic" };

export async function GET() {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if ("superAdminPreview" in access && access.superAdminPreview) {
    return NextResponse.json({
      super_admin_preview: true,
      ...buildEmptyEntrepriseOverviewPayload(access.viewer),
    });
  }

  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({
      configuration_required: true,
      needsOnboarding: true,
      viewer: access.viewer,
      onboarding_href: "/onboarding",
      ...buildEmptyEntrepriseOverviewPayload(access.viewer),
    });
  }

  const orgId = access.organizationId;
  const service = getEntrepriseOverviewServiceClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const now = new Date();
  const today = isoDate(now);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = isoDate(weekEnd);

  const [
    { data: org, error: orgErr },
    { data: allEmployees, error: empErr },
    { data: allDiagnostics, error: diagErr },
    { data: latestAggregat, error: aggErr },
    { data: sessionsWeek, error: weekErr },
    { data: recentDiagnostics, error: recentDiagErr },
    { data: orgPaths, error: pathsErr },
    { data: orgSessions, error: sessionsErr },
  ] = await Promise.all([
    service.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    service
      .from("employees")
      .select("id, first_name, last_name, email, job_title, department, profile_id, created_at")
      .eq("company_id", orgId)
      .order("created_at", { ascending: false }),
    service
      .from("collaborateur_diagnostics")
      .select("id, employee_id, collaborateur_id, completed_at, idmc_score")
      .eq("organisation_id", orgId),
    service
      .from("equipe_aggregats")
      .select(
        "periode_debut, periode_fin, nb_diagnostics_completes, idmc_moyen, stress_moyen, cohesion_score, insight_principal, insuffisant, nb_signaux_attention, nb_signaux_critique",
      )
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    service
      .from("sessions_bct")
      .select("id, date_session, heure_debut, status, praticien_id")
      .eq("organization_id", orgId)
      .gte("date_session", today)
      .lte("date_session", weekEndStr)
      .order("date_session")
      .order("heure_debut"),
    service
      .from("collaborateur_diagnostics")
      .select("id, completed_at, collaborateur_id, employee_id")
      .eq("organisation_id", orgId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    service
      .from("paths")
      .select("id, title, status, org_id")
      .eq("org_id", orgId)
      .eq("status", "published")
      .limit(20),
    service
      .from("sessions_bct")
      .select("id, date_session, heure_debut, status, praticien_id, motif")
      .eq("organization_id", orgId)
      .gte("date_session", today)
      .order("date_session")
      .limit(12),
  ]);

  if (orgErr || !org) {
    console.error("[dashboard/entreprise/overview] org", orgErr);
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  if (empErr) console.error("[dashboard/entreprise/overview] employees", empErr);
  if (diagErr) console.error("[dashboard/entreprise/overview] diagnostics", diagErr);
  if (aggErr) console.error("[dashboard/entreprise/overview] aggregat", aggErr);
  if (weekErr) console.error("[dashboard/entreprise/overview] sessionsWeek", weekErr);
  if (recentDiagErr) console.error("[dashboard/entreprise/overview] recentDiagnostics", recentDiagErr);
  if (pathsErr) console.error("[dashboard/entreprise/overview] paths", pathsErr);
  if (sessionsErr) console.error("[dashboard/entreprise/overview] sessions", sessionsErr);

  const employees = allEmployees ?? [];
  const diagnostics = allDiagnostics ?? [];

  const employeeTestStatuses = new Map<
    string,
    Awaited<ReturnType<typeof resolveEmployeeTestStatus>>
  >();
  for (const emp of employees) {
    const status = await resolveEmployeeTestStatus(service, {
      id: emp.id as string,
      email: emp.email as string | null,
      profile_id: emp.profile_id as string | null,
      company_id: orgId,
      first_name: emp.first_name as string | null,
      last_name: emp.last_name as string | null,
    });
    employeeTestStatuses.set(emp.id as string, status);
    if (status.diagnostic_done) {
      await syncCollaborateurDiagnosticFromTests(
        service,
        {
          id: emp.id as string,
          email: emp.email as string | null,
          profile_id: status.profile_id,
          company_id: orgId,
          first_name: emp.first_name as string | null,
          last_name: emp.last_name as string | null,
        },
        orgId,
        status,
      );
    }
  }

  const profileIds = employees
    .map((e) => employeeTestStatuses.get(e.id as string)?.profile_id ?? (e.profile_id as string | null))
    .filter((id): id is string => Boolean(id));

  const diagByEmployee = new Map<string, { idmc_score: number | null; completed_at: string | null }>();
  for (const row of diagnostics) {
    const empId = row.employee_id as string | null;
    if (empId) {
      diagByEmployee.set(empId, {
        idmc_score: row.idmc_score as number | null,
        completed_at: row.completed_at as string | null,
      });
    }
  }

  let enrollmentsActive = 0;
  const pathStats: Array<{
    path_id: string;
    title: string;
    enrolled: number;
    completion_pct: number;
    avg_quiz_score: number | null;
    badges_count: number;
  }> = [];

  if (profileIds.length > 0 && (orgPaths ?? []).length > 0) {
    const pathIds = (orgPaths ?? []).map((p) => p.id as string);
    const { data: enrollments } = await service
      .from("path_enrollments")
      .select("user_id, path_id")
      .in("user_id", profileIds)
      .in("path_id", pathIds);

    const { data: progressRows } = await service
      .from("path_progress")
      .select("user_id, path_id, progress_percent")
      .in("user_id", profileIds)
      .in("path_id", pathIds);

    enrollmentsActive = (enrollments ?? []).length;

    for (const path of orgPaths ?? []) {
      const pid = path.id as string;
      const enrolled = (enrollments ?? []).filter((e) => e.path_id === pid).length;
      const progresses = (progressRows ?? []).filter((p) => p.path_id === pid);
      const avgProgress =
        progresses.length > 0
          ? Math.round(
              progresses.reduce((s, p) => s + Number(p.progress_percent ?? 0), 0) / progresses.length,
            )
          : 0;
      const completed = progresses.filter((p) => Number(p.progress_percent ?? 0) >= 100).length;
      const completion_pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : avgProgress;

      pathStats.push({
        path_id: pid,
        title: String(path.title ?? "Parcours"),
        enrolled,
        completion_pct,
        avg_quiz_score: null,
        badges_count: 0,
      });
    }
  }

  const praticienIds = Array.from(
    new Set((orgSessions ?? []).map((s) => s.praticien_id as string).filter(Boolean)),
  );
  const praticienNames = new Map<string, string>();
  if (praticienIds.length > 0) {
    const { data: praticiens } = await service
      .from("praticiens_bct")
      .select("id, prenom, nom")
      .in("id", praticienIds);
    for (const p of praticiens ?? []) {
      praticienNames.set(
        p.id as string,
        [p.prenom, p.nom].filter(Boolean).join(" ").trim() || "Formateur",
      );
    }
  }

  const employeesTotal = employees.length;
  const diagnosticsCompleted = employees.filter(
    (e) => employeeTestStatuses.get(e.id as string)?.all_tests_done,
  ).length;
  const diagnosticsTotal = Math.max(diagnostics.length, employeesTotal);
  const diagnosticsPct =
    employeesTotal > 0 ? Math.round((diagnosticsCompleted / employeesTotal) * 100) : 0;

  const insufficient =
    Boolean((latestAggregat as { insuffisant?: boolean })?.insuffisant) || diagnosticsCompleted < 5;

  const pendingCount = employees.filter(
    (e) => !employeeTestStatuses.get(e.id as string)?.all_tests_done,
  ).length;

  const recentActivity: ActivityItem[] = (recentDiagnostics ?? []).map((d) => ({
    id: `diag-${d.id as string}`,
    title: "Diagnostic complété",
    at: String(d.completed_at ?? ""),
    kind: "diagnostic" as const,
  }));

  const enrollmentByProfile = new Map<string, boolean>();
  if (profileIds.length > 0) {
    const { data: pe } = await service
      .from("path_enrollments")
      .select("user_id")
      .in("user_id", profileIds);
    for (const row of pe ?? []) {
      enrollmentByProfile.set(row.user_id as string, true);
    }
  }

  const payload = {
    viewer: access.viewer,
    organisation: {
      id: orgId,
      name: String((org as { name?: string })?.name ?? ""),
    },
    kpis: {
      employees_total: employeesTotal,
      diagnostics_completed: diagnosticsCompleted,
      diagnostics_total: diagnosticsTotal,
      diagnostics_pct: diagnosticsPct,
      enrollments_active: enrollmentsActive,
      attention_signals: insufficient
        ? { insufficient: true, completed: diagnosticsCompleted, threshold: 5 }
        : {
            insufficient: false,
            attention: Number((latestAggregat as { nb_signaux_attention?: number })?.nb_signaux_attention ?? 0),
            critical: Number((latestAggregat as { nb_signaux_critique?: number })?.nb_signaux_critique ?? 0),
          },
    },
    this_week: {
      from: today,
      to: weekEndStr,
      agenda: (sessionsWeek ?? []).map((s) => ({
        id: s.id as string,
        date: s.date_session as string,
        time: String(s.heure_debut ?? "").slice(0, 5),
        status: (s.status as string | null) ?? null,
      })),
      recent_activity: recentActivity,
    },
    equipe_insight: {
      week_end: (latestAggregat as { periode_fin?: string })?.periode_fin ?? null,
      insight: (latestAggregat as { insight_principal?: string })?.insight_principal ?? null,
      idmc: (latestAggregat as { idmc_moyen?: number })?.idmc_moyen ?? null,
      stress: (latestAggregat as { stress_moyen?: number })?.stress_moyen ?? null,
      cohesion: (latestAggregat as { cohesion_score?: number })?.cohesion_score ?? null,
      insufficient,
      completed: diagnosticsCompleted,
      threshold: 5,
    },
    employees: employees.map((e) => {
      const testStatus = employeeTestStatuses.get(e.id as string);
      const diag = diagByEmployee.get(e.id as string);
      const pid = testStatus?.profile_id ?? (e.profile_id as string | null);
      const hasEnrollment = pid ? enrollmentByProfile.has(pid) : false;
      return {
        id: e.id as string,
        first_name: (e.first_name as string | null) ?? null,
        last_name: (e.last_name as string | null) ?? null,
        email: (e.email as string | null) ?? null,
        job_title: (e.job_title as string | null) ?? null,
        department: (e.department as string | null) ?? null,
        created_at: (e.created_at as string | null) ?? null,
        diagnostic_done: Boolean(testStatus?.all_tests_done ?? diag?.completed_at),
        diagnostic_started: Boolean(testStatus?.diagnostic_done),
        idmc_score: testStatus?.idmc_score ?? diag?.idmc_score ?? null,
        formation_active: hasEnrollment,
      };
    }),
    collaborators_preview: employees.slice(0, 5).map((e) => {
      const testStatus = employeeTestStatuses.get(e.id as string);
      const diag = diagByEmployee.get(e.id as string);
      return {
        id: e.id as string,
        first_name: (e.first_name as string | null) ?? null,
        last_name: (e.last_name as string | null) ?? null,
        job_title: (e.job_title as string | null) ?? null,
        diagnostic_done: Boolean(testStatus?.all_tests_done ?? diag?.completed_at),
        idmc_score: testStatus?.idmc_score ?? diag?.idmc_score ?? null,
      };
    }),
    employees_pending: pendingCount,
    formations: {
      presentiel: (orgSessions ?? []).map((s) => ({
        id: s.id as string,
        title: String(s.motif ?? "Session de formation"),
        formateur: praticienNames.get(s.praticien_id as string) ?? "—",
        date: s.date_session as string,
        time: String(s.heure_debut ?? "").slice(0, 5),
        status: (s.status as string | null) ?? null,
        confirmed: s.status === "confirmee" || s.status === "terminee" ? 1 : 0,
        total: 1,
      })),
      elearning: pathStats,
    },
    mobility: {
      enabled: diagnosticsCompleted >= 10,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
  };

  if (shouldEnrichNutrisetDemo(orgId, access.viewer.email)) {
    return NextResponse.json(enrichNutrisetDemoOverview(payload));
  }

  return NextResponse.json(payload);
}
