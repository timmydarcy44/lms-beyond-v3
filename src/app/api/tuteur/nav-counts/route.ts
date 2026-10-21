import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { listEvaluations, listTutorMissions, missionBucket, relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ missions: 0, evaluations: 0, livrets: 0, messages: 0 });
  if (isJadeDemoEmail(auth.ctx.email)) {
    return NextResponse.json({ tutorName: "Jade Martin", missions: 2, evaluations: 1, livrets: 1, messages: 3 });
  }
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
  const messages = await unreadForTutor(auth.ctx.supabase, auth.ctx.userId);
  return NextResponse.json({
    tutorName: auth.ctx.tutorName,
    missions: missions.filter((row) => missionBucket(row) === "a_valider").length,
    evaluations: evaluations.filter((row) => row.status === "to_fill").length,
    livrets: livretCount,
    messages,
  });
}

async function unreadForTutor(supabase: SupabaseClient, userId: string) {
  const parts = await supabase.from("tutor_conversation_participants").select("conversation_id, last_read_at").eq("user_id", userId);
  if (relationMissing(parts.error) || !parts.data?.length) return 0;
  let total = 0;
  for (const part of parts.data as Array<{ conversation_id: string; last_read_at: string | null }>) {
    const since = part.last_read_at ?? "1970-01-01T00:00:00.000Z";
    const result = await supabase
      .from("tutor_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", part.conversation_id)
      .neq("sender_id", userId)
      .gt("created_at", since);
    if (relationMissing(result.error)) return 0;
    total += result.count ?? 0;
  }
  return total;
}
