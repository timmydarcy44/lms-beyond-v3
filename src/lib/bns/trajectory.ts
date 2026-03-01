export type Trajectory = {
  items: string[];
  updatedAt: number;
};

const TRAJECTORY_KEY = "bns_trajectory_draft";

const isBrowser = () => typeof window !== "undefined";

export const getTrajectory = (): Trajectory => {
  if (!isBrowser()) return { items: [], updatedAt: Date.now() };
  try {
    const raw = window.localStorage.getItem(TRAJECTORY_KEY);
    if (!raw) return { items: [], updatedAt: Date.now() };
    const parsed = JSON.parse(raw) as Partial<Trajectory>;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((item): item is string => typeof item === "string")
      : [];
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();
    return { items, updatedAt };
  } catch {
    return { items: [], updatedAt: Date.now() };
  }
};

const saveTrajectory = (trajectory: Trajectory) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(TRAJECTORY_KEY, JSON.stringify(trajectory));
};

export const setTrajectory = (items: string[]) => {
  const next = { items, updatedAt: Date.now() };
  saveTrajectory(next);
  return next;
};

export const addProof = (slug: string) => {
  if (!slug) return getTrajectory();
  const current = getTrajectory();
  if (current.items.includes(slug)) return current;
  return setTrajectory([...current.items, slug]);
};

export const removeProof = (slug: string) => {
  const current = getTrajectory();
  return setTrajectory(current.items.filter((item) => item !== slug));
};

export const moveProof = (slug: string, direction: "up" | "down") => {
  const current = getTrajectory();
  const index = current.items.indexOf(slug);
  if (index === -1) return current;
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= current.items.length) return current;
  const items = [...current.items];
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  return setTrajectory(items);
};

export const clearTrajectory = () => setTrajectory([]);

