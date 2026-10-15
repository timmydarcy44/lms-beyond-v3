import { NextRequest, NextResponse } from "next/server";

import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { courseId?: string; leafId?: string; leafTitle?: string } | null;
  const courseId = String(body?.courseId ?? "").trim();
  const leafId = String(body?.leafId ?? "").trim();
  const leafTitle = String(body?.leafTitle ?? "").trim().slice(0, 240) || null;
  if (!UUID_RE.test(courseId) || !leafId || leafId.length > 200) {
    return NextResponse.json({ error: "Chapitre invalide" }, { status: 400 });
  }

  const db = (await getServiceRoleClientOrFallback()) ?? supabase;
  const { error } = await db.from("learner_leaf_completions").upsert(
    {
      user_id: userId,
      course_id: courseId,
      leaf_id: leafId,
      leaf_title: leafTitle,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id,leaf_id" },
  );

  if (error) {
    console.error("[leaf-completion]", error.code, error.message);
    return NextResponse.json({ saved: false, error: error.message }, { status: 200 });
  }
  return NextResponse.json({ saved: true });
}
