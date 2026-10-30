import { NextRequest, NextResponse } from "next/server";
import { FORMATION_PROPOSAL_SQL_HINT, requireExpertWriter } from "@/lib/expert/formation-proposals";
import { missingRelation } from "@/lib/expert/care-auth";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function cleanBlock(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  const gate = await requireExpertWriter();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await request.json().catch(() => null);
  const title = clean(body?.title, 160);
  const objectives = cleanBlock(body?.objectives, 4000);
  const prerequisites = cleanBlock(body?.prerequisites, 4000);
  const audience = cleanBlock(body?.audience, 2000);
  if (!title || !objectives || !prerequisites || !audience) {
    return NextResponse.json({ error: "Titre, objectifs, prérequis et public sont requis." }, { status: 400 });
  }
  const { error } = await gate.db.from("expert_formation_proposals").insert({
    expert_id: gate.expertId,
    title,
    objectives,
    prerequisites,
    audience,
    status: "pending",
  });
  if (error) {
    return NextResponse.json(
      { error: missingRelation(error) ? FORMATION_PROPOSAL_SQL_HINT : "La proposition n'a pas pu être enregistrée." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
