export type DashboardSpace = "expert" | "apprenant" | "formateur" | "ecole" | "salarie";

const STORAGE_KEY = "byound.dashboard.space";

export function setDashboardSpace(space: DashboardSpace) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, space);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getDashboardSpace(): DashboardSpace | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value === "expert" || value === "apprenant" || value === "formateur" || value === "ecole" || value === "salarie") {
      return value;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function jeuxReviewBasePath(pathname?: string | null): string {
  const p = String(pathname ?? "");
  if (p.startsWith("/dashboard/expert")) return "/dashboard/expert/jeux";
  if (p.startsWith("/dashboard/ecole")) return "/dashboard/ecole/jeux";
  if (p.startsWith("/dashboard/apprenant")) return "/dashboard/apprenant/jeux";
  const space = getDashboardSpace();
  if (space === "expert") return "/dashboard/expert/jeux";
  if (space === "ecole") return "/dashboard/ecole/jeux";
  return "/dashboard/apprenant/jeux";
}
