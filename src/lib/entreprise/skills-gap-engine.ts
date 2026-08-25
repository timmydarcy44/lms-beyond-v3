/**
 * Moteur Skills Gap — DATA → CALCUL → RÈGLES → RECOMMANDATIONS (déterministe).
 */

import {
  computeSoftSkillGaps,
  formatGap,
  formatScoreOn15,
  parseMetierSoftSkillTargets,
  type SoftSkillGap,
} from "@/lib/entreprise/metier-skill-gaps";
import {
  classifyCollectiveScope,
  classifyGapSeverity,
  collectiveScopeLabel,
  EDGE_EXPERT_TRAINING_DAY_PRICE_EUR,
  gapSeverityLabel,
  SKILLS_GAP_MIN_EVALUATED_FOR_COLLECTIVE,
  type CollectiveScope,
  type GapSeverity,
} from "@/lib/entreprise/skills-gap-config";

export type SkillsGapEmployeeInput = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  department?: string | null;
  metier?: string | null;
  soft_skills: Array<{ skill: string; score: number }>;
  has_soft_skills: boolean;
};

export type SkillsGapMetierInput = {
  id: string;
  title: string;
  soft_skills: string[];
  department_hint?: string | null;
};

export type IndividualSkillGapRow = SoftSkillGap & {
  employee_id: string;
  employee_name: string;
  metier_id: string;
  metier_title: string;
  department: string | null;
};

export type CollectiveNeed = {
  id: string;
  skill: string;
  metier_id: string;
  metier_title: string;
  department: string | null;
  target: number;
  avg_observed: number;
  avg_gap: number;
  evaluated_count: number;
  under_target_count: number;
  under_target_pct: number;
  scope: CollectiveScope;
  scope_label: string;
  representative: boolean;
  insufficient_reason: string | null;
  priority_score: number;
  explanation: string;
  employees: Array<{
    id: string;
    name: string;
    observed: number;
    gap: number;
    severity: GapSeverity;
  }>;
};

export type SkillsGapAction =
  | { type: "edge_online"; label: string; href: string }
  | { type: "coaching"; label: string; href: string }
  | { type: "create_parcours"; label: string; href: string }
  | { type: "create_internal_formation"; label: string; href: string }
  | { type: "request_edge_training"; label: string; href: string; price_note: string }
  | { type: "recruit"; label: string; href: string };

function employeeName(e: SkillsGapEmployeeInput) {
  return [e.first_name, e.last_name].filter(Boolean).join(" ").trim() || "Collaborateur";
}

export function matchEmployeeToMetier(
  employee: SkillsGapEmployeeInput,
  metiers: SkillsGapMetierInput[],
): SkillsGapMetierInput | null {
  const title = String(employee.metier || employee.job_title || "")
    .trim()
    .toLowerCase();
  if (!title || metiers.length === 0) return null;
  const exact = metiers.find((m) => m.title.trim().toLowerCase() === title);
  if (exact) return exact;
  return (
    metiers.find(
      (m) =>
        title.includes(m.title.trim().toLowerCase()) ||
        m.title.trim().toLowerCase().includes(title),
    ) ?? null
  );
}

export function computeIndividualGapsForEmployee(
  employee: SkillsGapEmployeeInput,
  metier: SkillsGapMetierInput,
): IndividualSkillGapRow[] {
  if (!employee.has_soft_skills || employee.soft_skills.length === 0) return [];
  const targets = parseMetierSoftSkillTargets(metier.soft_skills);
  if (targets.length === 0) return [];
  const gaps = computeSoftSkillGaps(targets, employee.soft_skills);
  return gaps.map((gap) => ({
    ...gap,
    employee_id: employee.id,
    employee_name: employeeName(employee),
    metier_id: metier.id,
    metier_title: metier.title,
    department: employee.department ?? null,
  }));
}

function needId(metierId: string, skill: string) {
  return `${metierId}::${skill}`;
}

