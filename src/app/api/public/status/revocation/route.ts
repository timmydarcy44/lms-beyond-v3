import { getServiceRoleClient } from "@/lib/supabase/server";
import { BADGE_PUBLIC_ORIGIN } from "@/lib/openbadges/v3/credential";
import { refreshRevocationList, revocationListDocument } from "@/lib/openbadges/v3/revocation";
import { publicCorsPreflight, publicJson } from "@/lib/openbadges/v3/public-json";

export async function GET() {
  const db = getServiceRoleClient();
  if (!db) return publicJson({ error: "NOT_FOUND" }, 404);
  await refreshRevocationList(db);
  const { data, error } = await db
    .from("badge_assertions")
    .select("id, revoked_at, revocation_reason")
    .not("revoked_at", "is", null);
  if (error) return publicJson({ error: "NOT_FOUND" }, 404);
  const entries = (data ?? []).map((row) => ({
    id: `${BADGE_PUBLIC_ORIGIN}/badges/${row.id}`,
    revoked: true,
    ...(row.revocation_reason ? { revocationReason: String(row.revocation_reason) } : {}),
  }));
  return publicJson(revocationListDocument(entries));
}

export function OPTIONS() {
  return publicCorsPreflight();
}
