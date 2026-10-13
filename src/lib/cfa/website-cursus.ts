import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import type { SupabaseClient } from "@supabase/supabase-js";

export const WEBSITE_CURSUS = CFA_SPECIALIZATIONS.map((item) => {
  const prefix = item.group.split("·")[0]?.trim() || "CFA";
  return {
    code: item.value,
    name: `${prefix} ${item.label}`,
    description: item.group,
  };
});

export async function ensureWebsiteCursus(db: SupabaseClient, schoolId: string) {
  const { data: existing } = await db.from("school_curricula").select("code").eq("school_id", schoolId);
  const codes = new Set((existing ?? []).map((row) => String(row.code ?? "").trim()).filter(Boolean));
  const missing = WEBSITE_CURSUS.filter((item) => !codes.has(item.code));
  if (!missing.length) return;

  const { data: created } = await db
    .from("school_curricula")
    .insert(
      missing.map((item) => ({
        school_id: schoolId,
        name: item.name,
        code: item.code,
        description: item.description,
        status: "active",
      })),
    )
    .select("id, name");

  for (const row of created ?? []) {
    const { data: classRow } = await db
      .from("school_classes")
      .select("id")
      .eq("school_id", schoolId)
      .eq("curriculum_id", row.id)
      .limit(1)
      .maybeSingle();
    if (classRow?.id) continue;
    await db.from("school_classes").insert({ school_id: schoolId, name: row.name, curriculum_id: row.id });
  }
}
