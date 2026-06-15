import type { BeyondIndexAnswers, BeyondIndexContact, BeyondIndexResult } from "./types";
import { computeBeyondIndexResult } from "./scoring";

const STORAGE_KEY = "beyond-index-v1";

type StoredState = {
  answers: BeyondIndexAnswers;
  contact?: BeyondIndexContact;
  result?: BeyondIndexResult;
};

export function loadBeyondIndexState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredState;
  } catch {
    return null;
  }
}

export function saveBeyondIndexAnswers(answers: BeyondIndexAnswers): void {
  if (typeof window === "undefined") return;
  const existing = loadBeyondIndexState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, answers }));
}

export function saveBeyondIndexResult(result: BeyondIndexResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ answers: result.answers, contact: result.contact, result })
  );
}

export function clearBeyondIndexState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function finalizeBeyondIndex(
  answers: BeyondIndexAnswers,
  contact: BeyondIndexContact
): BeyondIndexResult {
  const result = computeBeyondIndexResult(answers, contact);
  saveBeyondIndexResult(result);
  return result;
}

/** Stub for future CRM / API integration. */
export async function submitBeyondIndexToApi(result: BeyondIndexResult): Promise<{ ok: boolean }> {
  // TODO: POST /api/beyond-index when backend is ready
  console.info("[beyond-index] API submission stub", {
    email: result.contact.email,
    score: result.globalScore,
    profile: result.globalProfile.id,
  });
  return { ok: false };
}
