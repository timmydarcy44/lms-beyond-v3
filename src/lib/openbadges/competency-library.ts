import { getServiceRoleClient } from "@/lib/supabase/server";
import { readCompetencies, type ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";

export const PROTECTED_BADGE_IDS = new Set([
  "c541654e-858f-47c3-b84c-30466fc4dcf4",
  "a1000001-0000-4000-8000-000000000001",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function missingTable(message: string): boolean {
  return /does not exist|schema cache|42P01/i.test(message);
}

export async function listLibraryCompetencies(): Promise<ByoundCompetencyDraft[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];
  const table = await supabase.from("competencies").select("id, slug, name, definition, domain_id, status, validated_by, validated_at, archived_at") as unknown as {
    data: Array<Record<string, string | null>> | null;
    error: { message?: string } | null;
  };
  const tableMessage = table.error?.message ?? "";
  const fromTable: ByoundCompetencyDraft[] = table.error || missingTable(tableMessage)
    ? []
    : (table.data ?? []).map((row) => ({
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name),
        definition: String(row.definition ?? ""),
        domainId: row.domain_id ? String(row.domain_id) : null,
        status: row.status === "draft" ? "draft" : "validated",
        validatedBy: row.validated_by ? String(row.validated_by) : null,
        validatedAt: row.validated_at ? String(row.validated_at) : null,
        archivedAt: row.archived_at ? String(row.archived_at) : null,
      }));
  const { data } = await supabase.from("open_badges").select("id, status, evaluation_config").limit(400);
  const embedded: ByoundCompetencyDraft[] = [];
  for (const row of data ?? []) {
    if (String(row.status ?? "").toLowerCase() === "active") continue;
    if (PROTECTED_BADGE_IDS.has(String(row.id))) continue;
    const builder = asRecord(asRecord(row.evaluation_config).builder);
    for (const item of [...readCompetencies(builder), ...readCompetencies(asRecord(builder.catalog))]) {
      if (!embedded.some((current) => current.id === item.id || current.slug === item.slug)) embedded.push(item);
    }
  }
  return [...fromTable, ...embedded.filter((item) => !fromTable.some((current) => current.id === item.id || current.slug === item.slug))];
}

export async function retargetCompetency(sourceId: string, targetId: string) {
  const supabase = getServiceRoleClient();
  if (!supabase || !sourceId || !targetId || sourceId === targetId) return;
  const target = (await listLibraryCompetencies()).find((item) => item.id === targetId);
  if (!target) return;
  const { data } = await supabase.from("open_badges").select("id, status, evaluation_config").limit(400);
  for (const row of data ?? []) {
    const id = String(row.id);
    if (PROTECTED_BADGE_IDS.has(id)) continue;
    const config = asRecord(row.evaluation_config);
    const builder = asRecord(config.builder);
    const competencies = readCompetencies(builder);
    if (!competencies.some((item) => item.id === sourceId)) continue;
    await supabase.from("open_badges").update({
      evaluation_config: {
        ...config,
        builder: {
          ...builder,
          competencies: competencies.map((item) => item.id === sourceId ? target : item),
          skills: competencies.map((item) => item.id === sourceId ? target.name : item.name),
        },
      },
    }).eq("id", id);
  }
  const link = await supabase.from("badge_competencies").update({ competency_id: targetId }).eq("competency_id", sourceId) as unknown as { error: { message?: string } | null };
  if (link.error && !missingTable(link.error.message ?? "")) return;
}

export async function validateLibraryCompetency(input: { id: string; definition?: string; validatorName: string }) {
  const supabase = getServiceRoleClient();
  if (!supabase) return { ok: false as const, error: "Base indisponible" };
  const now = new Date().toISOString();
  const definition = input.definition?.trim();
  const table = await supabase.from("competencies").update({
    status: "validated",
    ...(definition ? { definition } : {}),
    validated_by: input.validatorName,
    validated_at: now,
  }).eq("id", input.id) as unknown as { error: { message?: string } | null };
  if (table.error && !missingTable(table.error.message ?? "")) {
    return { ok: false as const, error: table.error.message };
  }
  const { data } = await supabase.from("open_badges").select("id, status, evaluation_config").limit(400);
  for (const row of data ?? []) {
    const id = String(row.id);
    if (PROTECTED_BADGE_IDS.has(id) || String(row.status ?? "").toLowerCase() === "active") continue;
    const config = asRecord(row.evaluation_config);
    const builder = asRecord(config.builder);
    const stamp = (item: ByoundCompetencyDraft): ByoundCompetencyDraft =>
      item.id === input.id || item.slug === input.id
        ? { ...item, definition: definition || item.definition, status: "validated", validatedBy: input.validatorName, validatedAt: now }
        : item;
    const competencies = readCompetencies(builder).map(stamp);
    const catalog = asRecord(builder.catalog);
    const catalogCompetencies = readCompetencies(catalog).map(stamp);
    const changed = competencies.some((item, index) => item.status !== readCompetencies(builder)[index]?.status)
      || catalogCompetencies.some((item) => item.id === input.id || item.slug === input.id);
    if (!changed) continue;
    await supabase.from("open_badges").update({
      evaluation_config: {
        ...config,
        builder: { ...builder, competencies, catalog: { ...catalog, competencies: catalogCompetencies } },
      },
    }).eq("id", id);
  }
  return { ok: true as const };
}
