import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_EXPERT_MISSIONS } from "@/lib/demo/jade-dashboard-mocks";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ missions: 0, documents: 0 });

  if (isJadeDemoEmail(session.email)) {
    return NextResponse.json({
      missions: JADE_EXPERT_MISSIONS.filter((row) => row.status === "expert_notified").length,
      documents: 1,
    });
  }

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ missions: 0, documents: 0 });

  const { count, error } = await supabase
    .from("action_requests")
    .select("id", { count: "exact", head: true })
    .eq("expert_id", session.id)
    .eq("status", "expert_notified");

  return NextResponse.json({
    missions: error ? 0 : count ?? 0,
    documents: 0,
  });
}
