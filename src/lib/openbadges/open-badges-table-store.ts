import { getServiceRoleClient } from "@/lib/supabase/server";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import type { CreateBadgeClassRpcPayload } from "@/lib/openbadges/badge-repository";

type OpenBadgeRow = Record<string, unknown>;

function cfg(row: OpenBadgeRow): Record<string, unknown> {
  const c = row.evaluation_config;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : {};
}

export function openBadgeRowToBadgeClass(row: OpenBadgeRow): Record<string, unknown> {
  const config = cfg(row);
  const id = String(row.id ?? "");
  const criteriaUrl =
    typeof config.criteriaUrl === "string" && config.criteriaUrl.trim()
      ? config.criteriaUrl
      : id
        ? getBadgeCriteriaUrl(id)
        : null;

  return {
    id,
    orgId: row.org_id ?? config.orgId,
    name: row.name ?? row.title ?? "",
    description: row.description ?? "",
    imageUrl: row.image_url ?? null,
    imageTemplateUrl: row.image_url ?? "",
    criteriaUrl,
    criteriaText: config.criteriaText ?? null,
    criteriaMarkdown: row.criteria ?? config.criteriaMarkdown ?? null,
    status: String(row.status ?? "draft").toUpperCase(),
    receivabilityReviewMode: config.receivabilityReviewMode ?? "HUMAN",
    requiresEnrollment: Boolean(row.requires_enrollment),
    requiredCourseId: row.required_course_id ?? null,
    visibleInLearnerDashboard: Boolean(row.visible_in_learner_dashboard),
    level:
      typeof config.level === "number"
        ? config.level
        : typeof config.level === "string" && String(config.level).trim()
          ? Number.parseInt(String(config.level), 10)
          : null,
    evaluationMethods: Array.isArray(config.evaluationMethods) ? config.evaluationMethods : [],
    validatorExpertId: config.validatorExpertId ?? null,
    failureRemediationCourseId: config.failureRemediationCourseId ?? null,
    criteria: Array.isArray(config.criteria) ? config.criteria : [],
    receivability:
      config.receivability && typeof config.receivability === "object"
        ? (config.receivability as Record<string, unknown>)
        : {
            expectedModalities: "",
            aiEvaluationPrompt: "",
            methodConfigs: [],
          },
    evaluationConfig: config,
    evaluation_config: config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by_user_id ?? null,
  };
}

function buildEvaluationConfig(payload: CreateBadgeClassRpcPayload, criteriaUrl: string | null) {
  return {
    orgId: payload.orgId,
    level: payload.level ?? null,
    evaluationMethods: payload.evaluationMethods ?? [],
    validatorExpertId: payload.validatorExpertId ?? null,
    receivabilityReviewMode: payload.receivabilityReviewMode ?? "HUMAN",
    criteria: payload.criteria ?? [],
    criteriaText: payload.criteriaText ?? null,
    criteriaMarkdown: payload.criteriaMarkdown ?? null,
    criteriaUrl,
    receivability: payload.receivability ?? null,
    failureRemediationCourseId: payload.failureRemediationCourseId ?? null,
    tags: payload.tags ?? [],
    alignment: payload.alignment ?? null,
    version: payload.version ?? 1,
  };
}

function buildInsertRow(payload: CreateBadgeClassRpcPayload, criteriaUrl: string | null): Record<string, unknown> {
  const title = payload.name.trim();
  const courseId =
    payload.requiresEnrollment && payload.requiredCourseId
      ? payload.requiredCourseId
      : null;

  return {
    org_id: payload.orgId,
    created_by_user_id: payload.createdByUserId,
    course_id: courseId,
    name: title,
    title,
    description: payload.description,
    image_url: payload.imageUrl ?? payload.imageTemplateUrl ?? null,
    criteria: payload.criteriaMarkdown ?? null,
    status: String(payload.status ?? "DRAFT").toLowerCase(),
    visible_in_learner_dashboard: payload.visibleInLearnerDashboard ?? false,
    requires_enrollment: payload.requiresEnrollment ?? false,
    required_course_id: payload.requiresEnrollment ? payload.requiredCourseId : null,
    evaluation_config: buildEvaluationConfig(payload, criteriaUrl),
    updated_at: new Date().toISOString(),
  };
}

async function insertWithColumnFallback(row: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant.");

  const current = { ...row };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from("open_badges")
      .insert(current as never)
      .select("*")
      .single();

    if (!error && data) return data as OpenBadgeRow;

    const msg = String(error?.message ?? "");
    const code = String(error?.code ?? "");
    if (code === "42703" || /column .* does not exist/i.test(msg)) {
      const m = msg.match(/column "?([^"]+)"?/i);
      const col = m?.[1];
      if (col && col in current) {
        delete current[col];
        continue;
      }
    }
    throw new Error(msg || "insert open_badges failed");
  }
  throw new Error("insert open_badges : colonnes incompatibles");
}

