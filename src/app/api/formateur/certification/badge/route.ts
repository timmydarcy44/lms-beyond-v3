import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type BadgeConfig = {
  id?: string;
  course_id: string;
  label: string;
  level?: string | null;
  objectives?: string[] | null;
  modalities?: string | null;
  evaluation_type?: string | null;
  quiz_test_id?: string | null;
  case_prompt?: string | null;
  audio_scenario?: string | null;
  video_presentation_url?: string | null;
  technical_deliverable_url?: string | null;
  active?: boolean | null;
};

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
    .order("updated_at", { ascending: false })
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: error.message, code: (error as any)?.code }, { status: 400 });
  }

  return NextResponse.json({ success: true, badge: data ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

  let body: BadgeConfig;
  try {
    body = (await req.json()) as BadgeConfig;
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalide" }, { status: 400 });
  }

  const courseId = String(body?.course_id ?? "").trim();
  const label = String(body?.label ?? "").trim();
  if (!courseId) return NextResponse.json({ success: false, error: "course_id requis" }, { status: 400 });
  if (!label) return NextResponse.json({ success: false, error: "label requis" }, { status: 400 });

  // On utilise code comme identifiant stable par cours (évite les doublons).
  const code = `course-${courseId}`;

  const row: Record<string, unknown> = {
    course_id: courseId,
    code,
    label,
    level: body.level ?? null,
    objectives: Array.isArray(body.objectives) ? body.objectives : [],
    modalities: body.modalities ?? null,
    evaluation_type: body.evaluation_type ?? null,
    quiz_test_id: body.quiz_test_id ?? null,
    case_prompt: body.case_prompt ?? null,
    audio_scenario: body.audio_scenario ?? null,
    video_presentation_url: body.video_presentation_url ?? null,
    technical_deliverable_url: body.technical_deliverable_url ?? null,
    active: Boolean(body.active),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("badges").upsert(row as any, { onConflict: "code" }).select("*").single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message, details: error.details, hint: error.hint, code: (error as any)?.code }, { status: 400 });
  }

  return NextResponse.json({ success: true, badge: data });
}

