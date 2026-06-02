export function buildEmptyEntrepriseOverviewPayload(viewer: {
  email: string | null;
  prenom: string | null;
  nom: string | null;
}) {
  return {
    viewer,
    organisation: null,
    employees: [],
    employees_pending: 0,
    kpis: {
      employees_total: 0,
      diagnostics_completed: 0,
      diagnostics_total: 0,
      diagnostics_pct: 0,
      enrollments_active: 0,
      attention_signals: { insufficient: true, completed: 0, threshold: 5 },
    },
    this_week: { from: "", to: "", agenda: [], recent_activity: [] },
    formations: { presentiel: [], elearning: [] },
    collaborators_preview: [],
    equipe_insight: {
      week_end: null,
      insight: null,
      idmc: null,
      stress: null,
      cohesion: null,
      insufficient: true,
      completed: 0,
      threshold: 5,
    },
    mobility: { enabled: false, completed: 0, threshold: 10 },
  };
}
