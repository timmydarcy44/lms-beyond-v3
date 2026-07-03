type LogMeta = Record<string, unknown>;

function pickErrorFields(error: unknown): LogMeta {
  if (!error || typeof error !== "object") {
    return { message: error == null ? undefined : String(error) };
  }
  const e = error as Record<string, unknown>;
  return {
    message: e.message,
    code: e.code,
    details: e.details,
    hint: e.hint,
    status: e.status,
    name: e.name,
    stack: typeof e.stack === "string" ? e.stack : undefined,
  };
}

/** Logs Vercel — jamais d'e-mail ni de clé API. */
export function logExpertRegisterError(step: string, error: unknown, meta?: LogMeta): void {
  console.error("[EXPERT_REGISTER_ERROR]", {
    step,
    ...pickErrorFields(error),
    ...meta,
  });
}

export function logExpertRegisterWarn(step: string, message: string, meta?: LogMeta): void {
  console.warn("[EXPERT_REGISTER_WARN]", { step, message, ...meta });
}

export function logExpertRegisterInfo(step: string, meta?: LogMeta): void {
  console.info("[EXPERT_REGISTER]", { step, ...meta });
}
