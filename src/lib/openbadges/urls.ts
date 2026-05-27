export const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3001"
  );
};

/**
 * Base URL utilisée pour les liens partagés (LinkedIn, critères publics).
 * En local, définir NEXT_PUBLIC_LINKEDIN_SHARE_BASE_URL=https://edgebs.fr pour que
 * LinkedIn puisse charger l’aperçu (og:image) — localhost n’est pas accessible.
 */
export const getPublicShareBaseUrl = () => {
  const share = process.env.NEXT_PUBLIC_LINKEDIN_SHARE_BASE_URL?.trim();
  if (share) return share.replace(/\/$/, "");
  return getBaseUrl().replace(/\/$/, "");
};

export const getBadgeCriteriaUrl = (badgeClassId: string) => {
  return `${getPublicShareBaseUrl()}/badgeclasses/${badgeClassId}/criteria`;
};
