import { describe, expect, it } from "vitest";
import { gscWindows, pageTotals, pathFromGscPage, percentDelta, summarizeGsc, topQueries } from "../gsc";

describe("pathFromGscPage", () => {
  it("keeps the pathname of www.byound.fr", () => {
    expect(pathFromGscPage("https://www.byound.fr/")).toBe("/");
    expect(pathFromGscPage("https://www.byound.fr/business")).toBe("/business");
    expect(pathFromGscPage("https://www.byound.fr/admissions/")).toBe("/admissions");
  });
});

describe("gscWindows", () => {
  it("uses 28-day windows ending 3 days ago", () => {
    const windows = gscWindows(new Date("2026-10-28T12:00:00Z"));
    expect(windows.current.end).toBe("2026-10-25");
    expect(windows.current.start).toBe("2026-09-28");
    expect(windows.previous.end).toBe("2026-09-27");
    expect(windows.previous.start).toBe("2026-08-31");
  });
});

describe("aggregations", () => {
  const rows = [
    { day: "2026-10-01", page: "/", query: "byound", impressions: 100, clicks: 10, ctr: 0.1, position: 4 },
    { day: "2026-10-02", page: "/", query: "byound", impressions: 50, clicks: 5, ctr: 0.1, position: 6 },
    { day: "2026-10-01", page: "/", query: "école caen", impressions: 20, clicks: 1, ctr: 0.05, position: 12 },
    { day: "2026-10-01", page: "/business", query: "byound", impressions: 10, clicks: 2, ctr: 0.2, position: 8 },
  ];

  it("summarizes with impression-weighted position", () => {
    expect(summarizeGsc(rows.filter((row) => row.page === "/"))).toEqual({
      impressions: 170,
      clicks: 16,
      position: 5.5,
    });
  });

  it("lists top queries for a page", () => {
    expect(topQueries(rows, "/", 5)[0]).toMatchObject({ query: "byound", impressions: 150, clicks: 15 });
  });

  it("totals per page", () => {
    expect(pageTotals(rows).get("/")?.impressions).toBe(170);
  });

  it("computes percent deltas", () => {
    expect(percentDelta(112, 100)).toBe(12);
    expect(percentDelta(10, 0)).toBe(100);
  });
});
