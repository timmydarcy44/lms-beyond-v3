import { getOrganizationNavBrandingForUser } from "./organization-nav";

/**
 * Récupère le logo de l'organisation de l'utilisateur actuel (priorité `logo_url` / galaxie courante).
 */
export async function getUserOrganizationLogo(): Promise<string | null> {
  const { logoUrl } = await getOrganizationNavBrandingForUser();
  return logoUrl;
}








