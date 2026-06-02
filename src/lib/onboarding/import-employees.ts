import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedEmployeeRow } from "@/lib/onboarding/column-mapping";
import { IMPORT_BATCH_SIZE } from "@/lib/onboarding/constants";

export type EquipeRow = { id: string; name: string };

export async function createEquipesFromDepartments(
  supabase: SupabaseClient,
  departments: string[],
  organisationId: string,
): Promise<EquipeRow[]> {
  const equipes: EquipeRow[] = [];
  for (const dept of departments) {
    const name = dept.trim();
    if (!name) continue;
    const { data, error } = await supabase
      .from("equipes")
      .insert({
        organisation_id: organisationId,
        name,
        description: `Équipe ${name} — créée automatiquement à l'import`,
        source: "csv_import",
      })
      .select("id, name")
      .single();
    if (!error && data) {
      equipes.push({ id: data.id as string, name: data.name as string });
    }
  }
  return equipes;
}

export async function bulkCreateEmployees(
  supabase: SupabaseClient,
  employees: ParsedEmployeeRow[],
  equipes: EquipeRow[],
  organisationId: string,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const deptToEquipe = new Map(equipes.map((e) => [e.name.toLowerCase(), e.id]));
  const valid = employees.filter((e) => !e._skipReason);
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < valid.length; i += IMPORT_BATCH_SIZE) {
    const batch = valid.slice(i, i + IMPORT_BATCH_SIZE);
    const rows = batch.map((e) => {
      const dept = e.department?.trim() ?? "";
      const equipeId = dept ? deptToEquipe.get(dept.toLowerCase()) ?? null : null;
      return {
        company_id: organisationId,
        equipe_id: equipeId,
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email,
        job_title: e.job_title || null,
        department: e.department,
      };
    });

    const { error } = await supabase.from("employees").insert(rows);
    if (error) {
      errors.push(`Lot ${i / IMPORT_BATCH_SIZE + 1}: ${error.message}`);
      skipped += batch.length;
    } else {
      created += batch.length;
    }
  }

  return { created, skipped, errors };
}
