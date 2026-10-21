import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const evaluation = await supabase.from("evaluations").select("*").eq("id", id).eq("student_id", auth.user.id).maybeSingle();
  if (!evaluation.data) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
  const items = await supabase.from("evaluation_items").select("id, label, block_code, self_level").eq("evaluation_id", id);
  return NextResponse.json({ evaluation: evaluation.data, items: items.data ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const evaluation = await supabase.from("evaluations").select("id, status").eq("id", id).eq("student_id", auth.user.id).maybeSingle();
  if (!evaluation.data) return NextResponse.json({ error: "Évaluation introuvable" }, { status: 404 });
  if (evaluation.data.status !== "awaiting_student") {
    return NextResponse.json({ error: "Cette auto-évaluation est déjà envoyée" }, { status: 409 });
  }
  const body = await request.json().catch(() => null);
  const levels = Array.isArray(body?.levels) ? body.levels : [];
  for (const level of levels) {
    if (level.selfLevel == null) continue;
    await supabase.from("evaluation_items").update({ self_level: Number(level.selfLevel) }).eq("id", String(level.id)).eq("evaluation_id", id);
  }
  if (!body?.send) return NextResponse.json({ ok: true });
  const fresh = await supabase.from("evaluation_items").select("self_level").eq("evaluation_id", id);
  if ((fresh.data ?? []).some((item) => item.self_level == null) || !(fresh.data ?? []).length) {
    return NextResponse.json({ error: "Tous les critères doivent être renseignés" }, { status: 400 });
  }
  const updated = await supabase
    .from("evaluations")
    .update({ status: "to_fill", self_sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("student_id", auth.user.id);
  if (updated.error) return NextResponse.json({ error: "Envoi impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
