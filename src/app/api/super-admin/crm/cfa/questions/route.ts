import { NextRequest, NextResponse } from "next/server";

import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";

export async function GET() {
  if (!(await isCurrentUserSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data, error } = await db
    .from("admission_challenge_questions")
    .select("id, specialization, slug, label, prompt, starter_hint, sort_order, active, updated_at")
    .order("specialization")
    .order("sort_order");
  if (error) {
    return NextResponse.json({
      questions: [],
      specializations: CFA_SPECIALIZATIONS,
      error: error.message,
      migrationNeeded: true,
    });
  }
  return NextResponse.json({
    questions: data ?? [],
    specializations: [{ value: "common", label: "Commune à toutes les filières" }, ...CFA_SPECIALIZATIONS, { value: "_fallback", label: "Secours (autres filières)" }],
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isCurrentUserSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = String(body?.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ["label", "prompt", "starter_hint", "active", "sort_order"] as const) {
    if (body?.[key] !== undefined) patch[key] = body[key];
  }

  const { data: updated, error } = await db
    .from("admission_challenge_questions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Nouvelle version si prompt/label changent
  if (body?.prompt !== undefined || body?.label !== undefined) {
    const { data: last } = await db
      .from("admission_challenge_question_versions")
      .select("version")
      .eq("question_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = Number(last?.version ?? 0) + 1;
    await db.from("admission_challenge_question_versions").insert({
      question_id: id,
      version: nextVersion,
      label: updated.label,
      prompt: updated.prompt,
      starter_hint: updated.starter_hint,
    });
  }

  return NextResponse.json({ question: updated });
}
