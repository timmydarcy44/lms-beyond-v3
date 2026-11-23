import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NEED_ANALYSIS_SELECT,
  NEED_ANALYSIS_SELECT_LEGACY,
  mapNeedAnalysisRow,
  type OrganizationNeedAnalysis,
} from "@/lib/control/need-analyses";

export async function selectNeedAnalyses(
  query: {
    select: (cols: string) => unknown;
  },
): Promise<{ rows: OrganizationNeedAnalysis[]; usedLegacy: boolean; error: string | null }> {
  // typed loosely — callers pass supabase query builders
  const q = query as {
    select: (c: string) => { then?: unknown } & PromiseLike<{ data: unknown; error: { message: string } | null }>;
  };
  void q;
  return { rows: [], usedLegacy: false, error: "use fetchNeedAnalysisRows" };
}

export async function fetchNeedAnalysisRows(
  service: SupabaseClient,
  filter: {
    eq?: Array<[string, string]>;
    or?: string;
    order?: { column: string; ascending?: boolean };
    single?: boolean;
  },
): Promise<{
  data: Record<string, unknown>[] | Record<string, unknown> | null;
  error: { message: string } | null;
  usedLegacy: boolean;
}> {
  const run = async (cols: string) => {
    let q = service.from("organization_need_analyses").select(cols);
    for (const [k, v] of filter.eq ?? []) q = q.eq(k, v);
    if (filter.or) q = q.or(filter.or);
    if (filter.order) {
      q = q.order(filter.order.column, { ascending: filter.order.ascending ?? false });
    }
    if (filter.single) return q.maybeSingle();
    return q;
  };

  const first = await run(NEED_ANALYSIS_SELECT);
  if (!first.error) {
    return {
      data: (first.data as never) ?? null,
      error: null,
      usedLegacy: false,
    };
  }
  if (/request_type|exchange_date|validated_by|accessibility_asked|column/i.test(first.error.message)) {
    const second = await run(NEED_ANALYSIS_SELECT_LEGACY);
    return {
      data: (second.data as never) ?? null,
      error: second.error,
      usedLegacy: true,
    };
  }
  return { data: null, error: first.error, usedLegacy: false };
}

export function mapRows(data: unknown): OrganizationNeedAnalysis[] {
  if (!Array.isArray(data)) {
    if (data && typeof data === "object") {
      return [mapNeedAnalysisRow(data as Record<string, unknown>)];
    }
    return [];
  }
  return data.map((row) => mapNeedAnalysisRow(row as Record<string, unknown>));
}
