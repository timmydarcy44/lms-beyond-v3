import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ enrollmentId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { enrollmentId } = await params;
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user?.id) {
    return NextResponse.json({ ok: false, errorId: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = await request.json();
  const { title, url, artifact_type, step_id, metadata } = payload ?? {};

  if (!url || typeof url !== "string") {
    return NextResponse.json({ ok: false, errorId: "MISSING_URL" }, { status: 400 });
  }

  const { data: created, error } = await supabase
    .from("bns_user_proof_artifacts")
    .insert({
      enrollment_id: enrollmentId,
      user_id: authData.user.id,
      title: typeof title === "string" ? title : null,
      url,
      artifact_type: typeof artifact_type === "string" ? artifact_type : "link",
      step_id: typeof step_id === "string" ? step_id : null,
      metadata: typeof metadata === "object" && metadata ? metadata : null,
    })
    .select("id, title, url, artifact_type, step_id, created_at")
    .maybeSingle();

  if (error || !created) {
    return NextResponse.json({ ok: false, errorId: "ARTIFACT_CREATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, artifact: created });
}

