import { NextRequest, NextResponse } from "next/server";
import { publishExpertResult } from "@/lib/care/expert-patient-space";
import { requireCareExpert } from "@/lib/expert/care-auth";

export async function POST(request: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as {
    clientId?: string;
    responseId?: string;
    comment?: string;
    subjectRelativeId?: string | null;
  } | null;
  if (!body?.clientId || !body.responseId) return NextResponse.json({ error: "Résultat requis" }, { status: 400 });
  const result = await publishExpertResult({ expertId: gate.expertId, db: gate.db }, {
    clientId: body.clientId,
    responseId: body.responseId,
    comment: body.comment ?? "",
    subjectRelativeId: body.subjectRelativeId || null,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
