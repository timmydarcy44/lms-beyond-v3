/** Organisation studio Jessica Contentin (LMS dédié). */
export const JESSICA_STUDIO_ORG_ID = "17d6def2-2422-4628-83ab-24b04746c19c";

export const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export const JESSICA_STUDIO_ORG_SLUG = "jessicacontentin";

export function isJessicaLmsHostname(hostname: string | null | undefined): boolean {
  const h = (hostname ?? "").split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  if (!h) return false;
  return (
    h === "app.jessicacontentin.fr" ||
    h === "app.jessica-contentin.fr" ||
    h.endsWith(".jessicacontentin.fr") && h.startsWith("app.")
  );
}

export function isJessicaMarketingHostname(hostname: string | null | undefined): boolean {
  const h = (hostname ?? "").split(":")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  if (!h) return false;
  return h === "jessicacontentin.fr" || h === "jessica-contentin.fr";
}

export function isJessicaStudioProfile(profile: {
  email?: string | null;
  school_id?: string | null;
  company_id?: string | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.email?.toLowerCase() === JESSICA_CONTENTIN_EMAIL) return true;
  const sid = profile.school_id?.trim();
  const cid = profile.company_id?.trim();
  return sid === JESSICA_STUDIO_ORG_ID || cid === JESSICA_STUDIO_ORG_ID;
}

export function resolveJessicaPostLoginDestination(email: string | null | undefined): string | null {
  if (email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) return null;
  return "/super/jessica-dashboard";
}
