import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { canonicalSkillName, foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";
import { findCatalogSkill, offerSkillKind, sameSkill } from "@/lib/entreprise/offer-skill-catalog";

export const offerSkillSchema = z.object({
  label: z.string().trim().min(1).max(80),
  kind: z.enum(["soft", "hard"]),
  importance: z.enum(["required", "preferred"]),
});

export type OfferSkillRow = {
  id: string;
  label: string;
  kind: "soft" | "hard";
  importance: "required" | "preferred";
  position: number;
  pending: boolean;
};

function missingColumn(message: string) {
  return /column|schema cache|relation|does not exist|42P01/i.test(message);
}

export async function listOfferSkills(service: SupabaseClient, offerId: string): Promise<OfferSkillRow[]> {
  const { data, error } = await service
    .from("offer_skills")
    .select("id, skill_id, importance, position")
    .eq("offer_id", offerId)
    .order("position", { ascending: true });
  if (error) {
    if (missingColumn(error.message)) return [];
    throw new Error(error.message);
  }
  const links = data ?? [];
  const skillIds = links.map((row) => String(row.skill_id ?? "")).filter(Boolean);
  const items = new Map<string, { label: string; kind: "soft" | "hard"; pending: boolean }>();
  if (skillIds.length) {
    const loaded = await service.from("offer_skill_items").select("id, label, kind, pending_review").in("id", skillIds);
    for (const item of loaded.data ?? []) {
      items.set(String(item.id), {
        label: String(item.label ?? ""),
        kind: item.kind === "soft" ? "soft" : "hard",
        pending: Boolean(item.pending_review),
      });
    }
  }
  return links.flatMap((row, index) => {
    const item = items.get(String(row.skill_id ?? ""));
    if (!item?.label) return [];
    return [{
      id: String(row.id),
      label: item.label,
      kind: item.kind,
      importance: row.importance === "required" ? "required" as const : "preferred" as const,
      position: Number(row.position ?? index),
      pending: item.pending,
    }];
  });
}

export async function replaceOfferSkills(
  service: SupabaseClient,
  offerId: string,
  organizationId: string,
  skills: Array<z.infer<typeof offerSkillSchema>>,
) {
  if (skills.length > 8) throw new Error("8 compétences maximum.");
  const existing = await service.from("offer_skills").select("id").eq("offer_id", offerId);
  if (existing.error && !missingColumn(existing.error.message)) throw new Error(existing.error.message);
  if (existing.error && missingColumn(existing.error.message)) {
    throw new Error("Collez la migration 20261024160000 pour enregistrer les compétences.");
  }
  if ((existing.data ?? []).length) {
    const removed = await service.from("offer_skills").delete().eq("offer_id", offerId);
    if (removed.error) throw new Error(removed.error.message);
  }

  const rows = [];
  for (const [position, skill] of skills.entries()) {
    const catalog = findCatalogSkill(skill.label);
    const label = catalog?.label ?? skill.label.trim();
    const kind = catalog?.kind ?? skill.kind ?? offerSkillKind(label);
    const catalogKey = catalog ? foldSkillKey(canonicalSkillName(label)) : null;
    let itemId: string | null = null;
    if (catalogKey) {
      const found = await service
        .from("offer_skill_items")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("catalog_key", catalogKey)
        .maybeSingle();
      itemId = found.data?.id ? String(found.data.id) : null;
    }
    if (!itemId) {
      const named = await service
        .from("offer_skill_items")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("label", label)
        .maybeSingle();
      itemId = named.data?.id ? String(named.data.id) : null;
    }
    if (!itemId) {
      const created = await service
        .from("offer_skill_items")
        .insert({
          organization_id: organizationId,
          label,
          kind,
          catalog_key: catalogKey,
          pending_review: !catalog,
        })
        .select("id")
        .maybeSingle();
      if (created.error || !created.data?.id) throw new Error(created.error?.message || "Compétence impossible");
      itemId = String(created.data.id);
    }
    rows.push({ offer_id: offerId, skill_id: itemId, importance: skill.importance, position });
  }
  if (!rows.length) return [];
  const inserted = await service.from("offer_skills").insert(rows);
  if (inserted.error) throw new Error(inserted.error.message);
  return listOfferSkills(service, offerId);
}

export async function criteriaForApplications(
  service: SupabaseClient,
  offerId: string,
  talentIds: string[],
) {
  const skills = await listOfferSkills(service, offerId);
  const required = skills.filter((skill) => skill.importance === "required");
  const total = required.length;
  const metByTalent = new Map<string, number>();
  if (!total || talentIds.length === 0) return { total, metByTalent };

  const { data: profiles } = await service.from("profiles").select("id, hard_skills").in("id", talentIds);
  for (const profile of profiles ?? []) {
    const owned = Array.isArray(profile.hard_skills) ? profile.hard_skills.map((item) => String(item)) : [];
    const met = required.filter((skill) => owned.some((name) => sameSkill(name, skill.label))).length;
    metByTalent.set(String(profile.id), met);
  }
  return { total, metByTalent };
}
