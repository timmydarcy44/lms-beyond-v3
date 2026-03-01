export function getSupabasePublicUrl(bucket: string, path: string): string {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  if (!supabaseUrl) {
    return "";
  }

  const encodedBucket = encodeURIComponent(bucket);
  const encodedPath = path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}


