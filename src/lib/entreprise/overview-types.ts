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
  formation_title?: string | null;
  formation_percent?: number | null;
  badge_count?: number;
  skills?: Array<{ name: string; status: "declared" | "proof" | "badge" }>;
  diagnostic_at?: string | null;
  diagnostic_label?: string | null;
  avatar_url?: string | null;
  last_activity_at?: string | null;
};

export type EntrepriseOverviewData = {
  super_admin_preview?: boolean;
  configuration_required?: boolean;
  needsOnboarding?: boolean;
  onboarding_href?: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation?: { id: string; name: string; logo_url?: string | null };
  kpis?: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    enrollments_active: number;
    badges_awarded?: number;
    badges_this_month?: number;
    formation_progress_avg?: number | null;
  };
  employees: EntrepriseEmployee[];
  employees_pending?: number;
  [key: string]: unknown;
};
