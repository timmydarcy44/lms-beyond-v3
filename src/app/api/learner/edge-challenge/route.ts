import { NextRequest, NextResponse } from "next/server";

import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getCoachReply, generateDebrief } from "@/lib/apprenant/edge-challenge-engine";
import { createChallengeRun, finishChallengeRun } from "@/lib/apprenant/edge-challenge-store";
import type {
  ChallengeChatMessage,
  ChallengeContext,
  ChallengeFormatId,
} from "@/lib/apprenant/edge-challenge-types";

const VALID_FORMATS: ChallengeFormatId[] = ["story", "situation", "proof", "video", "ai", "quickchallenge"];

function parseContext(body: Record<string, unknown>): ChallengeContext {
  const rawFormat = String(body.format ?? "ai") as ChallengeFormatId;
  return {
    skillName: String(body.skill ?? body.skillName ?? "").trim().slice(0, 120),
    objective: String(body.objective ?? "").trim().slice(0, 300),
    levelCurrent: String(body.levelCurrent ?? "").trim().slice(0, 40),
    levelExpected: String(body.levelExpected ?? "").trim().slice(0, 40),
    format: VALID_FORMATS.includes(rawFormat) ? rawFormat : "ai",
  };
}

function parseMessages(body: Record<string, unknown>): ChallengeChatMessage[] {
  const raw = Array.isArray(body.messages) ? body.messages : [];
  return raw
    .filter(
      (m): m is ChallengeChatMessage =>
        Boolean(m) && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
    .slice(-40);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "reply");
    const ctx = parseContext(body);

    if (!ctx.skillName) {
      return NextResponse.json({ error: "Compétence manquante." }, { status: 400 });
    }

    if (action === "start") {
      const db = await getServiceRoleClientOrFallback();
      if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

      const runId = await createChallengeRun(db, user.id, ctx);
      if (!runId) {
        return NextResponse.json({ error: "Impossible de démarrer le défi." }, { status: 500 });
      }
      const reply = await getCoachReply(ctx, []);
      return NextResponse.json({ runId, reply, format: ctx.format });
    }

    if (action === "reply") {
      const messages = parseMessages(body);
      const reply = await getCoachReply(ctx, messages);
      const userTurns = messages.filter((m) => m.role === "user").length;
      return NextResponse.json({ reply, canFinish: userTurns >= 3 });
    }

    if (action === "finish") {
      const runId = String(body.runId ?? "").trim();
      if (!runId) {
        return NextResponse.json({ error: "Défi introuvable." }, { status: 400 });
      }
      const messages = parseMessages(body);
      const proofText = String(body.proofText ?? "").trim().slice(0, 4000);

      const debrief = await generateDebrief(ctx, messages, proofText);

      const db = await getServiceRoleClientOrFallback();
      if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

      const result = await finishChallengeRun(db, user.id, runId, ctx, debrief, messages, proofText);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch (error) {
    console.error("[api/learner/edge-challenge]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
