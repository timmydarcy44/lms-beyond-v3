import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import {
  createJessicaQuestionnaire,
  seedBuiltinJessicaQuestionnaires,
} from "@/lib/queries/jessica-questionnaires";
import type { JessicaQuestionDef } from "@/lib/jessica-contentin/questionnaires";

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as {
    action?: "seed" | "create";
    title?: string;
    description?: string;
    slug?: string;
    questions?: JessicaQuestionDef[];
  } | null;

  if (body?.action === "seed") {
    const result = await seedBuiltinJessicaQuestionnaires(user.id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, seeded: result.seeded });
  }

  const title = body?.title?.trim() ?? "";
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const result = await createJessicaQuestionnaire({
    title,
    description: body?.description,
    slug: body?.slug,
    questions: body?.questions,
    createdBy: user.id,
  });

  if (result.error || !result.row) {
    return NextResponse.json({ error: result.error ?? "Création impossible" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, questionnaire: result.row });
}
