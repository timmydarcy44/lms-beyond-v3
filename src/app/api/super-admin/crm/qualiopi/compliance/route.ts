import { NextResponse } from "next/server";

import { assessQualiopiCompliance } from "@/lib/qualiopi/qualiopi-compliance-audit";
import type { QualiopiIndicatorAttestation } from "@/lib/qualiopi/qualiopi-compliance-signals";
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

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const [docsRes, sessionsRes, trainingRes, coursesRes, expertsRes, attestRes] = await Promise.all([
    supabase.from("crm_qualiopi_documents").select("*").order("kind"),
    supabase.from("crm_qualiopi_sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("training_courses").select("objectives"),
    supabase.from("courses").select("objectives").limit(500),
    supabase.from("experts").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
    supabase.from("crm_qualiopi_indicator_attestations").select("indicator_id, note, updated_at"),
  ]);

  const sessions = sessionsRes.data ?? [];
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
        }));

  const snapshot = assessQualiopiCompliance({
    documents: (docsRes.data ?? []) as Parameters<typeof assessQualiopiCompliance>[0]["documents"],
    sessions: sessionsEnriched as Parameters<typeof assessQualiopiCompliance>[0]["sessions"],
    signals: {
      coursesWithObjectives: countCoursesWithObjectives(trainingRes.data, coursesRes.data),
      approvedExperts: expertsRes.count ?? 0,
      attestations,
    },
  });

  return NextResponse.json(snapshot);
}
