import type { SupabaseClient } from "@supabase/supabase-js";

export async function hitRateLimit(
  service: SupabaseClient,
  bucketKey: string,
  maxHits: number,
  windowMs: number,
): Promise<{ allowed: boolean; hits: number }> {
  const now = Date.now();
  const { data: existing } = await service
    .from("attendance_rate_limits")
    .select("id, hits, window_started_at")
    .eq("bucket_key", bucketKey)
    .maybeSingle();

  if (!existing) {
    await service.from("attendance_rate_limits").insert({
      bucket_key: bucketKey,
      hits: 1,
      window_started_at: new Date(now).toISOString(),
    });
    return { allowed: true, hits: 1 };
  }

  const started = Date.parse(String(existing.window_started_at));
  if (!Number.isFinite(started) || now - started > windowMs) {
    await service
      .from("attendance_rate_limits")
      .update({ hits: 1, window_started_at: new Date(now).toISOString() })
      .eq("id", existing.id);
    return { allowed: true, hits: 1 };
  }

  const hits = Number(existing.hits ?? 0) + 1;
  await service.from("attendance_rate_limits").update({ hits }).eq("id", existing.id);
  return { allowed: hits <= maxHits, hits };
}
