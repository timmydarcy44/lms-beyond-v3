import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { resolveAssessmentTemplate } from "@/lib/formation-assessments/resolve-template";

/** Aperçu questionnaire (staff) — sans tentative persistée. */
export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const url = new URL(req.url);
  const kind = String(url.searchParams.get("kind") || "positionnement").trim();
  const courseId = String(url.searchParams.get("courseId") || "").trim() || null;

  const template = await resolveAssessmentTemplate(service, {
    kind,
    trainingCourseId: courseId,
  });
  if (!template) {
    return NextResponse.json({ error: "Gabarit introuvable" }, { status: 404 });
  }

  let courseTitle: string | null = null;
  if (courseId) {
    const { data: course } = await service
      .from("training_courses")
      .select("title")
      .eq("id", courseId)
      .maybeSingle();
    courseTitle = course?.title ? String(course.title) : null;
  }

  return NextResponse.json({
    kind,
    title: template.title,
    course_title: courseTitle,
    questions: template.questions,
    source: template.source,
  });
}
