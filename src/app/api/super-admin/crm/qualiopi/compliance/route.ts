import { NextResponse } from "next/server";

import { assessQualiopiCompliance } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const [docsRes, sessionsRes] = await Promise.all([
    supabase.from("crm_qualiopi_documents").select("*").order("kind"),
    supabase.from("crm_qualiopi_sessions").select("*").order("created_at", { ascending: false }),
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

  const snapshot = assessQualiopiCompliance({
    documents: (docsRes.data ?? []) as Parameters<typeof assessQualiopiCompliance>[0]["documents"],
    sessions: sessionsEnriched as Parameters<typeof assessQualiopiCompliance>[0]["sessions"],
  });

  return NextResponse.json(snapshot);
}
