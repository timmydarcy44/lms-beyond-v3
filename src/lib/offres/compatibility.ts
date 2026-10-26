import type { SupabaseClient } from "@supabase/supabase-js";
import { foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";
import {
  fetchLatestSoftSkillsResult,
  isCompleteSoftSkillsScores,
  parseSoftSkillsScoreEntries,
} from "@/lib/soft-skills/resolve-soft-skills-result";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export type CompatibilitySkill = { label: string; matched: boolean };

export type OfferCompatibility = {
  skills: CompatibilitySkill[];
  matched: number | null;
  total: number;
  revealed: boolean;
};

const EMPTY: OfferCompatibility = { skills: [], matched: null, total: 0, revealed: false };

function text(value: unknown) {
  return String(value ?? "").trim();
}

export async function loadOfferCompatibility(
  db: SupabaseClient,
  slug: string,
  userId: string | null,
): Promise<OfferCompatibility> {
  const offer = await db.from("job_offers").select("id, soft_skill_ids").eq("public_slug", slug).maybeSingle();
  if (offer.error || !offer.data) return EMPTY;
  const offerId = text((offer.data as { id?: string }).id);
  const labels = await keySkills(db, offerId, (offer.data as { soft_skill_ids?: unknown }).soft_skill_ids);
  if (!labels.length) return EMPTY;

  let revealed = false;
  const strengths = new Set<string>();
  if (userId) {
    const latest = await fetchLatestSoftSkillsResult(db, userId, "scores");
    const scores = latest?.scores;
    if (isCompleteSoftSkillsScores(scores)) {
      revealed = true;
      for (const entry of parseSoftSkillsScoreEntries(scores).slice(0, 5)) {
        strengths.add(foldSkillKey(entry.skill));
      }
    }
  }

  const skills = labels.map((label) => ({
    label,
    matched: revealed && strengths.has(foldSkillKey(label)),
  }));
  const matched = revealed ? skills.filter((skill) => skill.matched).length : null;
  return { skills, matched, total: skills.length, revealed };
}

async function keySkills(db: SupabaseClient, offerId: string, storedIds: unknown): Promise<string[]> {
  const links = await db
    .from("offer_skills")
    .select("importance, position, skill_id")
    .eq("offer_id", offerId)
    .order("position", { ascending: true });
  if (!links.error && links.data?.length) {
    const ids = links.data.map((row) => text((row as { skill_id?: string }).skill_id)).filter(Boolean);
    const items = ids.length
      ? await db.from("offer_skill_items").select("id, label, kind").in("id", ids)
      : { data: [] };
    const byId = new Map(
      (items.data ?? []).map((row) => [
        text((row as { id?: string }).id),
        row as { label?: string; kind?: string },
      ]),
    );
    const soft = links.data
      .map((row) => {
        const item = byId.get(text((row as { skill_id?: string }).skill_id));
        return {
          label: text(item?.label),
          kind: item?.kind,
          importance: text((row as { importance?: string }).importance),
        };
      })
      .filter((skill) => skill.label && skill.kind === "soft");
    const required = soft.filter((skill) => skill.importance === "required").map((skill) => skill.label);
    const chosen = (required.length ? required : soft.map((skill) => skill.label)).slice(0, 4);
    if (chosen.length) return chosen;
  }

  const ids = new Set(Array.isArray(storedIds) ? storedIds.map((item) => String(item)) : []);
  return SOFT_SKILLS.filter((skill) => ids.has(String(skill.id))).map((skill) => skill.titre).slice(0, 4);
}
