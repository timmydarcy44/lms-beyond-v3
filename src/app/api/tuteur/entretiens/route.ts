import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";

const KINDS = new Set(["point", "evaluation", "visite", "autre"]);

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  let body: { learnerId?: string; kind?: string; title?: string; startsAt?: string; place?: string; participants?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const learnerId = String(body.learnerId ?? "");
  const startsAt = String(body.startsAt ?? "");
  const kind = KINDS.has(String(body.kind)) ? String(body.kind) : "autre";
  if (!learnerId || Number.isNaN(new Date(startsAt).getTime())) {
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

  const titles: Record<string, string> = {
    point: "Point mensuel",
    evaluation: "Évaluation",
    visite: "Visite tripartite",
    autre: "Entretien",
  };

  const { error } = await auth.ctx.supabase.from("tutor_interviews").insert({
    learner_id: learnerId,
    tutor_id: auth.ctx.userId,
    kind,
    title: String(body.title ?? "").trim() || titles[kind],
    starts_at: new Date(startsAt).toISOString(),
    place: String(body.place ?? "").trim() || null,
    participants: String(body.participants ?? "").trim() || null,
    status: "planned",
  });
  if (error) {
    const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (error.code === "42P01" || error.code === "PGRST205" || msg.includes("does not exist")) {
      return NextResponse.json({ error: "L'entretien n'a pas pu être enregistré." }, { status: 503 });
    }
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
