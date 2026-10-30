export const SEO_JSONLD_TYPES = [
  { id: "Organization", label: "Organisation" },
  { id: "EducationalOrganization", label: "École (EducationalOrganization)" },
  { id: "Course", label: "Formation" },
  { id: "JobPosting", label: "Offre d'emploi" },
  { id: "Article", label: "Article" },
  { id: "FAQPage", label: "FAQ" },
] as const;

export function suggestedJsonLdTypes(path: string): string[] {
  if (path === "/" || path === "/a-propos" || path === "/notre-mission" || path === "/contact") {
    return ["Organization", "EducationalOrganization"];
  }
  if (path.startsWith("/formations") || path.startsWith("/ecole") || path.startsWith("/alternance") || path.startsWith("/admissions")) {
    return ["EducationalOrganization", "Course"];
  }
  if (path.startsWith("/blog") || path.startsWith("/ressources") || path.startsWith("/guides")) {
    return ["Article"];
  }
  if (path.includes("recrut") || path.startsWith("/offres")) {
    return ["JobPosting"];
  }
  if (path.startsWith("/business")) return ["Organization"];
  return ["Organization"];
}
