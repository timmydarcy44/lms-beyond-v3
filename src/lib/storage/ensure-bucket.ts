import type { SupabaseClient } from "@supabase/supabase-js";

const ensured = new Set<string>();

/** Crée le bucket s’il manque (service role). Idempotent. */
export async function ensureStorageBucket(
  db: SupabaseClient,
  bucket: string,
  options?: { public?: boolean; fileSizeLimit?: number },
): Promise<void> {
  const key = `${bucket}:${options?.public ? "pub" : "priv"}`;
  if (ensured.has(key)) return;
  const { data: buckets } = await db.storage.listBuckets();
  if ((buckets ?? []).some((row) => row.name === bucket || row.id === bucket)) {
    ensured.add(key);
    return;
  }
  const { error } = await db.storage.createBucket(bucket, {
    public: Boolean(options?.public),
    fileSizeLimit: options?.fileSizeLimit ?? 20 * 1024 * 1024,
  });
  if (error && !/already exists|duplicate|exists/i.test(error.message)) {
    console.warn(`[storage] createBucket(${bucket}):`, error.message);
    return;
  }
  ensured.add(key);
}

/** Upload avec création auto du bucket + fallbacks. */
export async function uploadWithBucketFallback(
  db: SupabaseClient,
  params: {
    preferredBucket: string;
    path: string;
    buffer: Buffer;
    contentType: string;
    preferredPublic?: boolean;
    fallbacks?: Array<{ bucket: string; pathPrefix?: string; public?: boolean }>;
  },
): Promise<{ bucket: string; path: string; public: boolean } | { error: string }> {
  const attempts: Array<{ bucket: string; path: string; public: boolean }> = [
    {
      bucket: params.preferredBucket,
      path: params.path,
      public: Boolean(params.preferredPublic),
    },
    ...(params.fallbacks ?? []).map((row) => ({
      bucket: row.bucket,
      path: row.pathPrefix ? `${row.pathPrefix.replace(/\/$/, "")}/${params.path}` : params.path,
      public: Boolean(row.public),
    })),
  ];

  let lastError = "Upload impossible";
  for (const attempt of attempts) {
    await ensureStorageBucket(db, attempt.bucket, {
      public: attempt.public,
      fileSizeLimit: 80 * 1024 * 1024,
    });
    const { error } = await db.storage.from(attempt.bucket).upload(attempt.path, params.buffer, {
      contentType: params.contentType,
      upsert: true,
    });
    if (!error) {
      return { bucket: attempt.bucket, path: attempt.path, public: attempt.public };
    }
    lastError = error.message;
    if (!/bucket not found|not found|does not exist/i.test(error.message)) {
      return { error: lastError };
    }
  }
  return { error: lastError };
}
