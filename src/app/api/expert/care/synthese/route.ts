import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/ai/openai-client";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { getCareTest } from "@/lib/expert/care-tests";

export async function GET(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const clientId = req.nextUrl.searchParams.get("clientId")?.trim() ?? "";
  let query = gate.db
    .from("expert_care_responses")
    .select("id,client_id,test_slug,score,score_label,synthesis,submitted_at")
    .eq("expert_id", gate.expertId)
    .order("submitted_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message, responses: [] }, { status: missingRelation(error) ? 200 : 500 });
  }
  return NextResponse.json({ responses: data ?? [] });
}

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { clientId?: string } | null;
  const clientId = body?.clientId?.trim() ?? "";
  if (!clientId) return NextResponse.json({ error: "Membre CRM requis" }, { status: 400 });

  const { data: rows, error } = await gate.db
    .from("expert_care_responses")
    .select("id,test_slug,answers,score,score_label")
    .eq("expert_id", gate.expertId)
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: false });
  if (error) return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ error: "Aucune réponse enregistrée" }, { status: 400 });

  const digest = rows
    .map((row) => {
      const test = getCareTest(String(row.test_slug));
      return `${test?.title ?? row.test_slug} (score ${row.score ?? "n/a"} ${row.score_label ?? ""})\n${JSON.stringify(row.answers).slice(0, 4000)}`;
    })
    .join("\n\n");

  const synthesis = await generateText(
    `Tu es un expert Byound Care. Rédige une synthèse clinique courte, vouvoiement, en français, à partir des réponses de tests suivantes. Structure : points saillants, hypothèses prudentes, pistes d'accompagnement. Pas de diagnostic médical.\n\n${digest}`,
    { maxTokens: 900 },
  );
  if (!synthesis) return NextResponse.json({ error: "Synthèse OpenAI indisponible" }, { status: 502 });

  const latest = rows[0];
  await gate.db.from("expert_care_responses").update({ synthesis }).eq("id", latest.id);
  return NextResponse.json({ ok: true, synthesis });
}
