import { getServiceRoleClient } from "@/lib/supabase/server";
import { addUtcDays, gscWindows, isoDate, type GscRow } from "@/lib/seo/gsc";
import { querySearchConsole } from "@/lib/seo/gsc-api";

const MAX_MONTHS = 16;

function monthWindows(end: Date, months: number, sizeDays = 28) {
  const windows: Array<{ start: string; end: string }> = [];
  let cursorEnd = end;
  const oldest = addUtcDays(end, -(months * 30));
  while (cursorEnd >= oldest && windows.length < Math.ceil((months * 30) / sizeDays)) {
    const start = addUtcDays(cursorEnd, -(sizeDays - 1));
    windows.push({ start: isoDate(start < oldest ? oldest : start), end: isoDate(cursorEnd) });
    cursorEnd = addUtcDays(start, -1);
  }
  return windows;
}

async function upsertRows(rows: GscRow[]) {
  const db = getServiceRoleClient();
  if (!db || !rows.length) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const { error } = await db.from("seo_gsc_daily").upsert(chunk, { onConflict: "day,page,query" });
    if (error) throw new Error(error.message);
    written += chunk.length;
  }
  return written;
}

async function pullRange(startDate: string, endDate: string, dimensions: Array<"date" | "page" | "query">, maxPages = 4) {
  const all: GscRow[] = [];
  for (let page = 0; page < maxPages; page += 1) {
    const { rows, more } = await querySearchConsole({
      startDate,
      endDate,
      dimensions,
      startRow: page * 25000,
    });
    all.push(...rows);
    if (!more) break;
  }
  return all;
}

export async function syncSearchConsole(opts?: { full?: boolean }) {
  const windows = gscWindows();
  const end = new Date(`${windows.current.end}T00:00:00Z`);
  const recent = monthWindows(end, 2, 28);
  const older = opts?.full ? monthWindows(addUtcDays(end, -56), MAX_MONTHS, 28).slice(0, 6) : [];
  let rows = 0;

  for (const window of recent) {
    const queryRows = await pullRange(window.start, window.end, ["date", "page", "query"], 3);
    rows += await upsertRows(queryRows);
    const pageRows = await pullRange(window.start, window.end, ["date", "page"], 2);
    rows += await upsertRows(pageRows.map((row) => ({ ...row, query: "" })));
  }
  for (const window of older) {
    const pageRows = await pullRange(window.start, window.end, ["date", "page"], 2);
    rows += await upsertRows(pageRows.map((row) => ({ ...row, query: "" })));
  }
  return { rows, from: recent.at(-1)?.start ?? windows.current.start, to: windows.current.end };
}
