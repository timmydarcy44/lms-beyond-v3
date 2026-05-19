import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = String(searchParams.get("courseId") ?? "").trim();
  if (!courseId) return NextResponse.json({ success: false, error: "courseId requis" }, { status: 400 });

  const { data, error } = await supabase
    .from("badges")
    .select("id, course_id, label, level, objectives, modalities, evaluation_type, quiz_test_id, case_prompt, audio_scenario, video_presentation_url, technical_deliverable_url, active, updated_at")
    .eq("course_id", courseId)
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message, code: (error as any)?.code }, { status: 400 });
  }

  return NextResponse.json({ success: true, badge: data ?? null });
}

