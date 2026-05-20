/** Colonnes `paths` selon les environnements Supabase (cover_image souvent absent). */

export function enrichPathSnapshotWithCover(snapshot: unknown, coverImage: string | null): unknown {
  if (!coverImage || snapshot == null || typeof snapshot !== "object") return snapshot;
  return {
    ...(snapshot as Record<string, unknown>),
    cover_image: coverImage,
    image_url: coverImage,
    imageUrl: coverImage,
  };
}

export function buildPathsInsertRow(args: {
  creatorId: string;
  orgId: string;
  title: string;
  description: string | null;
  status: string;
  coverImage: string | null;
  snapshot: unknown;
}): Record<string, unknown> {
  const { creatorId, orgId, title, description, status, coverImage, snapshot } = args;
  const row: Record<string, unknown> = {
    creator_id: creatorId,
    org_id: orgId,
    title,
    status,
    path_snapshot: enrichPathSnapshotWithCover(snapshot, coverImage),
  };
  if (description) row.description = description;
  if (coverImage) {
    row.thumbnail_url = coverImage;
    row.hero_url = coverImage;
  }
  return row;
}

export function buildPathsUpdateRow(args: {
  title: string | null;
  description: string | null;
  status: string | null;
  coverImage: string | null;
  snapshot: unknown;
  orgId: string | null;
}): Record<string, unknown> {
  const { title, description, status, coverImage, snapshot, orgId } = args;
  const row: Record<string, unknown> = {
    path_snapshot: enrichPathSnapshotWithCover(snapshot, coverImage),
  };
  if (title !== null) row.title = title;
  if (description !== null) row.description = description;
  if (status !== null) row.status = status;
  if (coverImage !== null) {
    row.thumbnail_url = coverImage;
    row.hero_url = coverImage;
  }
  if (orgId) row.org_id = orgId;
  return row;
}

const STRIP_ON_SCHEMA_ERROR = new Set([
  "cover_image",
  "description",
  "status",
  "thumbnail_url",
  "hero_url",
  "path_snapshot",
  "org_id",
]);

function isMissingColumnError(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "PGRST204" || err.code === "42703") return true;
  return /column|schema cache/i.test(String(err.message ?? ""));
}

function columnFromErrorMessage(message: string): string | null {
  const m = message.match(/'([^']+)' column/i);
  return m?.[1] ?? null;
}

export async function pathsWriteWithFallback<T extends { data: unknown; error: { code?: string; message?: string } | null }>(
  write: (row: Record<string, unknown>) => Promise<T>,
  baseRow: Record<string, unknown>,
): Promise<T> {
  let attemptRow = { ...baseRow };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await write(attemptRow);
    const err = res.error;
    if (!err) return res;

    if (!isMissingColumnError(err)) return res;

    const col = columnFromErrorMessage(String(err.message ?? ""));
    if (col && STRIP_ON_SCHEMA_ERROR.has(col) && col in attemptRow) {
      const next = { ...attemptRow };
      delete next[col];
      attemptRow = next;
      continue;
    }

    if ("cover_image" in attemptRow) {
      const next = { ...attemptRow };
      delete next.cover_image;
      attemptRow = next;
      continue;
    }

    return res;
  }
  return await write(attemptRow);
}
