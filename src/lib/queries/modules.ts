import { getServerClient } from "@/lib/supabase/server";

export type CourseModuleRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

export async function getCourseModules(courseId: string): Promise<CourseModuleRow[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  const id = String(courseId ?? "").trim();
  if (!id) return [];

  const { data, error } = await supabase
    .from("modules")
    .select("id, course_id, title, position")
    .eq("course_id", id)
    .order("position", { ascending: true });

  if (error) {
    console.error("[modules] getCourseModules failed:", error);
    return [];
  }

  return (data ?? []) as CourseModuleRow[];
}

