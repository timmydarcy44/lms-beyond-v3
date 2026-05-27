import { getServiceRoleClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/openbadges/urls";
import {
  createOpenBadgeClassRow,
  getOpenBadgeClassById,
  getOpenBadgeClassByIdOnly,
  listLearnerVisibleOpenBadges,
  listOpenBadgeClassesByOrg,
  updateOpenBadgeClassRow,
} from "@/lib/openbadges/open-badges-table-store";

export class OpenBadgesRpcUnavailableError extends Error {
  constructor(
    message = "Stockage Open Badges indisponible. Exécutez supabase/migrations/20260527130000_open_badges_admin_columns.sql",
  ) {
    super(message);
    this.name = "OpenBadgesRpcUnavailableError";
  }
}

function isRpcMissing(error: { code?: string; message?: string } | null): boolean {
  const msg = String(error?.message ?? "").toLowerCase();
  return (
    error?.code === "42883"
    || error?.code === "PGRST202"
    || msg.includes("does not exist")
    || msg.includes("could not find the function")
  );
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    throw new OpenBadgesRpcUnavailableError("SUPABASE_SERVICE_ROLE_KEY manquant.");
  }

  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    if (isRpcMissing(error)) {
      throw new OpenBadgesRpcUnavailableError(error.message);
    }
    throw new Error(error.message);
  }
  return data as T;
}

export type CreateBadgeClassRpcPayload = {
  orgId: string;
  createdByUserId: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  imageTemplateUrl?: string | null;
  criteriaUrl?: string | null;
  criteriaText?: string | null;
  criteriaMarkdown?: string | null;
  alignment?: unknown;
  tags?: string[];
  version?: number;
  status?: string;
  receivabilityReviewMode?: string;
  requiresEnrollment?: boolean;
  requiredCourseId?: string | null;
  visibleInLearnerDashboard?: boolean;
  level?: number | null;
  evaluationMethods?: string[];
  validatorExpertId?: string | null;
  failureRemediationCourseId?: string | null;
  criteria?: Array<{ label: string; description?: string | null; sortOrder?: number }>;
  receivability?: {
    expectedModalities: string;
    aiEvaluationPrompt: string;
    methodConfigs: unknown;
  } | null;
  autofillCriteriaUrl?: boolean;
  baseUrl?: string;
};

export async function createBadgeClassViaSupabase(
  payload: CreateBadgeClassRpcPayload,
): Promise<Record<string, unknown>> {
  try {
    return await createOpenBadgeClassRow({
      ...payload,
      baseUrl: payload.baseUrl ?? getBaseUrl(),
    });
  } catch (tableErr) {
    const msg = tableErr instanceof Error ? tableErr.message : String(tableErr);
    if (!/column|does not exist|org_id/i.test(msg)) {
      throw tableErr;
    }
    console.warn("[open-badges] table store failed, trying RPC:", msg);
  }

  const row = await rpc<Record<string, unknown>>("lms_admin_create_badge_class", {
    p_payload: {
      ...payload,
      baseUrl: payload.baseUrl ?? getBaseUrl(),
    },
  });
  return row;
}

export async function listBadgeClassesViaSupabase(orgId: string): Promise<Record<string, unknown>[]> {
  try {
    const rows = await listOpenBadgeClassesByOrg(orgId);
    if (rows.length > 0) return rows;
  } catch {
    // fallback RPC
  }

  const rows = await rpc<Record<string, unknown>[] | null>("lms_list_badge_classes", {
    p_org_id: orgId,
  });
  if (Array.isArray(rows)) return rows;
  return (rows as unknown as Record<string, unknown>[]) ?? [];
}

export async function getBadgeClassViaSupabase(
  id: string,
  orgId?: string | null,
): Promise<Record<string, unknown> | null> {
  try {
    if (orgId) {
      const row = await getOpenBadgeClassById(id, orgId);
      if (row) return row;
    }
    const byId = await getOpenBadgeClassByIdOnly(id);
    if (byId) return byId;
  } catch {
    // fallback RPC
  }

  if (!orgId) return null;

  const row = await rpc<Record<string, unknown> | null>("lms_get_badge_class", {
    p_id: id,
    p_org_id: orgId,
  });
  return row ?? null;
}

export type LearnerVisibleBadgeRow = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  level: number | null;
  requiresEnrollment: boolean;
  requiredCourseId: string | null;
};

export async function listLearnerVisibleBadgesViaSupabase(
  orgId: string | string[],
): Promise<LearnerVisibleBadgeRow[]> {
  const orgIds = Array.isArray(orgId) ? orgId : [orgId];
  try {
    const { listLearnerVisibleOpenBadgesForOrgs } = await import(
      "@/lib/openbadges/open-badges-table-store"
    );
    return await listLearnerVisibleOpenBadgesForOrgs(orgIds);
  } catch {
    const merged: LearnerVisibleBadgeRow[] = [];
    for (const id of orgIds) {
      const rows = await rpc<LearnerVisibleBadgeRow[] | null>("lms_list_learner_visible_badges", {
        p_org_id: id,
      });
      if (Array.isArray(rows)) merged.push(...rows);
    }
    const byId = new Map(merged.map((row) => [row.id, row]));
    return Array.from(byId.values());
  }
}

export async function updateBadgeClassViaSupabase(
  id: string,
  orgId: string,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    const row = await updateOpenBadgeClassRow(id, orgId, payload);
    if (row) return row;
  } catch (tableErr) {
    const msg = tableErr instanceof Error ? tableErr.message : String(tableErr);
    if (!/column|does not exist|org_id/i.test(msg)) {
      throw tableErr;
    }
  }

  const row = await rpc<Record<string, unknown> | null>("lms_admin_update_badge_class", {
    p_id: id,
    p_org_id: orgId,
    p_payload: payload,
  });
  return row ?? null;
}

export function canUseOpenBadgesSupabaseRepo(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
