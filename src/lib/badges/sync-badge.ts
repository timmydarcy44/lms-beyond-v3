import type { SupabaseClient } from "@supabase/supabase-js";

export type OpenBadgeOverlayPayload = {
  courseId: string;
  title: string;
  description: string;
  objectives: string[];
  modalities: Record<string, string | string[] | null | undefined>;
  userId?: string | null;
  internalQuiz?: Array<{
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
  }>;
  audioPrompt?: string | null;
  imageUrl?: string | null;
};

/**
 * Persistance dans `public.open_badges` (modalités en JSONB).
 * `course_id` unique : upsert sur conflit.
 */
export async function syncOpenBadgeToDatabase(
  supabase: SupabaseClient,
  payload: OpenBadgeOverlayPayload,
): Promise<{ ok: boolean; error?: string }> {
  const courseId = String(payload.courseId ?? "").trim();
  if (!courseId) {
    return { ok: false, error: "course_id manquant" };
  }

  const row = {
    course_id: courseId,
    user_id: payload.userId ? String(payload.userId).trim() : null,
    title: payload.title.trim(),
    description: payload.description.trim() || null,
    objectives: payload.objectives.filter(Boolean),
    modalities: payload.modalities as Record<string, unknown>,
    internal_quiz: payload.internalQuiz ? (payload.internalQuiz as unknown as unknown[]) : null,
    audio_prompt: payload.audioPrompt?.trim() || null,
    image_url: payload.imageUrl?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const upsertWithFallback = async (payloadRow: Record<string, unknown>) => {
    const currentRow = { ...payloadRow };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { error } = await supabase.from("open_badges").upsert(currentRow as never, { onConflict: "course_id" });
      if (!error) return { ok: true as const, error: null, rowUsed: currentRow };
      const errObj = error as unknown as { code?: unknown; message?: unknown };
      const code = errObj?.code ? String(errObj.code) : "";
      const msg = String(errObj?.message ?? "");
      if (code === "42703" || /column .* does not exist/i.test(msg)) {
        const m = msg.match(/column \"([^\"]+)\"/i);
        const col = m?.[1];
        if (col && col in currentRow) {
          delete (currentRow as Record<string, unknown>)[col];
          continue;
        }
      }
      return { ok: false as const, error, rowUsed: currentRow };
    }
    return { ok: false as const, error: new Error("UPSERT_FALLBACK_EXHAUSTED"), rowUsed: currentRow };
  };

  const { ok, error } = await upsertWithFallback(row as unknown as Record<string, unknown>);

  if (!ok) {
    console.error("[syncOpenBadgeToDatabase]", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
