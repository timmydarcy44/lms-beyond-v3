/** Normalise les URLs Supabase Storage (casse des buckets). */
export function normalizeValidatorPhotoPublicUrl(url: string): string {
  return url
    .replace("/object/public/playmakers/", "/object/public/Playmakers/")
    .replace("/object/public/home/", "/object/public/Home/");
}

export function resolveValidatorPhotoUrl(row: Record<string, unknown>): string | null {
  const raw = String(row.photo_url ?? row.avatar_url ?? row.image_url ?? "").trim();
  return raw ? normalizeValidatorPhotoPublicUrl(raw) : null;
}
