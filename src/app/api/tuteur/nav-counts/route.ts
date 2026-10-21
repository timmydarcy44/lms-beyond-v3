import { NextResponse } from "next/server";

import { listEvaluations, listTutorMissions, missionBucket, relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ missions: 0, evaluations: 0, livrets: 0 });
  const missions = await listTutorMissions(auth.ctx.supabase, auth.ctx.userId);
  const evaluations = await listEvaluations(auth.ctx.supabase, auth.ctx.userId);
  const livrets = await auth.ctx.supabase
    .from("booklet_periods")
    .select("id, booklet_id, status")
    .eq("status", "awaiting_tutor");
  let livretCount = 0;
  if (!relationMissing(livrets.error)) {
    const bookletIds = [...new Set((livrets.data ?? []).map((row) => String(row.booklet_id)))];
    if (bookletIds.length) {
      const owned = await auth.ctx.supabase.from("apprenticeship_booklets").select("id").eq("tutor_id", auth.ctx.userId).in("id", bookletIds);
      const mine = new Set((owned.data ?? []).map((row) => String(row.id)));
      livretCount = (livrets.data ?? []).filter((row) => mine.has(String(row.booklet_id))).length;
    }
  }
  return NextResponse.json({
    tutorName: auth.ctx.tutorName,
    missions: missions.filter((row) => missionBucket(row) === "a_valider").length,
    evaluations: evaluations.filter((row) => row.status === "to_fill").length,
    livrets: livretCount,
  });
}
