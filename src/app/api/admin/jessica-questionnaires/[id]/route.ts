import { NextRequest, NextResponse } from "next/server";
import { assertJessicaAdmin } from "@/lib/jessica-contentin/assert-jessica-admin";
import { updateJessicaQuestionnaire } from "@/lib/queries/jessica-questionnaires";
import type { JessicaQuestionDef } from "@/lib/jessica-contentin/questionnaires";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    description?: string;
    questions?: JessicaQuestionDef[];
    is_active?: boolean;
  } | null;

  if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

  const result = await updateJessicaQuestionnaire(id, body);
  if (result.error || !result.row) {
    return NextResponse.json({ error: result.error ?? "Mise à jour impossible" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, questionnaire: result.row });
}
