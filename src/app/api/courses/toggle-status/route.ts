import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

type Body = {
  courseId: string;
  nextStatus: "draft" | "published";
};

export async function POST(req: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase non configuré" }, { status: 500 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Payload invalide" }, { status: 400 });
  }

  const courseId = String(body.courseId ?? "").trim();
  const nextStatus = body.nextStatus;
  if (!courseId) return NextResponse.json({ success: false, error: "courseId requis" }, { status: 400 });
  if (nextStatus !== "draft" && nextStatus !== "published") {
    return NextResponse.json({ success: false, error: "nextStatus invalide" }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, creator_id, owner_id, status")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) return NextResponse.json({ success: false, error: "Formation introuvable" }, { status: 404 });

  const isOwner = String(course.creator_id ?? "") === user.id || String(course.owner_id ?? "") === user.id;
  if (!isOwner) return NextResponse.json({ success: false, error: "Accès refusé" }, { status: 403 });

  const { data: updated, error: updateError } = await supabase
    .from("courses")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", courseId)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ success: false, error: updateError?.message || "Erreur lors de la mise à jour" }, { status: 500 });
  }

  return NextResponse.json({ success: true, course: updated });
}

