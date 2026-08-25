import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildEdgebsSkillsGapInputs,
  shouldEnrichEdgebsDemo,
} from "@/lib/entreprise/edgebs-demo-enrich";
import {
  EDGEBS_DEMO_METIERS,
  EDGEBS_ORG_ID,
  isEdgebsDemoViewer,
} from "@/lib/entreprise/edgebs-demo-data";
import { parseMetierSoftSkillTargets } from "@/lib/entreprise/metier-skill-gaps";
import {
  buildNeedActions,
  findMetierMobilityMatches,
  runSkillsGapEngine,
  type CollectiveNeed,
  type MetierMobilityMatch,
  type SkillsGapEmployeeInput,
  type SkillsGapMetierInput,
} from "@/lib/entreprise/skills-gap-engine";
import {
  parseSoftSkillsScoreEntries,
  pickLatestSoftSkillsRow,
} from "@/lib/soft-skills/resolve-soft-skills-result";

type AccessLike = {
  organizationId: string;
  viewer: { email?: string | null };
};

export type SkillsGapApiPayload = ReturnType<typeof runSkillsGapEngine> & {
  needs_with_actions: Array<
    CollectiveNeed & {
      actions: ReturnType<typeof buildNeedActions>;
      /** Toujours vide au niveau skill — la mobilité est multi-compétences / métier. */
      mobility_matches: [];
    }
  >;
  /** Profils internes compatibles avec un métier (fit multi Soft Skills). */
  metier_mobility: Record<string, MetierMobilityMatch[]>;
  demo_enriched?: boolean;
};

async function loadMetiers(
  service: SupabaseClient,
  orgId: string,
  viewerEmail: string | null | undefined,
): Promise<SkillsGapMetierInput[]> {
  const { data } = await service
    .from("enterprise_job_roles")
    .select("id, title, soft_skills")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  let roles = (data ?? []).map((role) => ({
    id: String(role.id),
    title: String(role.title ?? ""),
    soft_skills: Array.isArray(role.soft_skills)
      ? role.soft_skills.map((s: unknown) => String(s))
      : [],
  }));

  if (
    roles.length === 0 &&
    (orgId === EDGEBS_ORG_ID || isEdgebsDemoViewer(viewerEmail))
  ) {
    roles = EDGEBS_DEMO_METIERS.map((m) => ({
      id: m.id,
      title: m.title,
      soft_skills: [...m.soft_skills],
    }));
  }

  return roles;
}

async function loadEmployeesWithSoftSkills(
  service: SupabaseClient,
  orgId: string,
): Promise<SkillsGapEmployeeInput[]> {
  const { data: employees } = await service
    .from("employees")
    .select("id, first_name, last_name, job_title, department, profile_id")
    .eq("company_id", orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = employees ?? [];
  const profileIds = rows
    .map((e) => (e.profile_id ? String(e.profile_id) : null))
    .filter((id): id is string => Boolean(id));

  const softByProfile = new Map<string, Array<{ skill: string; score: number }>>();

  if (profileIds.length > 0) {
    const [{ data: apprenantRows }, { data: salarieRows }] = await Promise.all([
      service
        .from("soft_skills_resultats")
        .select("learner_id, scores, taken_at")
        .in("learner_id", profileIds),
      service
        .from("soft_skills_resultats_salarie")
        .select("learner_id, scores, taken_at")
        .in("learner_id", profileIds),
    ]);

    const apprenantById = new Map(
      (apprenantRows ?? []).map((r) => [String(r.learner_id), r]),
    );
    const salarieById = new Map(
      (salarieRows ?? []).map((r) => [String(r.learner_id), r]),
    );

    for (const profileId of profileIds) {
      const latest = pickLatestSoftSkillsRow(
        apprenantById.get(profileId),
        salarieById.get(profileId),
      );
      const soft = parseSoftSkillsScoreEntries(latest?.scores);
      if (soft.length > 0) softByProfile.set(profileId, soft);
    }
  }

  return rows.map((e) => {
    const profileId = e.profile_id ? String(e.profile_id) : null;
    const soft = profileId ? softByProfile.get(profileId) ?? [] : [];
    return {
      id: String(e.id),
      first_name: (e.first_name as string | null) ?? null,
      last_name: (e.last_name as string | null) ?? null,
      job_title: (e.job_title as string | null) ?? null,
      department: (e.department as string | null) ?? null,
      metier: (e.job_title as string | null) ?? null,
      soft_skills: soft,
      has_soft_skills: soft.length > 0,
    };
  });
}

export async function buildSkillsGapPayload(
  service: SupabaseClient,
  access: AccessLike,
): Promise<SkillsGapApiPayload> {
  const viewerEmail = access.viewer.email;
  const useDemo = shouldEnrichEdgebsDemo(access.organizationId, viewerEmail ?? null);

  let employees: SkillsGapEmployeeInput[];
  let metiers: SkillsGapMetierInput[];
  let demo_enriched = false;

  if (useDemo) {
    const demo = buildEdgebsSkillsGapInputs();
    employees = demo.employees;
    metiers = demo.metiers;
    demo_enriched = true;
  } else {
    [employees, metiers] = await Promise.all([
      loadEmployeesWithSoftSkills(service, access.organizationId),
      loadMetiers(service, access.organizationId, viewerEmail),
    ]);
  }

  const engine = runSkillsGapEngine({ employees, metiers });

  const metier_mobility: Record<string, MetierMobilityMatch[]> = {};
  for (const metier of metiers) {
    const targets = parseMetierSoftSkillTargets(metier.soft_skills);
    metier_mobility[metier.id] = findMetierMobilityMatches({
      targetMetierId: metier.id,
      targets,
      allRows: engine.individual_rows,
    });
  }

  const needs_with_actions = engine.needs.map((need) => {
    const mobilityCount = metier_mobility[need.metier_id]?.length ?? 0;
    const actions = buildNeedActions(need, {
      metier_mobility_matches_count: mobilityCount,
    });
    return { ...need, actions, mobility_matches: [] as [] };
  });

  return {
    ...engine,
    needs_with_actions,
    metier_mobility,
    ...(demo_enriched ? { demo_enriched: true } : {}),
  };
}

export function findNeedInPayload(payload: SkillsGapApiPayload, needId: string) {
  const decoded = decodeURIComponent(needId);
  return (
    payload.needs_with_actions.find((n) => n.id === decoded || n.id === needId) ?? null
  );
}
