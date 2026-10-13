import { NextResponse } from "next/server";

import { requireUser } from "@/lib/interview/situation-engine";
import { runSituationEvaluation } from "@/lib/interview/situation-finish";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
  const outcome = await runSituationEvaluation(user.id, sessionId);
  return NextResponse.json(outcome.body, { status: outcome.status });
}
