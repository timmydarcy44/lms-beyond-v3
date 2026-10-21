import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ periodId: string }> }) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Indisponible" }, { status: 503 });
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { periodId } = await params;
  const period = await supabase.from("booklet_periods").select("*").eq("id", periodId).maybeSingle();
  if (!period.data) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  const booklet = await supabase.from("apprenticeship_booklets").select("*").eq("id", period.data.booklet_id).maybeSingle();
  if (!booklet.data) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });

  const userId = auth.user.id;
  const isStudent = booklet.data.student_id === userId;
  const isCfa = booklet.data.cfa_referent_id === userId;
  const role = isStudent ? "student" : isCfa ? "cfa" : null;
  if (!role) return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  if (role === "student" && period.data.status !== "awaiting_student") {
    return NextResponse.json({ error: "Ce n'est pas votre tour de signer" }, { status: 409 });
  }
  if (role === "cfa" && period.data.status !== "awaiting_cfa") {
    return NextResponse.json({ error: "Ce n'est pas votre tour de signer" }, { status: 409 });
  }
  if (role === "cfa") {
    const tutorSign = await supabase.from("booklet_signatures").select("id").eq("period_id", periodId).eq("signer_role", "tutor").maybeSingle();
    if (!tutorSign.data) return NextResponse.json({ error: "Le tuteur n'a pas encore signé" }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  if (role === "student" && body?.comment != null) {
    await supabase.from("booklet_periods").update({ student_comment: String(body.comment) }).eq("id", periodId);
  }

  const snapshot = { period: period.data, booklet: { contract_start: booklet.data.contract_start, contract_end: booklet.data.contract_end } };
  const contentHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  const signed = await supabase.from("booklet_signatures").insert({
    period_id: periodId,
    signer_role: role,
    signer_id: userId,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    user_agent: request.headers.get("user-agent"),
    content_hash: contentHash,
  });
  if (signed.error) return NextResponse.json({ error: "Signature impossible" }, { status: 500 });
  await supabase
    .from("booklet_periods")
    .update({
      status: role === "student" ? "awaiting_tutor" : "signed",
      content_hash: contentHash,
      snapshot: role === "cfa" ? snapshot : period.data.snapshot,
    })
    .eq("id", periodId);
  return NextResponse.json({ ok: true });
}
