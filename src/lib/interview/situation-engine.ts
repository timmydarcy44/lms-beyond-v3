import { getOpenAIClient } from "@/lib/ai/openai-client";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import type { SituationScenario } from "@/lib/interview/situation-schema";
import { situationFileSchema } from "@/lib/interview/situation-schema";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const LEARNER_MESSAGE_MAX = 800;
const MESSAGE_GAP_MS = 2000;

export type DisplayMessage = { role: "user" | "assistant"; content: string };
export type ModelMessage = { role: "user" | "assistant"; content: string };
export type TurnState = Record<string, string> | null;

const ETAT_RE = /<etat\b([^>]*)\/>/gi;

export function extractEtat(text: string): { display: string; state: TurnState } {
  const matches = [...text.matchAll(ETAT_RE)];
  if (!matches.length) return { display: text.trim(), state: null };
  const last = matches[matches.length - 1]?.[1] ?? "";
  const state: Record<string, string> = {};
  const attrRe = /([a-zA-Z_]+)\s*=\s*"([^"]*)"/g;
  let attr: RegExpExecArray | null;
  while ((attr = attrRe.exec(last))) {
    state[attr[1]] = attr[2];
  }
  const display = text.replace(/<etat\b[^>]*\/>/gi, "").trim();
  return { display, state: Object.keys(state).length ? state : null };
}

export function stateToTag(state: TurnState): string {
  if (!state) return "";
  const attrs = Object.entries(state)
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, "")}"`)
    .join(" ");
  return `\n<etat ${attrs}/>`;
}

export function isCloseMove(state: TurnState): boolean {
  return String(state?.coup ?? "").trim().toUpperCase() === "CLORE";
}

export function parseScenario(raw: unknown): SituationScenario | null {
  const parsed = situationFileSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function requireUser() {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function canPlayCourse(userId: string, courseId: string) {
  const db = getServiceRoleClient();
  if (!db || !courseId) return false;
  if (await isSuperAdmin()) return true;

  const { data: course } = await db
    .from("courses")
    .select("creator_id, owner_id, org_id")
    .eq("id", courseId)
    .maybeSingle();
  const row = course as { creator_id?: string | null; owner_id?: string | null; org_id?: string | null } | null;
  if (!row) return false;
  if (row.creator_id === userId || row.owner_id === userId) return true;

  const { data: enrolled } = await db
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .limit(1);
  if (enrolled?.length) return true;

  if (row.org_id) {
    const { data: member } = await db
      .from("org_memberships")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", row.org_id)
      .limit(1);
    if (member?.length) return true;
  }
  return false;
}

export async function loadScenario(blockId: string) {
  const db = getServiceRoleClient();
  if (!db) return null;
  const { data } = await db
    .from("experiential_interview_scenarios")
    .select("id, block_id, course_id, scenario")
    .eq("block_id", blockId)
    .maybeSingle();
  if (!data) return null;
  const scenario = parseScenario((data as { scenario?: unknown }).scenario);
  if (!scenario) return null;
  return { row: data as { id: string; block_id: string; course_id: string | null }, scenario };
}

export function pickVariant(scenario: SituationScenario) {
  if (scenario.variantMode === "fixed") {
    return scenario.variants.find((variant) => variant.id === scenario.fixedVariantId) ?? scenario.variants[0];
  }
  const index = Math.floor(Math.random() * scenario.variants.length);
  return scenario.variants[index] ?? scenario.variants[0];
}

export async function loadOwnedSession(userId: string, sessionId: string) {
  const db = getServiceRoleClient();
  if (!db) return null;
  const { data } = await db
    .from("experiential_interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const { data: priv } = await db
    .from("experiential_interview_private")
    .select("model_messages, turn_states")
    .eq("session_id", sessionId)
    .maybeSingle();
  return {
    session: data as Record<string, unknown>,
    modelMessages: (Array.isArray((priv as { model_messages?: unknown } | null)?.model_messages)
      ? (priv as { model_messages: ModelMessage[] }).model_messages
      : []) as ModelMessage[],
    turnStates: (Array.isArray((priv as { turn_states?: unknown } | null)?.turn_states)
      ? (priv as { turn_states: TurnState[] }).turn_states
      : []) as TurnState[],
  };
}

export async function savePrivate(sessionId: string, modelMessages: ModelMessage[], turnStates: TurnState[]) {
  const db = getServiceRoleClient();
  if (!db) return;
  await db.from("experiential_interview_private").upsert(
    { session_id: sessionId, model_messages: modelMessages, turn_states: turnStates },
    { onConflict: "session_id" },
  );
}

export function tooSoon(lastMessageAt: unknown) {
  if (!lastMessageAt) return false;
  const at = new Date(String(lastMessageAt)).getTime();
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < MESSAGE_GAP_MS;
}

export async function characterReply(
  scenario: SituationScenario,
  variantInstructions: string,
  history: ModelMessage[],
) {
  const openai = getOpenAIClient();
  if (!openai) return { error: "OpenAI non configuré" as const };
  const temperature = scenario.model?.character?.temperature ?? 0.7;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content: `${scenario.characterPrompt}\n\n=== VARIANTE ===\n${variantInstructions}`,
      },
      ...history,
    ],
  });
  const text = String(completion.choices[0]?.message?.content ?? "").trim();
  if (!text) return { error: "Réponse vide" as const };
  const parsed = extractEtat(text);
  const state = parsed.state ?? historyState(history);
  return { text: parsed.display || text.replace(/<etat\b[^>]*\/>/gi, "").trim(), state, raw: text };
}

