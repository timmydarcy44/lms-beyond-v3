import { slugifyCareName } from "@/lib/care/completeness";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareDomain } from "@/lib/care/domains";
import type { CareSessionFormat } from "@/lib/care/available-slots";

type Db = NonNullable<ReturnType<typeof getServiceRoleClient>>;

async function uniqueSlug(db: Db, base: string, expertId: string) {
  let slug = base || "praticien";
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const { data } = await db.from("care_profiles").select("expert_id").eq("slug", candidate).maybeSingle();
    if (!data || String(data.expert_id) === expertId) return candidate;
  }
  return `${slug}-${expertId.slice(0, 8)}`;
}

function fromExpert(expert: Record<string, unknown> | null) {
  const display = [expert?.first_name, expert?.last_name].filter(Boolean).join(" ").trim() || "Praticien";
  const formats = Array.isArray(expert?.formats_supported) ? expert.formats_supported.map(String) : [];
  return {
    display_name: display,
    title: String(expert?.headline ?? "").trim(),
    headline: String(expert?.headline ?? "").trim(),
    bio: String(expert?.bio ?? "").trim(),
    avatar_url: String(expert?.avatar_url ?? expert?.photo_url ?? "").trim() || null,
    city: Array.isArray(expert?.regions) ? String(expert.regions[0] ?? "").trim() || null : null,
    offers_cabinet: formats.some((item) => /cabinet|presentiel|sur site/i.test(item)),
    offers_visio: formats.some((item) => /visio|distanciel|en ligne/i.test(item)) || formats.length === 0,
  };
}

export async function ensureCareProfile(db: Db, expertId: string) {
  const { data: expert } = await db
    .from("experts")
    .select("first_name, last_name, headline, bio, avatar_url, photo_url, formats_supported, regions")
    .eq("id", expertId)
    .maybeSingle();
  const seeded = fromExpert(expert as Record<string, unknown> | null);
  const { data: existing } = await db
    .from("care_profiles")
    .select("slug, is_care, title, headline, bio, avatar_url, city, offers_cabinet, offers_visio, display_name")
    .eq("expert_id", expertId)
    .maybeSingle();
  if (existing) {
    const patch: Record<string, unknown> = { is_care: true, updated_at: new Date().toISOString() };
    if (!String(existing.display_name ?? "").trim()) patch.display_name = seeded.display_name;
    if (!String(existing.title ?? "").trim() && seeded.title) patch.title = seeded.title;
    if (!String(existing.headline ?? "").trim() && seeded.headline) patch.headline = seeded.headline;
    if (!String(existing.bio ?? "").trim() && seeded.bio) patch.bio = seeded.bio;
    if (!existing.avatar_url && seeded.avatar_url) patch.avatar_url = seeded.avatar_url;
    if (!existing.city && seeded.city) patch.city = seeded.city;
    if (existing.offers_cabinet !== true && existing.offers_visio !== true) {
      patch.offers_cabinet = seeded.offers_cabinet;
      patch.offers_visio = seeded.offers_visio;
    }
    await db.from("care_profiles").update(patch).eq("expert_id", expertId);
    return String(existing.slug);
  }
  const slug = await uniqueSlug(db, slugifyCareName(seeded.display_name), expertId);
  const { error } = await db.from("care_profiles").insert({
    expert_id: expertId,
    slug,
    is_care: true,
    published: false,
    ...seeded,
  });
  if (error) throw new Error(error.message);
  return slug;
}

export async function ensureDefaultCareService(db: Db, expertId: string) {
  await ensureCareProfile(db, expertId);
  const { data: existing } = await db
    .from("care_services")
    .select("id, domain, duration_min, formats, price_cents, name")
    .eq("expert_id", expertId)
    .eq("active", true)
    .order("position")
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    return {
      id: String(existing.id),
      domain: String(existing.domain) as CareDomain,
      duration_min: Number(existing.duration_min) || 60,
      formats: (Array.isArray(existing.formats) ? existing.formats : ["visio"]) as CareSessionFormat[],
      price_cents: Number(existing.price_cents) || 0,
      name: String(existing.name ?? "Séance"),
    };
  }
  const { data: inserted, error } = await db
    .from("care_services")
    .insert({
      expert_id: expertId,
      position: 0,
      name: "Séance d'accompagnement",
      domain: "famille",
      description: "",
      duration_min: 60,
      formats: ["visio", "cabinet"],
      price_cents: 0,
      active: true,
    })
    .select("id, domain, duration_min, formats, price_cents, name")
    .maybeSingle();
  if (error || !inserted) throw new Error(error?.message ?? "Prestation introuvable");
  return {
    id: String(inserted.id),
    domain: String(inserted.domain) as CareDomain,
    duration_min: Number(inserted.duration_min) || 60,
    formats: (Array.isArray(inserted.formats) ? inserted.formats : ["visio"]) as CareSessionFormat[],
    price_cents: Number(inserted.price_cents) || 0,
    name: String(inserted.name ?? "Séance"),
  };
}
