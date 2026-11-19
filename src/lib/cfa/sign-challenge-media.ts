import type { getServiceRoleClient } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getServiceRoleClient>>;

export type ChallengeMediaSigned = {
  path: string;
  signedUrl: string | null;
  bucket: string;
};

/** Sign challenge media paths (admission-media, fallback cfa-applications). */
export async function signChallengeMediaPath(
  db: Db,
  path: string,
  expiresSec = 3600,
): Promise<ChallengeMediaSigned> {
  const clean = String(path || "").trim();
  if (!clean) return { path: clean, signedUrl: null, bucket: "admission-media" };
  if (clean.startsWith("http")) {
    return { path: clean, signedUrl: clean, bucket: "admission-media" };
  }

  for (const bucket of ["admission-media", "cfa-applications"] as const) {
    const { data, error } = await db.storage.from(bucket).createSignedUrl(clean, expiresSec);
    if (!error && data?.signedUrl) {
      return { path: clean, signedUrl: data.signedUrl, bucket };
    }
  }
  return { path: clean, signedUrl: null, bucket: "admission-media" };
}

export async function withSignedChallengeResponses(
  db: Db,
  challengeV2: Record<string, unknown> | null | undefined,
): Promise<Record<string, unknown> | null> {
  if (!challengeV2 || typeof challengeV2 !== "object") return challengeV2 ?? null;
  const responses = Array.isArray(challengeV2.responses) ? challengeV2.responses : [];
  const signedResponses = await Promise.all(
    responses.map(async (raw) => {
      const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const mediaPath = typeof row.mediaPath === "string" ? row.mediaPath : "";
      if (!mediaPath) return { ...row, mediaSignedUrl: null };
      const signed = await signChallengeMediaPath(db, mediaPath);
      return { ...row, mediaSignedUrl: signed.signedUrl };
    }),
  );
  return { ...challengeV2, responses: signedResponses };
}
