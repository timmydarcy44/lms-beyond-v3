export type ModuleGate = {
  testId: string;
  minPercent: number;
  lessonId: string;
  title: string;
};

export type GateNode = {
  id?: string;
  title?: string;
  quiz_id?: string;
  content?: string | null;
  description?: string | null;
  gate_next_module?: boolean;
  gateNextModule?: boolean;
  gate_min_percent?: number | null;
  gateMinPercent?: number | null;
};

export type GateModule = {
  lessons?: GateNode[];
};

export function clampGatePercent(value: unknown, fallback = 80): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(1, Math.round(parsed)));
}

export function quizTestIdFromNode(node: GateNode): string | null {
  if (node.quiz_id) return String(node.quiz_id);
  const raw = String(node.description ?? node.content ?? "");
  const match = raw.match(/testId=([0-9a-f-]{36})/i);
  return match?.[1] ?? null;
}

export function gatingQuizzes(nodes: GateNode[] | undefined): ModuleGate[] {
  const gates: ModuleGate[] = [];
  for (const node of nodes ?? []) {
    if (!(node.gate_next_module || node.gateNextModule)) continue;
    const testId = quizTestIdFromNode(node);
    if (!testId) continue;
    gates.push({
      testId,
      minPercent: clampGatePercent(node.gate_min_percent ?? node.gateMinPercent),
      lessonId: String(node.id ?? ""),
      title: String(node.title ?? "").trim() || "Quiz",
    });
  }
  return gates;
}

export function firstUnmetGate(
  gates: ModuleGate[],
  scores: Record<string, number | undefined>,
  scoresReady = true,
): ModuleGate | null {
  for (const gate of gates) {
    if (!scoresReady) return gate;
    if ((scores[gate.testId] ?? -1) < gate.minPercent) return gate;
  }
  return null;
}

/** Un module est fermé si un module précédent l’est, ou si le module juste avant a un quiz non validé. */
export function unmetGateForModule(
  modules: GateModule[],
  moduleIndex: number,
  scores: Record<string, number | undefined>,
  scoresReady = true,
): ModuleGate | null {
  if (moduleIndex <= 0) return null;
  const earlier = unmetGateForModule(modules, moduleIndex - 1, scores, scoresReady);
  if (earlier) return earlier;
  return firstUnmetGate(gatingQuizzes(modules[moduleIndex - 1]?.lessons), scores, scoresReady);
}

export function unmetGateForLesson(
  modules: GateModule[],
  lessonId: string,
  scores: Record<string, number | undefined>,
  scoresReady = true,
): ModuleGate | null {
  const index = modules.findIndex((module) => (module.lessons ?? []).some((lesson) => String(lesson.id) === lessonId));
  if (index < 0) return null;
  return unmetGateForModule(modules, index, scores, scoresReady);
}

export function moduleGateMessage(gate: ModuleGate): string {
  return `Ce module s’ouvre quand tu atteins ${gate.minPercent} % de bonnes réponses au quiz « ${gate.title} ».`;
}

export function quizScoreStorageKey(testId: string): string {
  return `lms:quiz-score:${testId}`;
}
