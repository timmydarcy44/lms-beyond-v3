import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ periodId: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { periodId } = await params;
  const body = await request.json().catch(() => null);
  const period = await auth.ctx.supabase.from("booklet_periods").select("id, booklet_id, status").eq("id", periodId).maybeSingle();
  if (!period.data) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  if (period.data.status === "signed" || period.data.status === "awaiting_cfa") {
    return NextResponse.json({ error: "Cette période est verrouillée" }, { status: 409 });
  }
  const booklet = await auth.ctx.supabase.from("apprenticeship_booklets").select("tutor_id").eq("id", period.data.booklet_id).maybeSingle();
  if (booklet.data?.tutor_id !== auth.ctx.userId) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  const { error } = await auth.ctx.supabase
    .from("booklet_periods")
    .update({ tutor_appreciation: String(body?.appreciation ?? "") })
    .eq("id", periodId);
  if (error) return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
