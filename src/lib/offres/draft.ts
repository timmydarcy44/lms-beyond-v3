import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureOfferDraft(
  db: SupabaseClient,
  input: { userId: string; slug: string; firstName?: string | null; lastName?: string | null; email?: string | null },
) {
  const slug = input.slug.trim();
  if (!slug) return null;
  const offer = await db
    .from("job_offers")
    .select("id, status, public_status")
    .eq("public_slug", slug)
    .maybeSingle();
  const row = offer.data as { id?: string; status?: string | null; public_status?: string | null } | null;
  if (!row?.id || row.status !== "active" || row.public_status === "blocked") return null;

  const firstName = String(input.firstName ?? "").trim();
  const lastName = String(input.lastName ?? "").trim();
  const profile = await db.from("profiles").select("id").eq("id", input.userId).maybeSingle();
  if (!profile.data) {
    await db.from("profiles").insert({
      id: input.userId,
      email: input.email || null,
      first_name: firstName || null,
      last_name: lastName || null,
      role: "apprenant",
      role_type: "apprenant",
    });
  }
  if (firstName || lastName) {
    await db
      .from("profiles")
      .update({
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        ...(input.email ? { email: input.email } : {}),
      })
      .eq("id", input.userId);
  }

  const existing = await db
    .from("applications")
    .select("id, status")
    .eq("job_id", row.id)
    .eq("talent_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const current = existing.data as { id?: string; status?: string | null } | null;
  if (current?.id) return current.id;
  let created = await db
    .from("applications")
    .insert({ job_id: row.id, talent_id: input.userId, status: "draft", source: "public_offer" })
    .select("id")
    .single();
  if (created.error && /source|column|schema cache/i.test(created.error.message)) {
    created = await db.from("applications").insert({ job_id: row.id, talent_id: input.userId, status: "draft" }).select("id").single();
  }
  if (created.error) {
    console.warn("[offre-draft]", created.error.message);
    return null;
  }
  return String((created.data as { id?: string } | null)?.id ?? "") || null;
}
