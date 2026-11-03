import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { notifyFormationProposal } from "@/lib/email/formation-proposal-notice";
import { FORMATION_PROPOSAL_SQL_HINT, requireExpertWriter } from "@/lib/expert/formation-proposals";
import { missingRelation } from "@/lib/expert/care-auth";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function cleanBlock(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function lines(value: unknown, max: number) {
  return cleanBlock(value, max)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const FORMATS = ["En entreprise", "Au sein de Byound (Caen)", "E-learning", "Visio"];

function missingColumn(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /column .* does not exist/i.test(error.message ?? "");
}

export async function POST(request: NextRequest) {
  const gate = await requireExpertWriter();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const body = await request.json().catch(() => null);
  const title = clean(body?.title, 160);
  const presentation = cleanBlock(body?.presentation, 4000);
  const objectives = lines(body?.objectives, 4000);
  const prerequisites = lines(body?.prerequisites, 4000);
  const audiences = Array.isArray(body?.audiences)
    ? body.audiences.map((item: unknown) => clean(item, 80)).filter(Boolean).slice(0, 12)
    : lines(body?.audience, 2000);
  const content = cleanBlock(body?.content, 6000);
  const priceEur = Math.round(Number(body?.priceEur));
  const formats = Array.isArray(body?.formats)
    ? FORMATS.filter((format) => body.formats.map(String).includes(format))
    : [];

  if (title.length < 3) return NextResponse.json({ error: "Indiquez le nom de la formation." }, { status: 400 });
  if (presentation.length < 8) return NextResponse.json({ error: "Décrivez la formation." }, { status: 400 });
  if (!objectives.length) return NextResponse.json({ error: "Ajoutez au moins un objectif pédagogique." }, { status: 400 });
  if (!prerequisites.length) return NextResponse.json({ error: "Ajoutez au moins un prérequis." }, { status: 400 });
  if (!audiences.length) return NextResponse.json({ error: "Choisissez au moins un public." }, { status: 400 });
  if (!Number.isFinite(priceEur) || priceEur < 0 || priceEur > 100000) {
    return NextResponse.json({ error: "Indiquez le tarif souhaité." }, { status: 400 });
  }
  if (!formats.length) return NextResponse.json({ error: "Choisissez au moins un format." }, { status: 400 });
  if (content.length < 8) return NextResponse.json({ error: "Décrivez le contenu de la formation." }, { status: 400 });

  const { error } = await gate.db.from("expert_formation_proposals").insert({
    expert_id: gate.expertId,
    title,
    presentation,
    objectives: objectives.join("\n"),
    prerequisites: prerequisites.join("\n"),
    audience: audiences.join("\n"),
    content,
    price_eur: priceEur,
    formats,
    status: "pending",
  });
  if (error) {
    const hint = missingRelation(error) || missingColumn(error);
    return NextResponse.json(
      { error: hint ? FORMATION_PROPOSAL_SQL_HINT : "La proposition n'a pas pu être enregistrée." },
      { status: 500 },
    );
  }

  const mailed = await notifyFormationProposal({
    expertName: gate.expertName,
    expertId: gate.expertId,
    title,
    priceEur,
    formats,
  });
  revalidatePath("/dashboard/expert/formations/proposer");
  revalidatePath(`/super/experts/${gate.expertId}`);
  revalidatePath("/super/formations-proposees");
  return NextResponse.json({ ok: true, mailed });
}