async function updateWithColumnFallback(id: string, patch: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant.");

  const current = { ...patch, updated_at: new Date().toISOString() };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase
      .from("open_badges")
      .update(current as never)
      .eq("id", id)
      .select("*")
      .single();

    if (!error && data) return data as OpenBadgeRow;

    const msg = String(error?.message ?? "");
    if (/column .* does not exist/i.test(msg)) {
      const m = msg.match(/column "?([^"]+)"?/i);
      const col = m?.[1];
      if (col && col in current) {
        delete current[col];
        continue;
      }
    }
    throw new Error(msg || "update open_badges failed");
  }
  throw new Error("update open_badges : colonnes incompatibles");
}

export async function createOpenBadgeClassRow(
  payload: CreateBadgeClassRpcPayload,
): Promise<Record<string, unknown>> {
  const criteriaUrl =
    payload.criteriaUrl
    ?? (payload.autofillCriteriaUrl !== false ? null : null);

  const row = await insertWithColumnFallback(buildInsertRow(payload, criteriaUrl));

  if (payload.autofillCriteriaUrl !== false && !payload.criteriaUrl) {
    const url = getBadgeCriteriaUrl(String(row.id));
    const config = cfg(row);
    const updated = await updateWithColumnFallback(String(row.id), {
      evaluation_config: { ...config, criteriaUrl: url },
    });
    return openBadgeRowToBadgeClass(updated);
  }

  return openBadgeRowToBadgeClass(row);
}

export async function listOpenBadgeClassesByOrg(orgId: string): Promise<Record<string, unknown>[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("open_badges")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    if (/column .* does not exist/i.test(error.message)) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => openBadgeRowToBadgeClass(row as OpenBadgeRow));
}

/** Charge un badge admin par id (sans filtre org — réservé super-admin). */
export async function getOpenBadgeClassByIdOnly(id: string): Promise<Record<string, unknown> | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase.from("open_badges").select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;
  return openBadgeRowToBadgeClass(data as OpenBadgeRow);
}

export async function getOpenBadgeClassById(
  id: string,
  orgId: string,
): Promise<Record<string, unknown> | null> {
  const byId = await getOpenBadgeClassByIdOnly(id);
  if (!byId) return null;
  const rowOrg = String(byId.orgId ?? "").trim();
  if (rowOrg && rowOrg !== orgId) return null;
  return byId;
}

export async function updateOpenBadgeClassRow(
  id: string,
  orgId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const raw = await rawRow(id, orgId || undefined);
  if (!raw) return null;
  const effectiveOrgId = orgId || String(raw.org_id ?? cfg(raw).orgId ?? "").trim();
  if (!effectiveOrgId) return null;

  const baseConfig = cfg(raw);
  const nextConfig: Record<string, unknown> = {
    ...baseConfig,
    ...(payload.level !== undefined ? { level: payload.level } : {}),
    ...(payload.evaluationMethods !== undefined ? { evaluationMethods: payload.evaluationMethods } : {}),
    ...(payload.validatorExpertId !== undefined ? { validatorExpertId: payload.validatorExpertId } : {}),
    ...(payload.receivabilityReviewMode !== undefined
      ? { receivabilityReviewMode: payload.receivabilityReviewMode }
      : {}),
    ...(payload.criteria !== undefined ? { criteria: payload.criteria } : {}),
    ...(payload.receivability !== undefined ? { receivability: payload.receivability } : {}),
    ...(payload.failureRemediationCourseId !== undefined
      ? {
          failureRemediationCourseId:
            payload.failureRemediationCourseId && String(payload.failureRemediationCourseId).trim()
              ? String(payload.failureRemediationCourseId).trim()
              : null,
        }
      : {}),
  };

  const requiresEnrollment =
    payload.requiresEnrollment !== undefined ? Boolean(payload.requiresEnrollment) : Boolean(raw.requires_enrollment);

  const patch: Record<string, unknown> = {
    org_id: effectiveOrgId,
    ...(payload.name !== undefined ? { name: payload.name, title: payload.name } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.imageUrl !== undefined ? { image_url: payload.imageUrl } : {}),
    ...(payload.criteriaMarkdown !== undefined ? { criteria: payload.criteriaMarkdown } : {}),
    ...(payload.status !== undefined ? { status: String(payload.status).toLowerCase() } : {}),
    ...(payload.requiresEnrollment !== undefined ? { requires_enrollment: requiresEnrollment } : {}),
    ...(payload.requiredCourseId !== undefined
      ? {
          required_course_id: payload.requiredCourseId,
          course_id: requiresEnrollment && payload.requiredCourseId ? payload.requiredCourseId : null,
        }
      : {}),
    ...(payload.visibleInLearnerDashboard !== undefined
      ? { visible_in_learner_dashboard: payload.visibleInLearnerDashboard }
      : {}),
    evaluation_config: nextConfig,
  };

  const updated = await updateWithColumnFallback(id, patch);
  return openBadgeRowToBadgeClass(updated);
}

