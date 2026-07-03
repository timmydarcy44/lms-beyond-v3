import type { SupabaseClient } from "@supabase/supabase-js";
import {
  catalogFallbackCourses,
  catalogModuleToCourseRow,
  enrichCoursePublic,
} from "@/lib/training-courses/catalog-fallback";
import type { TrainingCoursePublic, TrainingCourseRow } from "@/lib/training-courses/types";

const SELECT_COLS =
  "id,slug,title,short_description,long_description,domain,cover_url,duration,level,formats,objectives,skills,program,prerequisites,audience,intra_price,inter_price,max_intra_participants,badge_name,meta_description,seo_tags,faq,why_choose,trainer_id,trainer_name,trainer_headline,trainer_photo_url,is_active,created_at,updated_at";

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  return (error.message ?? "").toLowerCase().includes("training_courses");
}

export async function fetchPublicTrainingCourses(
  supabase: SupabaseClient | null,
): Promise<TrainingCoursePublic[]> {
  if (!supabase) {
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  const { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error || !data?.length) {
    if (error && !isMissingTableError(error)) {
      console.warn("[training_courses] public fetch:", error.message);
    }
    return catalogFallbackCourses().map(enrichCoursePublic);
  }

  return (data as TrainingCourseRow[]).map(enrichCoursePublic);
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

  const { data, error } = await supabase
    .from("training_courses")
    .select(SELECT_COLS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

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

  return enrichCoursePublic(data as TrainingCourseRow);
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
