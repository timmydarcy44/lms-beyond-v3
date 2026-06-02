import { NextResponse } from "next/server";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id || !profile) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const orgId = String(profile.company_id ?? "").trim() || null;
  if (!orgId) {
    return NextResponse.json({ error: "Organisation non configurée" }, { status: 403 });
  }

  const service = getServiceRoleClient();
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
    { count: diagCompletedCount, error: diagErr },
    { data: latestAggregat, error: aggErr },
    { data: employeesLatest, error: latestErr },
    { data: sessionsWeek, error: weekErr },
  ] = await Promise.all([
    service.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    service.from("employees").select("id", { count: "exact", head: true }).eq("company_id", orgId),
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
      .select("id, first_name, last_name, job_title, created_at")
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
  ]);

  if (orgErr || !org) {
    console.error("[dashboard/entreprise/overview] org", orgErr);
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
  }
  if (empErr) console.error("[dashboard/entreprise/overview] employees", empErr);
  if (diagErr) console.error("[dashboard/entreprise/overview] diagnostics", diagErr);
  if (aggErr) console.error("[dashboard/entreprise/overview] aggregat", aggErr);
  if (latestErr) console.error("[dashboard/entreprise/overview] employeesLatest", latestErr);
  if (weekErr) console.error("[dashboard/entreprise/overview] sessionsWeek", weekErr);

  const employeesTotal = Number(employeesCount ?? 0);
  const diagnosticsCompleted = Number(diagCompletedCount ?? 0);
  const diagnosticsPct = employeesTotal > 0 ? Math.round((diagnosticsCompleted / employeesTotal) * 100) : 0;

  const insufficient = Boolean((latestAggregat as any)?.insuffisant) || diagnosticsCompleted < 5;

  return NextResponse.json({
    viewer: {
      id: user.id,
      email: user.email ?? null,
      prenom: (profile as any).prenom ?? (profile as any).first_name ?? null,
      nom: (profile as any).nom ?? (profile as any).last_name ?? null,
    },
    organisation: {
      id: orgId,
      name: String((org as any)?.name ?? ""),
    },
    kpis: {
      employees_total: employeesTotal,
      diagnostics_completed: diagnosticsCompleted,
      diagnostics_pct: diagnosticsPct,
      trainings_in_progress: null,
      attention_signals: insufficient
        ? { insufficient: true, completed: diagnosticsCompleted, threshold: 5 }
        : {
            insufficient: false,
            attention: Number((latestAggregat as any)?.nb_signaux_attention ?? 0),
            critical: Number((latestAggregat as any)?.nb_signaux_critique ?? 0),
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
      recent_activity: [],
    },
    equipe_insight: {
      week_end: (latestAggregat as any)?.periode_fin ?? null,
      insight: (latestAggregat as any)?.insight_principal ?? null,
      idmc: (latestAggregat as any)?.idmc_moyen ?? null,
      stress: (latestAggregat as any)?.stress_moyen ?? null,
      cohesion: (latestAggregat as any)?.cohesion_score ?? null,
      insufficient,
      completed: diagnosticsCompleted,
      threshold: 5,
    },
    collaborators_preview: (employeesLatest ?? []).map((e) => ({
      id: e.id as string,
      first_name: (e.first_name as string | null) ?? null,
      last_name: (e.last_name as string | null) ?? null,
      job_title: (e.job_title as string | null) ?? null,
      diagnostic_done: null,
    })),
    mobility: {
      enabled: diagnosticsCompleted >= 10,
      completed: diagnosticsCompleted,
      threshold: 10,
    },
  });
}

