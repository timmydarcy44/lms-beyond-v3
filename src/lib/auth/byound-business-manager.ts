/** Gérant de Byound Business : accès à tous les dashboards, hors démo Nutriset / PSG. */
export const BYOUND_BUSINESS_MANAGER_EMAIL = "timmydarcy44@gmail.com";

export function isByoundBusinessManager(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === BYOUND_BUSINESS_MANAGER_EMAIL;
}
