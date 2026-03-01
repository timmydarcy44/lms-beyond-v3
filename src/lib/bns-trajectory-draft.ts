export type TrajectoryDraft = {
  items: string[];
  updatedAt: number;
};

const DRAFT_KEY = "bns_trajectory_draft";

const isBrowser = () => typeof window !== "undefined";

export const getDraft = (): TrajectoryDraft => {
  if (!isBrowser()) return { items: [], updatedAt: Date.now() };
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return { items: [], updatedAt: Date.now() };
    const parsed = JSON.parse(raw) as Partial<TrajectoryDraft>;
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((item): item is string => typeof item === "string")
      : [];
    const updatedAt = typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now();
    return { items, updatedAt };
  } catch {
    return { items: [], updatedAt: Date.now() };
  }
};

const saveDraft = (draft: TrajectoryDraft) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const addToDraft = (slug: string) => {
  if (!slug) return getDraft();
  const draft = getDraft();
  if (!draft.items.includes(slug)) {
    const next = { items: [...draft.items, slug], updatedAt: Date.now() };
    saveDraft(next);
    return next;
  }
  return draft;
};

export const removeFromDraft = (slug: string) => {
  const draft = getDraft();
  const next = { items: draft.items.filter((item) => item !== slug), updatedAt: Date.now() };
  saveDraft(next);
  return next;
};

export const clearDraft = () => {
  const next = { items: [], updatedAt: Date.now() };
  saveDraft(next);
  return next;
};

export const isInDraft = (slug: string) => {
  if (!slug) return false;
  return getDraft().items.includes(slug);
};



