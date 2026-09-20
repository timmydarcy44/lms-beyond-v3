/**
 * Marqueurs de perf EDGE — actifs en développement ou si
 * `localStorage.edgePerf = "1"`.
 */
export function edgePerfEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("edgePerf") === "1") return true;
  } catch {
    /* ignore */
  }
  return process.env.NODE_ENV === "development";
}

export function edgePerfMark(name: string, detail?: Record<string, unknown>) {
  if (typeof performance === "undefined") return;
  const mark = `edge:${name}`;
  try {
    performance.mark(mark);
  } catch {
    /* ignore */
  }
  if (edgePerfEnabled()) {
    const t = Math.round(performance.now());
    // eslint-disable-next-line no-console
    console.info(`[edge-perf] ${t}ms · ${name}`, detail ?? "");
  }
}

export function edgePerfMeasure(name: string, startMark: string, endMark?: string) {
  if (typeof performance === "undefined") return null;
  const start = `edge:${startMark}`;
  const end = endMark ? `edge:${endMark}` : undefined;
  try {
    if (end) performance.mark(end);
    const measureName = `edge-measure:${name}`;
    performance.measure(measureName, start, end);
    const entries = performance.getEntriesByName(measureName);
    const last = entries[entries.length - 1];
    const duration = last ? Math.round(last.duration) : null;
    if (edgePerfEnabled() && duration != null) {
      // eslint-disable-next-line no-console
      console.info(`[edge-perf] measure ${name}: ${duration}ms`);
    }
    return duration;
  } catch {
    return null;
  }
}
