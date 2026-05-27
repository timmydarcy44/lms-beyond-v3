export type PlaygroundAttemptRecord = {
  attemptNumber: number;
  prompt: string;
  aiResponse: string;
  submittedAt?: string;
  promptQuality?: "valid" | "insufficient";
};

export function parsePlaygroundAttemptPayload(
  responseText: string | undefined,
  raw?: Record<string, unknown>,
): PlaygroundAttemptRecord | null {
  if (raw?.playgroundAttempt && typeof raw.playgroundAttempt === "object") {
    const p = raw.playgroundAttempt as Record<string, unknown>;
    const prompt = String(p.prompt ?? "").trim();
    const aiResponse = String(p.aiResponse ?? "").trim();
    if (prompt) {
      return {
        attemptNumber: Number(p.attemptNumber) || 1,
        prompt,
        aiResponse,
        submittedAt: typeof p.submittedAt === "string" ? p.submittedAt : undefined,
        promptQuality:
          p.promptQuality === "valid" || p.promptQuality === "insufficient"
            ? p.promptQuality
            : undefined,
      };
    }
  }

  const text = String(responseText ?? "").trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.playgroundAttempt && typeof parsed.playgroundAttempt === "object") {
      return parsePlaygroundAttemptPayload(undefined, parsed);
    }
    const prompt = String(parsed.prompt ?? "").trim();
    const aiResponse = String(parsed.aiResponse ?? "").trim();
    if (prompt) {
      return {
        attemptNumber: Number(parsed.attemptNumber) || 1,
        prompt,
        aiResponse,
        submittedAt: typeof parsed.submittedAt === "string" ? parsed.submittedAt : undefined,
        promptQuality:
          parsed.promptQuality === "valid" || parsed.promptQuality === "insufficient"
            ? parsed.promptQuality
            : undefined,
      };
    }
  } catch {
    /* legacy plain text */
  }

  return {
    attemptNumber: 1,
    prompt: text,
    aiResponse: "",
  };
}

export function collectPlaygroundAttempts(
  submissions: Record<string, unknown>[],
): PlaygroundAttemptRecord[] {
  const attempts: PlaygroundAttemptRecord[] = [];

  for (const entry of submissions) {
    const responses = entry.methodResponses;
    if (!Array.isArray(responses)) continue;
    for (const raw of responses) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      if (r.methodId !== "playground") continue;
      const parsed = parsePlaygroundAttemptPayload(
        r.responseText as string | undefined,
        r,
      );
      if (parsed) attempts.push(parsed);
    }
  }

  return attempts.sort((a, b) => a.attemptNumber - b.attemptNumber);
}

export function serializePlaygroundAttempt(attempt: PlaygroundAttemptRecord): string {
  return JSON.stringify({
    playgroundAttempt: attempt,
    prompt: attempt.prompt,
    aiResponse: attempt.aiResponse,
    attemptNumber: attempt.attemptNumber,
  });
}
