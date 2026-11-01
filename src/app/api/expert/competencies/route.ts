import { NextRequest, NextResponse } from "next/server";
import { requireExpertWriter } from "@/lib/expert/formation-proposals";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { listLibraryCompetencies, validateLibraryCompetency } from "@/lib/openbadges/competency-library";

async function actorName() {
  const expert = await requireExpertWriter();
  if (expert.ok) return { name: expert.expertName || "Expert Byound" };
  if (await isSuperAdmin()) return { name: "Admin Byound" };
  return null;
}

export async function GET() {
  if (!(await actorName())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const competencies = (await listLibraryCompetencies()).filter((item) => item.status === "draft" && !item.archivedAt);
  return NextResponse.json({ competencies });
}

export async function POST(request: NextRequest) {
  const actor = await actorName();
  if (!actor) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { id?: string; definition?: string } | null;
  const id = body?.id?.trim();
  if (!id) return NextResponse.json({ error: "Compétence requise" }, { status: 400 });
  const result = await validateLibraryCompetency({ id, definition: body?.definition, validatorName: actor.name });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
