import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: sessions, error } = await supabase
    .from("crm_qualiopi_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = (sessions ?? []).map((row) => row.id);
  const { data: attendees } = ids.length
    ? await supabase.from("crm_qualiopi_attendees").select("*").in("session_id", ids)
    : { data: [] };

  const bySession = new Map<string, typeof attendees>();
  for (const row of attendees ?? []) {
    const list = bySession.get(String(row.session_id)) ?? [];
    list.push(row);
    bySession.set(String(row.session_id), list);
  }

  return NextResponse.json({
    sessions: (sessions ?? []).map((session) => ({
      ...session,
      attendees: bySession.get(String(session.id)) ?? [],
    })),
  });
}
