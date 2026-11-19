import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const track = request.nextUrl.searchParams.get("track")?.trim() || "ai_business";
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const { data: common } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("specialization", "common")
    .order("sort_order");
  const { data: questions } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("specialization", track)
    .order("sort_order");

  return NextResponse.json({ common: common ?? [], questions: questions ?? [] });
}

export async function PATCH(request: Request) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body?.id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });

  const id = String(body.id);
  const { data: current } = await db
    .from("admission_challenge_questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!current) return NextResponse.json({ error: "Question introuvable" }, { status: 404 });

  const label = String(body.label ?? current.label).trim();
  const prompt = String(body.prompt ?? current.prompt).trim();
  const starter = String(body.starter_hint ?? current.starter_hint ?? "").trim();
  const active = body.active === undefined ? current.active : Boolean(body.active);
  const sortOrder = Number(body.sort_order ?? current.sort_order) || 0;

  const textChanged = label !== current.label || prompt !== current.prompt || starter !== (current.starter_hint ?? "");

  const { error } = await db
    .from("admission_challenge_questions")
    .update({
      label,
      prompt,
      starter_hint: starter || null,
      active,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (textChanged) {
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
      label,
      prompt,
      starter_hint: starter || null,
    });
  }

  return NextResponse.json({ ok: true });
}
