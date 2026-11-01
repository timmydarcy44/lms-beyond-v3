import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

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

  const { data: submission } = await supabase
    .from("badge_submissions")
    .select("id, status, created_at")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const admin = getServiceRoleClient();
  let linkedOpenBadges: Array<{ id: string; name: string; level: number | null }> = [];
  if (admin) {
    const listed = await admin.from("open_badges").select("id, name, title, status, required_course_id, evaluation_config").limit(400);
    linkedOpenBadges = (listed.data ?? []).flatMap((row) => {
      if (String(row.status ?? "").toLowerCase() !== "active") return [];
      const config = row.evaluation_config && typeof row.evaluation_config === "object" ? row.evaluation_config as Record<string, unknown> : {};
      const builder = config.builder && typeof config.builder === "object" ? config.builder as Record<string, unknown> : {};
      const linked = String(builder.linkedCourseId ?? builder.associatedCourseId ?? row.required_course_id ?? "");
      if (linked !== courseId) return [];
      const level = typeof config.level === "number" ? config.level : null;
      return [{ id: String(row.id), name: String(row.name ?? row.title ?? "Badge"), level }];
    });
  }

  return NextResponse.json({ success: true, badge: data ?? null, submission: submission ?? null, linkedOpenBadges });
}

