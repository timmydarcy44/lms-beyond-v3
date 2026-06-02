/** Colonnes réelles de public.employees (vérifié via information_schema). */
export type EmployeeInsertRow = {
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string | null;
  job_title?: string | null;
  equipe_id?: string | null;
  manager_id?: string | null;
  profile_id?: string | null;
  status?: string | null;
};

export function buildEmployeeInsertRow(input: {
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string | null;
  job_title?: string | null;
  equipe_id?: string | null;
}): EmployeeInsertRow {
  return {
    company_id: input.company_id,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    department: input.department ?? null,
    job_title: input.job_title ?? null,
    ...(input.equipe_id ? { equipe_id: input.equipe_id } : {}),
  };
}