async function rawRow(id: string, orgId?: string): Promise<OpenBadgeRow | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;
  const { data } = await supabase.from("open_badges").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  if (orgId) {
    const rowOrg = String((data as OpenBadgeRow).org_id ?? cfg(data as OpenBadgeRow).orgId ?? "").trim();
    if (rowOrg && rowOrg !== orgId) return null;
  }
  return data as OpenBadgeRow;
}

function isLearnerVisibleBadgeStatus(raw: unknown): boolean {
  const value = String(raw ?? "").trim().toLowerCase();
  return value === "active" || value === "published";
}

function rowOrgId(row: OpenBadgeRow): string {
  return String(row.org_id ?? cfg(row).orgId ?? "").trim();
}

function mapLearnerVisibleRow(row: OpenBadgeRow) {
  const config = cfg(row);
  return {
    id: String(row.id),
    name: String(row.name ?? row.title ?? ""),
    description: String(row.description ?? ""),
    imageUrl: (row.image_url as string) ?? null,
    level: typeof config.level === "number" ? config.level : null,
    requiresEnrollment: Boolean(row.requires_enrollment),
    requiredCourseId: (row.required_course_id as string) ?? null,
  };
}

export async function listLearnerVisibleOpenBadges(orgId: string) {
  return listLearnerVisibleOpenBadgesForOrgs([orgId]);
}

/** Badges publiés + « visible dashboard apprenant » pour une ou plusieurs orgs. */
export async function listLearnerVisibleOpenBadgesForOrgs(orgIds: string[]) {
  const uniqueOrgIds = Array.from(new Set(orgIds.map((id) => id.trim()).filter(Boolean)));
  if (uniqueOrgIds.length === 0) return [];

  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const selectCols =
    "id, name, title, description, image_url, org_id, status, requires_enrollment, required_course_id, evaluation_config, visible_in_learner_dashboard, updated_at";

  const { data, error } = await supabase
    .from("open_badges")
    .select(selectCols)
    .in("org_id", uniqueOrgIds)
    .eq("visible_in_learner_dashboard", true)
    .order("updated_at", { ascending: false })
    .limit(48);

  if (error) {
    if (/column .* does not exist/i.test(error.message)) {
      const { data: fallbackRows, error: fallbackErr } = await supabase
        .from("open_badges")
        .select("id, name, title, description, image_url, org_id, status, evaluation_config, updated_at")
        .in("org_id", uniqueOrgIds)
        .order("updated_at", { ascending: false })
        .limit(48);
      if (fallbackErr) return [];
      return (fallbackRows ?? [])
        .filter((row) => {
          const r = row as OpenBadgeRow;
          return uniqueOrgIds.includes(rowOrgId(r)) && isLearnerVisibleBadgeStatus(r.status);
        })
        .map((row) => mapLearnerVisibleRow(row as OpenBadgeRow));
    }
    throw new Error(error.message);
  }

  const byId = new Map<string, ReturnType<typeof mapLearnerVisibleRow>>();
  for (const row of data ?? []) {
    const r = row as OpenBadgeRow;
    if (!isLearnerVisibleBadgeStatus(r.status)) continue;
    const mapped = mapLearnerVisibleRow(r);
    byId.set(mapped.id, mapped);
  }

  // Badges sans org_id en colonne mais org dans evaluation_config
  const { data: orphanRows } = await supabase
    .from("open_badges")
    .select(selectCols)
    .is("org_id", null)
    .eq("visible_in_learner_dashboard", true)
    .order("updated_at", { ascending: false })
    .limit(24);

  for (const row of orphanRows ?? []) {
    const r = row as OpenBadgeRow;
    if (!uniqueOrgIds.includes(rowOrgId(r)) || !isLearnerVisibleBadgeStatus(r.status)) continue;
    const mapped = mapLearnerVisibleRow(r);
    byId.set(mapped.id, mapped);
  }

  return Array.from(byId.values());
}
