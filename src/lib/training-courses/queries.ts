import type { SupabaseClient } from "@supabase/supabase-js";
import {
  catalogFallbackCourses,
  catalogModuleToCourseRow,
  enrichCoursePublic,
} from "@/lib/training-courses/catalog-fallback";
import type { TrainingCoursePublic, TrainingCourseRow } from "@/lib/training-courses/types";

const SELECT_COLS_LEGACY =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,program_structure,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,badge_class_id,meta_description,seo_tags,faq,why_choose,instructors,page_blocks,sessions,benefits,case_studies,deliverables,methodology,illustrations,trainer_id,trainer_name,trainer_headline,trainer_photo_url,is_active,created_at,updated_at";
const SELECT_COLS = `${SELECT_COLS_LEGACY},recognition_type,recognition_detail,pedagogical_modality,pedagogical_modality_detail,financing_modalities,price_on_quote,results_method_override,contact_referent,quality_indicators`;

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return (error.message ?? "").toLowerCase().includes("training_courses");
}

function isMissingQualiopiFicheCols(error: { message?: string } | null): boolean {
  if (!error?.message) return false;
  return /recognition_type|pedagogical_modality|financing_modalities|price_on_quote|results_method_override|contact_referent|quality_indicators/i.test(
    error.message,
  );
}

export async function fetchPublicTrainingCourses(
  supabase: SupabaseClient | null,
): Promise<TrainingCoursePublic[]> {
  if (!supabase) {
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  let selectCols = SELECT_COLS;
  let { data, error } = await supabase
    .from("training_courses")
    .select(selectCols)
    .eq("is_active", true)
    .is("organization_id", null)
    .order("title", { ascending: true });

  if (error && isMissingQualiopiFicheCols(error)) {
    selectCols = SELECT_COLS_LEGACY;
    ({ data, error } = await supabase
      .from("training_courses")
      .select(selectCols)
      .eq("is_active", true)
      .is("organization_id", null)
      .order("title", { ascending: true }));
  }

  // Colonnes Sur-mesure absentes (migration non appliquée) → fallback sans filtre org.
  if (error && /organization_id/i.test(error.message)) {
    ({ data, error } = await supabase
      .from("training_courses")
      .select(selectCols)
      .eq("is_active", true)
      .order("title", { ascending: true }));
  }

  if (error || !data?.length) {
    if (error && !isMissingTableError(error)) {
      console.warn("[training_courses] public fetch:", error.message);
    }
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  return (data as TrainingCourseRow[])
    .filter((row) => !row.organization_id && (row.source == null || row.source === "catalogue"))
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
  let { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .eq("slug", slug)
    .maybeSingle();

  if (error && isMissingQualiopiFicheCols(error)) {
    ({ data, error } = await supabase
      .from("training_courses")
      .select(SELECT_COLS_LEGACY)
      .eq("slug", slug)
      .maybeSingle());
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
  const { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TrainingCourseRow[];
}
