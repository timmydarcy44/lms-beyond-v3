import { NextResponse } from "next/server";

import { canPlayCourse, loadScenario, pickVariant, requireUser, savePrivate } from "@/lib/interview/situation-engine";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const lessonId = String(body?.lessonId ?? "").trim();
  const courseId = String(body?.courseId ?? "").trim();
  if (!lessonId || !courseId) return NextResponse.json({ error: "Cours ou leçon manquant" }, { status: 400 });
  if (!(await canPlayCourse(user.id, courseId))) {
    return NextResponse.json({ error: "Vous n'êtes pas inscrit à ce cours" }, { status: 403 });
  }

  const loaded = await loadScenario(lessonId);
  if (!loaded) return NextResponse.json({ error: "Scénario introuvable" }, { status: 404 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: existing } = await db
    .from("experiential_interview_sessions")
    .select("id, status, messages, user_turn_count, score, ending, passed, feedback_md, criteria, variant_name")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .eq("interview_style", "mise_en_situation")
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ resumed: true, session: existing });
  }

  const variant = pickVariant(loaded.scenario);
  const opening = variant.opening;
  const now = new Date().toISOString();
  const messages = [{ role: "assistant", content: opening }];
  const { data: created, error } = await db
    .from("experiential_interview_sessions")
    .insert({
      user_id: user.id,
      course_id: courseId,
      lesson_id: lessonId,
      interview_style: "mise_en_situation",
      chapter_title: loaded.scenario.title,
      status: "in_progress",
      user_turn_count: 0,
      messages,
      variant_id: variant.id,
      variant_name: variant.name,
      started_at: now,
      completed_at: now,
      duration_seconds: 0,
    })
    .select("id")
    .single();
  if (error || !created) return NextResponse.json({ error: error?.message || "Création impossible" }, { status: 500 });

  await savePrivate(String((created as { id: string }).id), [{ role: "assistant", content: opening }], [null]);
  if (!loaded.row.course_id) {
    await db.from("experiential_interview_scenarios").update({ course_id: courseId }).eq("block_id", lessonId);
  }

  return NextResponse.json({
    resumed: false,
    session: {
      id: (created as { id: string }).id,
      status: "in_progress",
      messages,
      user_turn_count: 0,
      variant_name: variant.name,
    },
  });
}