function historyState(history: ModelMessage[]): TurnState {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i]?.role !== "assistant") continue;
    const parsed = extractEtat(history[i].content);
    if (parsed.state) return parsed.state;
  }
  return null;
}

export function rebuildModelContent(display: string, state: TurnState) {
  return `${display}${stateToTag(state)}`.trim();
}

type EvalResult = {
  score: number;
  criteria: Record<string, number>;
  ending: string;
  endingTitle: string;
  passed: boolean;
  feedback: string;
  factsFound: string[];
  trapsHandled: Record<string, string>;
  nextStep: string;
};

export function clampEvaluation(scenario: SituationScenario, raw: Record<string, unknown>): EvalResult {
  const criteria: Record<string, number> = {};
  const incoming = raw.criteria && typeof raw.criteria === "object" ? (raw.criteria as Record<string, unknown>) : {};
  let score = 0;
  for (const criterion of scenario.scoring.criteria) {
    const value = Math.max(0, Math.min(criterion.max, Math.round(Number(incoming[criterion.id] ?? 0) || 0)));
    criteria[criterion.id] = value;
    score += value;
  }
  const endings = [...scenario.scoring.endings].sort((a, b) => b.min - a.min);
  const ending = endings.find((item) => score >= item.min) ?? endings[endings.length - 1];
  const facts = Array.isArray(raw.factsFound) ? raw.factsFound.map((item) => String(item)).slice(0, 40) : [];
  const traps = raw.trapsHandled && typeof raw.trapsHandled === "object" ? (raw.trapsHandled as Record<string, string>) : {};
  return {
    score,
    criteria,
    ending: ending?.id ?? "a-revoir",
    endingTitle: ending?.title ?? "À revoir",
    passed: score >= scenario.scoring.passingScore,
    feedback: String(raw.feedback ?? "").slice(0, 20_000),
    factsFound: facts,
    trapsHandled: traps,
    nextStep: String(raw.nextStep ?? ""),
  };
}

export async function evaluateTranscript(scenario: SituationScenario, modelMessages: ModelMessage[]) {
  const openai = getOpenAIClient();
  if (!openai) return { error: "OpenAI non configuré" as const };
  const transcript = modelMessages
    .map((message) => `${message.role === "user" ? "Apprenant" : scenario.character.name} : ${message.content}`)
    .join("\n\n");
  const schema = scenario.resultSchema;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: scenario.model?.evaluation?.temperature ?? 0.2,
    max_tokens: 4000,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "situation_result",
        strict: true,
        schema: schema as Record<string, unknown>,
      },
    },
    messages: [
      { role: "system", content: scenario.evaluationPrompt },
      { role: "user", content: transcript },
    ],
  });
  const text = String(completion.choices[0]?.message?.content ?? "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: "JSON invalide" as const };
  }
  return { result: clampEvaluation(scenario, parsed) };
}

export async function mirrorSeriousGame(params: {
  userId: string;
  scenario: SituationScenario;
  courseId: string | null;
  lessonId: string;
  result: EvalResult;
  durationSeconds: number;
  turns: number;
}) {
  const db = getServiceRoleClient();
  if (!db) return;
  const { error } = await db.from("serious_game_attempts").insert({
    user_id: params.userId,
    game_id: params.scenario.id.slice(0, 80),
    game_version: params.scenario.version ?? 1,
    status: "completed",
    score: params.result.score,
    passed: params.result.passed,
    criteria: params.result.criteria,
    ending: params.result.ending,
    ending_title: params.result.endingTitle,
    course_id: params.courseId,
    lesson_id: params.lessonId,
    block_id: params.lessonId,
    duration_sec: params.durationSeconds,
    steps_count: params.turns,
    report: { feedback: params.result.feedback },
    completed_at: new Date().toISOString(),
  });
  if (error && error.code !== "42P01" && error.code !== "PGRST205") {
    console.warn("[situation] serious_game_attempts", error.message);
  }
}
