import {
  canPlayCourse,
  evaluateTranscript,
  loadOwnedSession,
  loadScenario,
  mirrorSeriousGame,
} from "@/lib/interview/situation-engine";
import { getServiceRoleClient } from "@/lib/supabase/server";

function publicResult(session: Record<string, unknown>, endings: { id: string; title: string }[]) {
  const ending = String(session.ending ?? "");
  return {
    score: session.score ?? 0,
    criteria: session.criteria ?? {},
    ending,
    endingTitle: endings.find((item) => item.id === ending)?.title ?? ending,
    passed: Boolean(session.passed),
    feedback: String(session.feedback_md ?? ""),
    factsFound: session.facts_found ?? [],
    trapsHandled: session.traps_handled ?? {},
    nextStep: String(session.next_step ?? ""),
  };
}

export async function runSituationEvaluation(userId: string, sessionId: string) {
  const owned = await loadOwnedSession(userId, sessionId);
  if (!owned) return { status: 404, body: { error: "Partie introuvable" } };
  const lessonId = String(owned.session.lesson_id ?? "");
  const courseId = String(owned.session.course_id ?? "");
  if (courseId && !(await canPlayCourse(userId, courseId))) {
    return { status: 403, body: { error: "Vous n'êtes pas inscrit à ce cours" } };
  }
  const loaded = await loadScenario(lessonId);
  if (!loaded) return { status: 404, body: { error: "Scénario introuvable" } };

  const turns = Number(owned.session.user_turn_count ?? 0);
  const status = String(owned.session.status ?? "");
  if (status === "completed") {
    return { status: 200, body: { result: publicResult(owned.session, loaded.scenario.scoring.endings) } };
  }
  if (status === "in_progress" && turns < loaded.scenario.minTurns) {
    return { status: 400, body: { error: `Encore ${loaded.scenario.minTurns - turns} échange(s) avant de pouvoir terminer` } };
  }

  const history = owned.modelMessages.length
    ? owned.modelMessages
    : ((owned.session.messages as { role: "user" | "assistant"; content: string }[]) ?? []);

  let evaluated = await evaluateTranscript(loaded.scenario, history).catch(() => ({ error: "timeout" as const }));
  if ("error" in evaluated) {
    evaluated = await evaluateTranscript(loaded.scenario, history).catch(() => ({ error: "timeout" as const }));
  }

  const db = getServiceRoleClient();
  if (!db) return { status: 503, body: { error: "Service indisponible" } };
  const started = owned.session.started_at ? new Date(String(owned.session.started_at)).getTime() : Date.now();
  const durationSeconds = Math.max(1, Math.round((Date.now() - started) / 1000));

  if ("error" in evaluated) {
    await db
      .from("experiential_interview_sessions")
      .update({ status: "evaluation_pending", duration_seconds: durationSeconds, completed_at: new Date().toISOString() })
      .eq("id", sessionId);
    return { status: 200, body: { pending: true } };
  }

  const result = evaluated.result;
  await db
    .from("experiential_interview_sessions")
    .update({
      status: "completed",
      score: result.score,
      criteria: result.criteria,
      ending: result.ending,
      passed: result.passed,
      feedback_md: result.feedback,
      facts_found: result.factsFound,
      traps_handled: result.trapsHandled,
      next_step: result.nextStep,
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  await mirrorSeriousGame({
    userId,
    scenario: loaded.scenario,
    courseId: courseId || null,
    lessonId,
    result,
    durationSeconds,
    turns,
  });

  return {
    status: 200,
    body: {
      result: {
        ...result,
        criteriaMeta: loaded.scenario.scoring.criteria,
      },
    },
  };
}
