const OPENBADGES_NS = "http://openbadges.org";

const ensureNamespace = (svg: string) => {
  if (svg.includes("xmlns:openbadges")) {
    return svg;
  }
  return svg.replace(
    /<svg([^>]*?)>/i,
    `<svg$1 xmlns:openbadges="${OPENBADGES_NS}">`,
  );
};

export const bakeSvg = (svg: string, verifyValue: string) => {
  const withNs = ensureNamespace(svg);
  if (withNs.includes("openbadges:assertion")) {
    return withNs.replace(
      /<openbadges:assertion[^>]*>/i,
      `<openbadges:assertion verify="${verifyValue}" />`,
    );
  }
  return withNs.replace(
    /<svg([^>]*?)>/i,
    `<svg$1>\n  <openbadges:assertion verify="${verifyValue}" />`,
  );
};

export const unbakeSvg = (svg: string) => {
  const match = svg.match(/<openbadges:assertion[^>]*verify="([^"]+)"[^>]*>/i);
  if (!match) return null;
  return match[1];
};
