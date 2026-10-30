import { gscAccessToken, gscProperty } from "@/lib/seo/gsc-auth";
import { pathFromGscPage, type GscRow } from "@/lib/seo/gsc";

type SearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

export async function querySearchConsole(opts: {
  startDate: string;
  endDate: string;
  dimensions: Array<"date" | "page" | "query">;
  startRow?: number;
  rowLimit?: number;
}): Promise<{ rows: GscRow[]; more: boolean }> {
  const token = await gscAccessToken();
  const site = encodeURIComponent(gscProperty());
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: opts.dimensions,
      rowLimit: opts.rowLimit ?? 25000,
      startRow: opts.startRow ?? 0,
      searchType: "web",
    }),
  });
  const json = (await res.json()) as { rows?: SearchRow[]; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message || `Search Console ${res.status}`);
  const raw = json.rows ?? [];
  const dim = opts.dimensions;
  const rows = raw.map((row) => {
    const keys = row.keys ?? [];
    const date = dim.includes("date") ? keys[dim.indexOf("date")] ?? opts.startDate : opts.startDate;
    const pageUrl = dim.includes("page") ? keys[dim.indexOf("page")] ?? "" : "";
    const query = dim.includes("query") ? keys[dim.indexOf("query")] ?? "" : "";
    return {
      day: date,
      page: pathFromGscPage(pageUrl),
      query,
      impressions: Math.round(row.impressions ?? 0),
      clicks: Math.round(row.clicks ?? 0),
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    } satisfies GscRow;
  });
  return { rows, more: raw.length >= (opts.rowLimit ?? 25000) };
}
