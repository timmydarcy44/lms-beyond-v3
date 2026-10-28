export type GscRow = {
  day: string;
  page: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Fenêtres de 28 jours, avec 3 jours de latence GSC. */
export function gscWindows(now = new Date()) {
  const end = addUtcDays(now, -3);
  const currentStart = addUtcDays(end, -27);
  const previousEnd = addUtcDays(currentStart, -1);
  const previousStart = addUtcDays(previousEnd, -27);
  return {
    current: { start: isoDate(currentStart), end: isoDate(end) },
    previous: { start: isoDate(previousStart), end: isoDate(previousEnd) },
  };
}

export function pathFromGscPage(url: string) {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    return path || "/";
  } catch {
    if (url.startsWith("/")) return url.length > 1 && url.endsWith("/") ? url.slice(0, -1) : url;
    return "/";
  }
}

export function summarizeGsc(rows: Array<Pick<GscRow, "impressions" | "clicks" | "position">>) {
  let impressions = 0;
  let clicks = 0;
  let weighted = 0;
  for (const row of rows) {
    impressions += row.impressions;
    clicks += row.clicks;
    weighted += row.position * row.impressions;
  }
  return {
    impressions,
    clicks,
    position: impressions ? Math.round((weighted / impressions) * 10) / 10 : 0,
  };
}

export function percentDelta(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function topQueries(
  rows: GscRow[],
  path: string,
  limit = 5,
): Array<{ query: string; impressions: number; clicks: number; position: number }> {
  const map = new Map<string, { impressions: number; clicks: number; weighted: number }>();
  for (const row of rows) {
    if (row.page !== path || !row.query) continue;
    const current = map.get(row.query) ?? { impressions: 0, clicks: 0, weighted: 0 };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    current.weighted += row.position * row.impressions;
    map.set(row.query, current);
  }
  return [...map.entries()]
    .map(([query, value]) => ({
      query,
      impressions: value.impressions,
      clicks: value.clicks,
      position: value.impressions ? Math.round((value.weighted / value.impressions) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export function pageTotals(rows: GscRow[]) {
  const map = new Map<string, { impressions: number; clicks: number }>();
  for (const row of rows) {
    const current = map.get(row.page) ?? { impressions: 0, clicks: 0 };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    map.set(row.page, current);
  }
  return map;
}
