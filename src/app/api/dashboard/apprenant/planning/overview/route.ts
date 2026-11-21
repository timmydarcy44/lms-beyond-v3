import { NextResponse } from "next/server";

import { loadLearnerPlanningOverview } from "@/lib/apprenant/planning-overview";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Vue complète Mon planning (calendrier + séances + contrat). */
export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });
  const db = getServiceRoleClient() ?? supabase;

  try {
    const overview = await loadLearnerPlanningOverview(db, session.id);
    return NextResponse.json(overview);
  } catch (e) {
    const message = e instanceof Error ? e.message : "LOAD_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
