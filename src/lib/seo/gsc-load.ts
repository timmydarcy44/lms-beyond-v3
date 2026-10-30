import { getServiceRoleClient } from "@/lib/supabase/server";
import { gscIsConfigured } from "@/lib/seo/gsc-auth";
import { gscWindows, pageTotals, percentDelta, summarizeGsc, topQueries, type GscRow } from "@/lib/seo/gsc";

export type GscOverview = {
  configured: boolean;
  connected: boolean;
  impressions: number;
  clicks: number;
  position: number;
  impressionsDelta: number;
  clicksDelta: number;
  positionDelta: number;
};

async function loadRange(start: string, end: string, path?: string, queriesOnly = false) {
  const db = getServiceRoleClient();
  if (!db) return [] as GscRow[];
  let q = db
    .from("seo_gsc_daily")
    .select("day, page, query, impressions, clicks, ctr, position")
    .gte("day", start)
    .lte("day", end);
  if (path) q = q.eq("page", path);
  if (queriesOnly) q = q.neq("query", "");
  else q = q.eq("query", "");
  const { data, error } = await q.limit(20000);
  if (error) return [];
  return (data ?? []) as GscRow[];
}

export async function loadGscOverview(): Promise<GscOverview> {
  const configured = gscIsConfigured();
  const empty: GscOverview = {
    configured,
    connected: false,
    impressions: 0,
    clicks: 0,
    position: 0,
    impressionsDelta: 0,
    clicksDelta: 0,
    positionDelta: 0,
  };
  if (!configured) return empty;
  const windows = gscWindows();
  const [current, previous] = await Promise.all([
    loadRange(windows.current.start, windows.current.end),
    loadRange(windows.previous.start, windows.previous.end),
  ]);
  const now = summarizeGsc(current);
  const prev = summarizeGsc(previous);
  return {
    configured: true,
    connected: true,
    impressions: now.impressions,
    clicks: now.clicks,
    position: now.position,
    impressionsDelta: percentDelta(now.impressions, prev.impressions),
    clicksDelta: percentDelta(now.clicks, prev.clicks),
    positionDelta: Math.round((now.position - prev.position) * 10) / 10,
  };
}

export async function loadGscPageStats() {
  const windows = gscWindows();
  const rows = await loadRange(windows.current.start, windows.current.end);
  return pageTotals(rows);
}

export async function loadGscQueries(path: string) {
  const windows = gscWindows();
  const rows = await loadRange(windows.current.start, windows.current.end, path, true);
  return topQueries(rows, path, 5);
}

export async function loadAllGscQueries() {
  const windows = gscWindows();
  const rows = await loadRange(windows.current.start, windows.current.end, undefined, true);
  const map = new Map<string, ReturnType<typeof topQueries>>();
  for (const path of new Set(rows.map((row) => row.page))) {
    map.set(path, topQueries(rows, path, 5));
  }
  return map;
}
