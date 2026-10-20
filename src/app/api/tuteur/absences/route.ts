import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: { learnerId?: string; date?: string; motif?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const learnerId = String(body.learnerId ?? "");
  const date = String(body.date ?? "");
  if (!learnerId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Date requise" }, { status: 400 });
  }

  const { data: assignment } = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id")
    .eq("tutor_id", auth.ctx.userId)
    .eq("learner_id", learnerId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (!assignment) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });

  const { error } = await auth.ctx.supabase.from("tutor_absence_reports").insert({
    learner_id: learnerId,
    tutor_id: auth.ctx.userId,
    absence_date: date,
    motif: String(body.motif ?? "").trim() || null,
  });
  if (error) {
    const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (error.code === "42P01" || error.code === "PGRST205" || msg.includes("does not exist")) {
      return NextResponse.json({ error: "Le signalement n'a pas pu être enregistré." }, { status: 503 });
    }
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
