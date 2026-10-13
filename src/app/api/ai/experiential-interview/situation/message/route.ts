import { NextResponse } from "next/server";

import {
  LEARNER_MESSAGE_MAX,
  canPlayCourse,
  characterReply,
  isCloseMove,
  loadOwnedSession,
  loadScenario,
  rebuildModelContent,
  requireUser,
  savePrivate,
  tooSoon,
} from "@/lib/interview/situation-engine";
import type { ModelMessage, TurnState } from "@/lib/interview/situation-engine";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const sessionId = String(body?.sessionId ?? "").trim();
  const courseId = String(body?.courseId ?? "").trim();
  const text = String(body?.message ?? "").trim();
  if (!sessionId || !text) return NextResponse.json({ error: "Message incomplet" }, { status: 400 });
  if (text.length > LEARNER_MESSAGE_MAX) {
    return NextResponse.json({ error: `800 caractères maximum` }, { status: 400 });
  }
  if (courseId && !(await canPlayCourse(user.id, courseId))) {
    return NextResponse.json({ error: "Vous n'êtes pas inscrit à ce cours" }, { status: 403 });
  }

  const owned = await loadOwnedSession(user.id, sessionId);
  if (!owned) return NextResponse.json({ error: "Partie introuvable" }, { status: 404 });
  if (String(owned.session.status) !== "in_progress") {
    return NextResponse.json({ error: "Cet entretien est déjà terminé" }, { status: 409 });
  }
  if (tooSoon(owned.session.last_message_at)) {
    return NextResponse.json({ error: "Patientez deux secondes entre deux messages" }, { status: 429 });
  }

  const lessonId = String(owned.session.lesson_id ?? "");
  const loaded = await loadScenario(lessonId);
  if (!loaded) return NextResponse.json({ error: "Scénario introuvable" }, { status: 404 });
  const variant =
    loaded.scenario.variants.find((item) => item.id === owned.session.variant_id) ?? loaded.scenario.variants[0];

  const display = (Array.isArray(owned.session.messages) ? owned.session.messages : []) as {
    role: "user" | "assistant";
    content: string;
  }[];
  const modelMessages: ModelMessage[] = owned.modelMessages.length
    ? owned.modelMessages
    : display.map((message, index) => ({
        role: message.role,
        content:
          message.role === "assistant"
            ? rebuildModelContent(message.content, owned.turnStates[index] ?? null)
            : message.content,
      }));

  const turns = display.filter((message) => message.role === "user").length + 1;
  if (turns > loaded.scenario.maxTurns) {
    return NextResponse.json({ error: "Nombre d'échanges atteint", closed: true }, { status: 409 });
  }

  modelMessages.push({ role: "user", content: text });
  let reply: Awaited<ReturnType<typeof characterReply>>;
  try {
    reply = await characterReply(loaded.scenario, variant.instructions, modelMessages);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur OpenAI" }, { status: 502 });
  }
  if ("error" in reply) return NextResponse.json({ error: reply.error }, { status: 503 });

  const state: TurnState = reply.state;
  modelMessages.push({ role: "assistant", content: rebuildModelContent(reply.text, state) });
  const nextDisplay = [...display, { role: "user" as const, content: text }, { role: "assistant" as const, content: reply.text }];
  const nextStates = [...owned.turnStates, null, state];
  const closed = isCloseMove(state) || turns >= loaded.scenario.maxTurns;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  await db
    .from("experiential_interview_sessions")
    .update({
      messages: nextDisplay,
      user_turn_count: turns,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  await savePrivate(sessionId, modelMessages, nextStates);

  return NextResponse.json({
    reply: reply.text,
    turns,
    maxTurns: loaded.scenario.maxTurns,
    minTurns: loaded.scenario.minTurns,
    closed,
  });
}
