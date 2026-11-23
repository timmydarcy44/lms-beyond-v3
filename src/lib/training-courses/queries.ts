import type { SupabaseClient } from "@supabase/supabase-js";
import {
  catalogFallbackCourses,
  catalogModuleToCourseRow,
  enrichCoursePublic,
} from "@/lib/training-courses/catalog-fallback";
import type { TrainingCoursePublic, TrainingCourseRow } from "@/lib/training-courses/types";

const SELECT_COLS_LEGACY =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,program_structure,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,badge_class_id,meta_description,seo_tags,faq,why_choose,instructors,page_blocks,sessions,benefits,case_studies,deliverables,methodology,illustrations,trainer_id,trainer_name,trainer_headline,trainer_photo_url,is_active,created_at,updated_at";
const SELECT_COLS_QUALIOPI = `${SELECT_COLS_LEGACY},recognition_type,recognition_detail,pedagogical_modality,pedagogical_modality_detail,financing_modalities,price_on_quote,results_method_override,contact_referent,quality_indicators`;
const SELECT_COLS = `${SELECT_COLS_QUALIOPI},catalog_surfaces`;

/** Du plus complet au plus ancien : repli si des colonnes ne sont pas encore migrées. */
const SELECT_TIERS = [SELECT_COLS, SELECT_COLS_QUALIOPI, SELECT_COLS_LEGACY];

export type CatalogSurface = "entreprise" | "particulier" | "reconversion";

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return (error.message ?? "").toLowerCase().includes("training_courses");
}

function isMissingQualiopiFicheCols(error: { message?: string } | null): boolean {
  if (!error?.message) return false;
  return /recognition_type|pedagogical_modality|financing_modalities|price_on_quote|results_method_override|contact_referent|quality_indicators|catalog_surfaces/i.test(
    error.message,
  );
}

/** Une fiche sans catalog_surfaces (colonne absente / null) reste visible partout. */
function isOnSurface(row: TrainingCourseRow, surface?: CatalogSurface): boolean {
  if (!surface) return true;
  const surfaces = row.catalog_surfaces;
  if (!Array.isArray(surfaces) || surfaces.length === 0) return true;
  return surfaces.includes(surface);
}

export async function fetchPublicTrainingCourses(
  supabase: SupabaseClient | null,
  surface?: CatalogSurface,
): Promise<TrainingCoursePublic[]> {
  if (!supabase) {
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  let data: unknown[] | null = null;
  let error: { code?: string; message?: string } | null = null;
  let selectCols = SELECT_COLS;

  for (const cols of SELECT_TIERS) {
    selectCols = cols;
    const res = await supabase
      .from("training_courses")
      .select(cols)
      .eq("is_active", true)
      .is("organization_id", null)
      .order("title", { ascending: true });
    data = res.data as unknown[] | null;
    error = res.error;
    if (!(error && isMissingQualiopiFicheCols(error))) break;
  }

  // Colonnes Sur-mesure absentes (migration non appliquée) → fallback sans filtre org.
  if (error && /organization_id/i.test(error.message ?? "")) {
    const res = await supabase
      .from("training_courses")
      .select(selectCols)
      .eq("is_active", true)
      .order("title", { ascending: true });
    data = res.data as unknown[] | null;
    error = res.error;
  }

  if (error || !data?.length) {
    if (error && !isMissingTableError(error)) {
      console.warn("[training_courses] public fetch:", error.message);
    }
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  return (data as TrainingCourseRow[])
    .filter((row) => !row.organization_id && (row.source == null || row.source === "catalogue"))
    .filter((row) => isOnSurface(row, surface))
    .map(enrichCoursePublic);
}

export async function fetchTrainingCourseBySlug(
  supabase: SupabaseClient | null,
  slug: string,
): Promise<TrainingCoursePublic | null> {
  if (!supabase) {
    try {
      return enrichCoursePublic(catalogModuleToCourseRow(slug));
    } catch {
      return null;
    }
  }

  // Détail par slug : on accepte aussi les fiches inactives (aperçu CMS avant publication).
  // Le catalogue public filtre toujours is_active = true. Sur-mesure client exclus.
  let data: unknown = null;
  let error: { code?: string; message?: string } | null = null;
  for (const cols of SELECT_TIERS) {
    const res = await supabase.from("training_courses").select(cols).eq("slug", slug).maybeSingle();
    data = res.data;
    error = res.error;
    if (!(error && isMissingQualiopiFicheCols(error))) break;
  }

  if (error || !data) {
    if (error && !isMissingTableError(error)) {
      console.warn("[training_courses] slug fetch:", error.message);
    }
    try {
      return enrichCoursePublic(catalogModuleToCourseRow(slug));
    } catch {
      return null;
    }
  }

  const row = data as TrainingCourseRow;
  if (row.organization_id || row.source === "surmesure") {
    return null;
  }

  return enrichCoursePublic(row);
}

export async function fetchAllTrainingCoursesAdmin(
  supabase: SupabaseClient,
): Promise<TrainingCourseRow[]> {
  let data: unknown[] | null = null;
  let error: { message?: string } | null = null;
  for (const cols of SELECT_TIERS) {
    const res = await supabase
      .from("training_courses")
      .select(cols)
      .order("updated_at", { ascending: false });
    data = res.data as unknown[] | null;
    error = res.error;
    if (!(error && isMissingQualiopiFicheCols(error))) break;
  }

  if (error) throw error;
  return (data ?? []) as TrainingCourseRow[];
}
