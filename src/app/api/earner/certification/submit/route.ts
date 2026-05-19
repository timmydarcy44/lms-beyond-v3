import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type Payload = {
  courseId?: string;
  badgeId?: string;
  evaluationType?: string;
  data?: unknown;
};

export async function POST(req: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ success: false, error: "JSON invalide" }, { status: 400 });
  }

  const courseId = String(body?.courseId ?? "").trim();
  const badgeId = String(body?.badgeId ?? "").trim();
  const evaluationType = String(body?.evaluationType ?? "").trim();
  if (!courseId) return NextResponse.json({ success: false, error: "courseId requis" }, { status: 400 });
  if (!badgeId) return NextResponse.json({ success: false, error: "badgeId requis" }, { status: 400 });
  if (!evaluationType) return NextResponse.json({ success: false, error: "evaluationType requis" }, { status: 400 });

  const { data, error } = await supabase
    .from("badge_submissions")
    .insert({
      course_id: courseId,
      badge_id: badgeId,
      user_id: user.id,
      evaluation_type: evaluationType,
      payload: body?.data ?? {},
      status: "submitted",
    } as any)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message, details: error.details, hint: error.hint, code: (error as any)?.code }, { status: 400 });
  }

  return NextResponse.json({ success: true, submissionId: data?.id });
}

