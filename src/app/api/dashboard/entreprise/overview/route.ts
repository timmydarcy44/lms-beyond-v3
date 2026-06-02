import { NextResponse } from "next/server";
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

  if ("configurationRequired" in access && access.configurationRequired) {
    return NextResponse.json({
      configuration_required: true,
      viewer: access.viewer,
      onboarding_href: "/onboarding",
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
    { count: employeesCount, error: empErr },
    { count: diagTotalCount, error: diagTotalErr },
    { count: diagCompletedCount, error: diagErr },
    { data: latestAggregat, error: aggErr },
    { data: employeesLatest, error: latestErr },
    { data: sessionsWeek, error: weekErr },
    { data: recentDiagnostics, error: recentDiagErr },
    { data: employeeProfiles, error: profilesErr },
  ] = await Promise.all([
    service.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    service.from("employees").select("id", { count: "exact", head: true }).eq("company_id", orgId),
    service
      .from("collaborateur_diagnostics")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId),
    service
      .from("collaborateur_diagnostics")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .not("completed_at", "is", null),
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
      .from("employees")
      .select("id, first_name, last_name, job_title, profile_id, created_at")
      .eq("company_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5),
    service
      .from("sessions_bct")
      .select("id, date_session, heure_debut, status")
      .eq("organization_id", orgId)
      .gte("date_session", today)
      .lte("date_session", weekEndStr)
      .order("date_session")
      .order("heure_debut"),
    service
      .from("collaborateur_diagnostics")
      .select("id, completed_at, collaborateur_id")
      .eq("organisation_id", orgId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    service.from("employees").select("profile_id").eq("company_id", orgId).not("profile_id", "is", null),
  ]);

  if (orgErr || !org) {
    console.error("[dashboard/entreprise/overview] org", orgErr);
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  if (empErr) console.error("[dashboard/entreprise/overview] employees", empErr);
  if (diagTotalErr) console.error("[dashboard/entreprise/overview] diagnostics total", diagTotalErr);
  if (diagErr) console.error("[dashboard/entreprise/overview] diagnostics", diagErr);
  if (aggErr) console.error("[dashboard/entreprise/overview] aggregat", aggErr);
  if (latestErr) console.error("[dashboard/entreprise/overview] employeesLatest", latestErr);
  if (weekErr) console.error("[dashboard/entreprise/overview] sessionsWeek", weekErr);
  if (recentDiagErr) console.error("[dashboard/entreprise/overview] recentDiagnostics", recentDiagErr);
  if (profilesErr) console.error("[dashboard/entreprise/overview] employeeProfiles", profilesErr);

  const profileIds = (employeeProfiles ?? [])
    .map((row) => row.profile_id as string | null)
    .filter((id): id is string => Boolean(id));

  let trainingsInProgress = 0;
  if (profileIds.length > 0) {
    const { count, error: pathErr } = await service
      .from("path_enrollments")
      .select("user_id", { count: "exact", head: true })
      .in("user_id", profileIds);
    if (pathErr) {
      console.error("[dashboard/entreprise/overview] path_enrollments", pathErr);
    } else {
      trainingsInProgress = Number(count ?? 0);
    }
  }

  const employeeIds = (employeesLatest ?? []).map((e) => e.id as string);
  const diagByEmployee = new Map<string, { idmc_score: number | null; completed_at: string | null }>();

  if (employeeIds.length > 0) {
    const { data: diagRows } = await service
      .from("collaborateur_diagnostics")
      .select("employee_id, idmc_score, completed_at")
      .eq("organisation_id", orgId)
      .in("employee_id", employeeIds);

    for (const row of diagRows ?? []) {
      if (row.employee_id) {
        diagByEmployee.set(row.employee_id as string, {
          idmc_score: row.idmc_score as number | null,
          completed_at: row.completed_at as string | null,
        });
      }
    }
  }

  const employeesTotal = Number(employeesCount ?? 0);
  const diagnosticsTotal = Math.max(Number(diagTotalCount ?? 0), employeesTotal);
  const diagnosticsCompleted = Number(diagCompletedCount ?? 0);
  const diagnosticsPct =
    diagnosticsTotal > 0 ? Math.round((diagnosticsCompleted / diagnosticsTotal) * 100) : 0;

  const insufficient = Boolean((latestAggregat as { insuffisant?: boolean })?.insuffisant) || diagnosticsCompleted < 5;

  const recentActivity: ActivityItem[] = (recentDiagnostics ?? []).map((d) => ({
    id: `diag-${d.id as string}`,
    title: "Diagnostic complété",
    at: String(d.completed_at ?? ""),
    kind: "diagnostic" as const,
  }));

  return NextResponse.json({
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
      trainings_in_progress: trainingsInProgress,
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
    collaborators_preview: (employeesLatest ?? []).map((e) => {
      const diag = diagByEmployee.get(e.id as string);
      return {
        id: e.id as string,
        first_name: (e.first_name as string | null) ?? null,
        last_name: (e.last_name as string | null) ?? null,
        job_title: (e.job_title as string | null) ?? null,
        diagnostic_done: Boolean(diag?.completed_at),
        idmc_score: diag?.idmc_score ?? null,
      };
    }),
    mobility: {
      enabled: diagnosticsCompleted >= 10,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
  });
}
