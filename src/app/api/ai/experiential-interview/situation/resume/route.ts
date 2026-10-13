import { NextResponse } from "next/server";

import { requireUser } from "@/lib/interview/situation-engine";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const lessonId = new URL(request.url).searchParams.get("lessonId")?.trim() ?? "";
  if (!lessonId) return NextResponse.json({ error: "lessonId requis" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ session: null });
  const { data } = await db
    .from("experiential_interview_sessions")
    .select("id, status, messages, user_turn_count, score, criteria, ending, passed, feedback_md, variant_name")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("interview_style", "mise_en_situation")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ session: data ?? null });
}