export function aggregateCollectiveNeeds(
  rows: IndividualSkillGapRow[],
): CollectiveNeed[] {
  const groups = new Map<string, IndividualSkillGapRow[]>();
  for (const row of rows) {
    if (row.actual == null || row.gap == null) continue;
    const key = needId(row.metier_id, row.skill);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const needs: CollectiveNeed[] = [];
  for (const [, list] of groups) {
    const first = list[0]!;
    const evaluated = list.length;
    const under = list.filter((r) => (r.gap ?? 0) < 0);
    const underCount = under.length;
    const avgObserved =
      list.reduce((sum, r) => sum + (r.actual ?? 0), 0) / Math.max(1, evaluated);
    const avgGap = list.reduce((sum, r) => sum + (r.gap ?? 0), 0) / Math.max(1, evaluated);
    const pct = evaluated > 0 ? (underCount / evaluated) * 100 : 0;
    const scope = classifyCollectiveScope(pct);
    const representative = evaluated >= SKILLS_GAP_MIN_EVALUATED_FOR_COLLECTIVE;
    const avgGapAbs = Math.abs(Math.min(0, avgGap));

    needs.push({
      id: needId(first.metier_id, first.skill),
      skill: first.skill,
      metier_id: first.metier_id,
      metier_title: first.metier_title,
      department: first.department,
      target: first.target,
      avg_observed: Math.round(avgObserved * 10) / 10,
      avg_gap: Math.round(avgGap * 10) / 10,
      evaluated_count: evaluated,
      under_target_count: underCount,
      under_target_pct: Math.round(pct),
      scope,
      scope_label: collectiveScopeLabel(scope),
      representative,
      insufficient_reason: representative
        ? null
        : `${evaluated} collaborateur${evaluated > 1 ? "s" : ""} évalué${evaluated > 1 ? "s" : ""} — données insuffisantes pour une lecture collective représentative (minimum ${SKILLS_GAP_MIN_EVALUATED_FOR_COLLECTIVE}).`,
      priority_score: representative ? avgGapAbs * (pct / 100) * evaluated : avgGapAbs * 0.2,
      explanation: `Score cible métier = ${formatScoreOn15(first.target)}. Score moyen des ${evaluated} collaborateurs évalués = ${formatScoreOn15(avgObserved)}. Écart moyen = observé − cible = ${formatGap(avgGap)}.`,
      employees: under
        .map((r) => ({
          id: r.employee_id,
          name: r.employee_name,
          observed: r.actual!,
          gap: r.gap!,
          severity: classifyGapSeverity(r.gap!),
        }))
        .sort((a, b) => a.gap - b.gap),
    });
  }

  return needs
    .filter((n) => n.under_target_count > 0)
    .sort((a, b) => b.priority_score - a.priority_score);
}

export function buildNeedActions(
  need: CollectiveNeed,
  options?: { metier_mobility_matches_count?: number },
): SkillsGapAction[] {
  const skillQ = encodeURIComponent(need.skill);
  const metierQ = encodeURIComponent(need.metier_title);
  const metierMobilityCount = options?.metier_mobility_matches_count ?? 0;
  const actions: SkillsGapAction[] = [];

  const isIndividual = need.scope === "individuel";
  const isMixed = need.scope === "intermediaire";
  const isCollective =
    need.scope === "collectif" || need.scope === "collectif_prioritaire";
  const isCollectivePriority = need.scope === "collectif_prioritaire";
  const severeGap = classifyGapSeverity(need.avg_gap) === "important";

  // Individuel / mixte → digital & coaching
  if (isIndividual || isMixed) {
    actions.push({
      type: "edge_online",
      label: "Formation EDGE Online",
      href: `/dashboard/entreprise/formations/catalogue?q=${skillQ}`,
    });
    actions.push({
      type: "coaching",
      label: "Coaching / accompagnement individuel",
      href: `/dashboard/entreprise/formations/parcours?skill=${skillQ}&mode=individuel`,
    });
  }

  // Mixte → présentiel aussi possible
  if (isMixed) {
    actions.push({
      type: "request_edge_training",
      label: "Formation présentiel EDGE",
      href: `/dashboard/entreprise/formations/demander?skill=${skillQ}&metier=${metierQ}&format=Présentiel`,
      price_note: `${EDGE_EXPERT_TRAINING_DAY_PRICE_EUR.toLocaleString("fr-FR")} € / jour`,
    });
  }

  // Collectif → présentiel / atelier d’équipe en priorité
  if (isCollective) {
    actions.push({
      type: "request_edge_training",
      label: "Formation présentiel EDGE (équipe)",
      href: `/dashboard/entreprise/formations/demander?skill=${skillQ}&metier=${metierQ}&format=Présentiel`,
      price_note: `${EDGE_EXPERT_TRAINING_DAY_PRICE_EUR.toLocaleString("fr-FR")} € / jour`,
    });
    actions.push({
      type: "create_internal_formation",
      label: "Créer une formation interne",
      href: `/dashboard/entreprise/formations/creer?skill=${skillQ}`,
    });
    actions.push({
      type: "create_parcours",
      label: "Créer un parcours collectif",
      href: `/dashboard/entreprise/formations/parcours?skill=${skillQ}&mode=collectif`,
    });
  }

  /**
   * Recrutement : besoin structurel + aucun profil multi-compétences
   * compatible avec le métier (pas sur une seule Soft Skill).
   */
  const shouldRecruit =
    (isCollectivePriority || (isCollective && severeGap)) && metierMobilityCount === 0;

  if (shouldRecruit) {
    actions.push({
      type: "recruit",
      label: "Créer une offre de recrutement",
      href: `/dashboard/entreprise/offres/creer?metier=${metierQ}&soft_skill=${skillQ}&target=${need.target}`,
    });
  }

  return actions;
}

export type MetierMobilityMatch = {
  id: string;
  name: string;
  metier_title: string;
  matched_skills: number;
  total_skills: number;
  match_ratio: number;
  avg_observed: number;
};

/**
 * Mobilité interne = fit multi-compétences sur le métier cible.
 * Une seule Soft Skill ne suffit jamais (minimum 2 compétences alignées).
 */
export function findMetierMobilityMatches(params: {
  targetMetierId: string;
  targets: Array<{ label?: string; skill?: string; target: number }>;
  allRows: IndividualSkillGapRow[];
  minMatchRatio?: number;
  limit?: number;
}): MetierMobilityMatch[] {
  const { targetMetierId, targets, allRows, minMatchRatio = 0.7, limit = 8 } = params;
  const normalizedTargets = targets
    .map((t) => ({
      skill: String(t.label ?? t.skill ?? "").trim(),
      target: t.target,
    }))
    .filter((t) => t.skill.length > 0);

  if (normalizedTargets.length < 2) return [];

  const targetBySkill = new Map(
    normalizedTargets.map((t) => [t.skill.toLowerCase(), t.target] as const),
  );
  const byEmployee = new Map<
    string,
    {
      name: string;
      metier_title: string;
      metier_id: string;
      hits: Array<{ skill: string; observed: number }>;
    }
  >();

  for (const row of allRows) {
    if (row.metier_id === targetMetierId) continue;
    if (row.actual == null) continue;
    const target = targetBySkill.get(row.skill.toLowerCase());
    if (target == null) continue;
    if (row.actual < target - 1) continue;

    const prev = byEmployee.get(row.employee_id);
    if (!prev) {
      byEmployee.set(row.employee_id, {
        name: row.employee_name,
        metier_title: row.metier_title,
        metier_id: row.metier_id,
        hits: [{ skill: row.skill, observed: row.actual }],
      });
    } else if (!prev.hits.some((h) => h.skill === row.skill)) {
      prev.hits.push({ skill: row.skill, observed: row.actual });
    }
  }

  return [...byEmployee.entries()]
    .map(([id, data]) => {
      const matched = data.hits.length;
      const ratio = matched / normalizedTargets.length;
      const avg =
        data.hits.reduce((sum, h) => sum + h.observed, 0) / Math.max(1, matched);
      return {
        id,
        name: data.name,
        metier_title: data.metier_title,
        matched_skills: matched,
        total_skills: normalizedTargets.length,
        match_ratio: Math.round(ratio * 100) / 100,
        avg_observed: Math.round(avg * 10) / 10,
      };
    })
    .filter((m) => m.matched_skills >= 2 && m.match_ratio >= minMatchRatio)
    .sort((a, b) => b.match_ratio - a.match_ratio || b.avg_observed - a.avg_observed)
    .slice(0, limit);
}

/** @deprecated Prefer findMetierMobilityMatches — une seule compétence ne justifie pas une mobilité. */
export function findInternalMobilityMatches(
  need: CollectiveNeed,
  allRows: IndividualSkillGapRow[],
  limit = 8,
): Array<{ id: string; name: string; observed: number; gap: number; metier_title: string }> {
  void need;
  void allRows;
  void limit;
  return [];
}

export function runSkillsGapEngine(params: {
  employees: SkillsGapEmployeeInput[];
  metiers: SkillsGapMetierInput[];
}) {
  const individualRows: IndividualSkillGapRow[] = [];
  let withoutMetier = 0;
  let withoutScores = 0;
  let withoutTargets = 0;

  for (const employee of params.employees) {
    if (!employee.has_soft_skills || employee.soft_skills.length === 0) {
      withoutScores += 1;
      continue;
    }
    const metier = matchEmployeeToMetier(employee, params.metiers);
    if (!metier) {
      withoutMetier += 1;
      continue;
    }
    const targets = parseMetierSoftSkillTargets(metier.soft_skills);
    if (targets.length === 0) {
      withoutTargets += 1;
      continue;
    }
    individualRows.push(...computeIndividualGapsForEmployee(employee, metier));
  }

  const needs = aggregateCollectiveNeeds(individualRows);
  const priorityNeeds = needs.filter(
    (n) =>
      n.representative &&
      (n.scope === "collectif" ||
        n.scope === "collectif_prioritaire" ||
        classifyGapSeverity(n.avg_gap) === "important" ||
        classifyGapSeverity(n.avg_gap) === "modere"),
  );

  return {
    scale: 15 as const,
    individual_rows: individualRows,
    needs,
    priority_needs: priorityNeeds.length > 0 ? priorityNeeds : needs.slice(0, 12),
    stats: {
      employees_total: params.employees.length,
      employees_with_scores: params.employees.filter((e) => e.has_soft_skills).length,
      employees_without_metier: withoutMetier,
      employees_without_scores: withoutScores,
      employees_metier_without_targets: withoutTargets,
      needs_count: needs.length,
    },
  };
}

export function describeSeverityForUi(severity: GapSeverity | "missing") {
  if (severity === "missing") return "Non mesuré";
  return gapSeverityLabel(severity);
}
