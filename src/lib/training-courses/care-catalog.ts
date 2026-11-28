/** Formations du catalogue Care (surfaces, slug ou intitulé). */
export function isCareCatalogCourse(course: {
  catalog_surfaces?: string[] | null;
  slug?: string | null;
  domain?: string | null;
  title?: string | null;
}) {
  const surfaces = course.catalog_surfaces;
  if (Array.isArray(surfaces) && surfaces.includes("care")) return true;
  const blob = `${course.slug ?? ""} ${course.domain ?? ""} ${course.title ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /care|neuroeduc|neuro-educ|sante mentale|tdah|haut potentiel|bien-etre|bien etre/.test(blob);
}
