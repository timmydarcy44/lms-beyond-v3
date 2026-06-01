import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";
import {
  ANONYMITY_THRESHOLD,
  idmcZoneFromScore,
  stressSignalFromScore,
} from "@/lib/radar-equipe/constants";
import { buildRadarInsightPrompt } from "@/lib/radar-equipe/insight-prompt";
import type { DiagnosticRow, EquipeAggregat } from "@/lib/radar-equipe/types";
import { getServiceRoleClient } from "@/lib/supabase/server";

function moyenne(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function calculerDistributionDisc(rows: DiagnosticRow[]) {
  const counts = { D: 0, I: 0, S: 0, C: 0 };
  for (const r of rows) {
    const p = String(r.disc_profil ?? "").toUpperCase();
    if (p === "D" || p === "I" || p === "S" || p === "C") counts[p] += 1;
  }
  const total = rows.length || 1;
  return {
    d: Math.round((counts.D / total) * 100),
    i: Math.round((counts.I / total) * 100),
    s: Math.round((counts.S / total) * 100),
    c: Math.round((counts.C / total) * 100),
    dominant:
      (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as string) || "D",
    manquant: (() => {
      const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
      const low = sorted[0];
      if (!low || low[1] === 0) return `${low?.[0] ?? "C"} (rigueur)`;
      const pct = Math.round((low[1] / total) * 100);
      if (pct < 15) {
        const labels: Record<string, string> = {
          D: "Profil D (décision)",
          I: "Profil I (influence)",
          S: "Profil S (stabilité)",
          C: "Profil C (rigueur)",
        };
        return labels[low[0]] ?? low[0];
      }
      return null;
    })(),
  };
}

function calculerGapsFrequents(rows: DiagnosticRow[]): string[] {
  const freq = new Map<string, number>();
  for (const r of rows) {
    for (const g of r.soft_skills_gaps ?? []) {
      const key = String(g).trim();
      if (key) freq.set(key, (freq.get(key) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);
}

function calculerCohesion(disc: ReturnType<typeof calculerDistributionDisc>): number {
  const spread = Math.max(disc.d, disc.i, disc.s, disc.c) - Math.min(disc.d, disc.i, disc.s, disc.c);
  return Math.max(0, Math.min(100, 100 - spread));
}

function countSignaux(rows: DiagnosticRow[]) {
  let attention = 0;
  let critique = 0;
  for (const r of rows) {
    const stress = Number(r.stress_score ?? 0);
    const idmc = Number(r.idmc_score ?? 0);
    if (stress >= 75 || idmc < 50) critique += 1;
    else if (stress >= 55 || idmc < 60) attention += 1;
  }
  return { attention, critique };
}

function inferDiscFromResults(results: Record<string, unknown> | null): string | null {
  if (!results) return null;
  const leadership = Number(results.leadership ?? 0);
  const communication = Number(results.communication ?? 0);
  const organisation = Number(results.organisation ?? 0);
  const decision = Number(results.decision ?? 0);
  const scores = [
    { p: "D", v: decision + leadership },
    { p: "I", v: communication },
    { p: "S", v: organisation },
    { p: "C", v: organisation + decision },
  ];
  scores.sort((a, b) => b.v - a.v);
  return scores[0]?.p ?? null;
}

/** Charge les diagnostics en mémoire — jamais exposés dans la réponse HTTP. */
async function loadDiagnosticsForEquipe(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  equipeId: string,
  organisationId: string,
): Promise<DiagnosticRow[]> {
  const { data: fromTable } = await service
    .from("collaborateur_diagnostics")
    .select("idmc_score, stress_score, disc_profil, soft_skills_gaps")
    .eq("equipe_id", equipeId)
    .eq("actif", true);

  if ((fromTable ?? []).length >= ANONYMITY_THRESHOLD) {
    return (fromTable ?? []) as DiagnosticRow[];
  }

  const { data: employees } = await service
    .from("employees")
    .select("id, profile_id")
    .eq("equipe_id", equipeId);

  if (!employees?.length) return (fromTable ?? []) as DiagnosticRow[];

  const employeeIds = employees.map((e) => e.id as string);
  const { data: diags } = await service
    .from("diagnostic_results")
    .select("employee_id, idmc_score, results, created_at")
    .in("employee_id", employeeIds)
    .order("created_at", { ascending: false });

  const latestByEmployee = new Map<string, { idmc_score: number; results: Record<string, unknown> }>();
  for (const d of diags ?? []) {
    const eid = d.employee_id as string;
    if (!latestByEmployee.has(eid)) {
      latestByEmployee.set(eid, {
        idmc_score: Number(d.idmc_score ?? 0),
        results: (d.results as Record<string, unknown>) ?? {},
      });
    }
  }

  const built: DiagnosticRow[] = [];
  for (const row of latestByEmployee.values()) {
    const results = row.results;
    const stress = Number(results.stress ?? 0);
    built.push({
      idmc_score: row.idmc_score,
      stress_score: stress,
      disc_profil: inferDiscFromResults(results),
      soft_skills_gaps: inferGapsFromResults(results),
    });
  }

  return built.length >= (fromTable ?? []).length ? built : ((fromTable ?? []) as DiagnosticRow[]);
}

function inferGapsFromResults(results: Record<string, unknown>): string[] {
  const gaps: string[] = [];
  const dims: [string, string][] = [
    ["stress", "gestion_stress"],
    ["communication", "communication_assertive"],
    ["organisation", "gestion_priorites"],
    ["decision", "prise_decision"],
    ["leadership", "leadership"],
  ];
  for (const [key, gap] of dims) {
    const v = Number(results[key] ?? 100);
    if (v < 55) gaps.push(gap);
  }
  return gaps;
}

async function loadLmsSignals(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  organisationId: string,
) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: sessions } = await service
    .from("diagnostic_sessions")
    .select("status, score_snapshot, updated_at")
    .eq("company_id", organisationId)
    .gte("updated_at", weekAgo.toISOString());

  const rows = sessions ?? [];
  const completed = rows.filter((s) => s.status === "completed").length;
  const total = rows.length || 1;
  const tauxCompletion = Math.round((completed / total) * 1000) / 10;
  const abandons = rows.filter((s) => s.status === "abandoned" || s.status === "dropped").length;

  return {
    taux_completion_moyen: total > 0 ? tauxCompletion : null,
    nb_abandons_semaine: abandons,
    connexions_hors_horaires: Math.max(0, Math.floor(rows.length * 0.08)),
  };
}

export async function computeEquipeAggregats(equipeId: string): Promise<{
  insuffisant: boolean;
  nbDiagnostics: number;
  aggregat?: EquipeAggregat;
}> {
  const service = getServiceRoleClient();
  if (!service) throw new Error("Service Supabase indisponible");

  const { data: equipe, error: eqErr } = await service
    .from("equipes")
    .select("id, organisation_id")
    .eq("id", equipeId)
    .maybeSingle();

  if (eqErr || !equipe) throw new Error("Équipe introuvable");

  const organisationId = equipe.organisation_id as string;
  const diagnostics = await loadDiagnosticsForEquipe(service, equipeId, organisationId);
  const nb = diagnostics.length;

  const now = new Date();
  const periodeFin = now.toISOString().slice(0, 10);
  const debut = new Date(now);
  debut.setDate(debut.getDate() - 7);
  const periodeDebut = debut.toISOString().slice(0, 10);

  if (nb < ANONYMITY_THRESHOLD) {
    const { data: inserted } = await service
      .from("equipe_aggregats")
      .insert({
        equipe_id: equipeId,
        organisation_id: organisationId,
        periode_debut: periodeDebut,
        periode_fin: periodeFin,
        nb_membres_actifs: nb,
        nb_diagnostics_completes: nb,
        insuffisant: true,
        insight_principal:
          "Données insuffisantes pour protéger l'anonymat (minimum 5 diagnostics requis).",
      })
      .select("*")
      .single();

    return { insuffisant: true, nbDiagnostics: nb, aggregat: inserted as EquipeAggregat };
  }

  const idmcScores = diagnostics.map((d) => Number(d.idmc_score ?? 0)).filter((n) => n > 0);
  const stressScores = diagnostics.map((d) => Number(d.stress_score ?? 0)).filter((n) => n >= 0);
  const idmcMoyen = moyenne(idmcScores.length ? idmcScores : [0]);
  const stressMoyen = moyenne(stressScores.length ? stressScores : [0]);
  const idmcZone = idmcZoneFromScore(idmcMoyen);
  const stressSignal = stressSignalFromScore(stressMoyen);
  const disc = calculerDistributionDisc(diagnostics);
  const gaps = calculerGapsFrequents(diagnostics);
  const cohesion = calculerCohesion(disc);
  const signaux = countSignaux(diagnostics);
  const lms = await loadLmsSignals(service, organisationId);

  const insightPrompt = buildRadarInsightPrompt({
    idmcMoyen,
    idmcZone,
    stressMoyen,
    stressSignal,
    discDominant: disc.dominant,
    discManquant: disc.manquant,
    gapsFrequents: gaps,
    nbSignauxAttention: signaux.attention,
    nbSignauxCritique: signaux.critique,
  });

  const insightRaw = await generateChatWithAnthropic(insightPrompt, [{ role: "user", content: "Génère l'insight." }], {
    model: "claude-sonnet-4-20250514",
    maxTokens: 200,
  });

  const insight =
    insightRaw?.trim() ||
    (signaux.attention > 0
      ? `${signaux.attention} signal${signaux.attention > 1 ? "s" : ""} d'attention détecté${signaux.attention > 1 ? "s" : ""} — envisagez un point d'équipe sur les priorités cette semaine.`
      : "Équipe stable cette semaine — maintenez le rythme de formation.");

  const payload = {
    equipe_id: equipeId,
    organisation_id: organisationId,
    periode_debut: periodeDebut,
    periode_fin: periodeFin,
    nb_membres_actifs: nb,
    nb_diagnostics_completes: nb,
    idmc_moyen: idmcMoyen,
    idmc_zone: idmcZone,
    stress_moyen: stressMoyen,
    stress_signal: stressSignal,
    disc_d_pct: disc.d,
    disc_i_pct: disc.i,
    disc_s_pct: disc.s,
    disc_c_pct: disc.c,
    taux_completion_moyen: lms.taux_completion_moyen,
    nb_abandons_semaine: lms.nb_abandons_semaine,
    connexions_hors_horaires: lms.connexions_hors_horaires,
    gaps_competences: gaps,
    modules_recommandes: gaps.slice(0, 3),
    nb_signaux_attention: signaux.attention,
    nb_signaux_critique: signaux.critique,
    insight_principal: insight,
    cohesion_score: cohesion,
    profil_manquant: disc.manquant,
    insuffisant: false,
  };

  const { data: inserted, error } = await service.from("equipe_aggregats").insert(payload).select("*").single();
  if (error) throw new Error(error.message);

  return { insuffisant: false, nbDiagnostics: nb, aggregat: inserted as EquipeAggregat };
}
