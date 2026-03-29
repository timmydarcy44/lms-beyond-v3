export const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3001"
  );
};

export const getBadgeCriteriaUrl = (badgeClassId: string) => {
  const baseUrl = getBaseUrl().replace(/\/$/, "");
  return `${baseUrl}/badgeclasses/${badgeClassId}/criteria`;
};
