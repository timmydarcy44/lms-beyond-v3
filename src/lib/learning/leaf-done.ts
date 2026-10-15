const keyFor = (courseId: string) => `byound-leaf-done:${courseId}`;

export function readLeafDone(courseId: string): string[] {
  if (!courseId || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(courseId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function markLeafDone(courseId: string, leafId: string): string[] {
  const current = new Set(readLeafDone(courseId));
  if (leafId) current.add(leafId);
  const next = [...current];
  try {
    window.localStorage.setItem(keyFor(courseId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
