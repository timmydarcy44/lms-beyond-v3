import type { IdmcZone, StressSignal } from "@/lib/radar-equipe/constants";

export type DiagnosticRow = {
  idmc_score: number | null;
  stress_score: number | null;
  disc_profil: string | null;
  soft_skills_gaps: string[] | null;
};

export type EquipeAggregat = {
  id: string;
  equipe_id: string;
  organisation_id: string;
  periode_debut: string;
  periode_fin: string;
  nb_membres_actifs: number;
  nb_diagnostics_completes: number;
  idmc_moyen: number | null;
  idmc_zone: IdmcZone | null;
  stress_moyen: number | null;
  stress_signal: StressSignal | null;
  disc_d_pct: number | null;
  disc_i_pct: number | null;
  disc_s_pct: number | null;
  disc_c_pct: number | null;
  taux_completion_moyen: number | null;
  nb_abandons_semaine: number | null;
  connexions_hors_horaires: number | null;
  gaps_competences: string[] | null;
  modules_recommandes: string[] | null;
  nb_signaux_attention: number | null;
  nb_signaux_critique: number | null;
  insight_principal: string | null;
  cohesion_score: number | null;
  profil_manquant: string | null;
  insuffisant: boolean;
  created_at: string;
};

export type ComputeResult =
  | { insuffisant: true; nbDiagnostics: number }
  | { insuffisant: false; aggregat: EquipeAggregat };
