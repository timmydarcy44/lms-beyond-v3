export type EntrepriseEmployee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  created_at: string | null;
  diagnostic_done: boolean;
  idmc_score: number | null;
  formation_active: boolean;
};

export type EntrepriseOverviewData = {
  super_admin_preview?: boolean;
  configuration_required?: boolean;
  needsOnboarding?: boolean;
  onboarding_href?: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation?: { id: string; name: string };
  kpis?: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    enrollments_active: number;
  };
  employees: EntrepriseEmployee[];
  employees_pending?: number;
  [key: string]: unknown;
};
