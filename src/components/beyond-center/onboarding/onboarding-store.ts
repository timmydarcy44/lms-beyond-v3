"use client";

export type OnboardingPlan = "essentiel" | "avance" | "sur-mesure";
export type DiagnosticGoal = "harmonie" | "communication" | "performance";

export type WorkspaceDraft = {
  companyName: string;
  managerName: string;
  companyLogoUrl?: string;
  collaboratorCount: number;
  plan: OnboardingPlan;
  goal?: DiagnosticGoal;
  invitedEmails: string[];
};

const KEY = "bc:onboarding";

export function getOnboardingDraft(): WorkspaceDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkspaceDraft) : null;
  } catch {
    return null;
  }
}

export function setOnboardingDraft(next: WorkspaceDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function parseEmails(input: string): string[] {
  const normalized = input
    .replace(/[\n\r]+/g, ",")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const uniq = new Set<string>();
  for (const e of normalized) uniq.add(e.toLowerCase());
  return Array.from(uniq).filter((e) => /\S+@\S+\.\S+/.test(e));
}

