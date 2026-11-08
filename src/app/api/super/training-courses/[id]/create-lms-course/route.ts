import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { ficheColumnsFromSnapshot, writeCourseRow } from "@/lib/courses/fiche-columns";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { normalizeProgramStructure } from "@/lib/training-courses/cms-types";
import { trainingCourseToLmsSnapshot } from "@/lib/training-courses/to-lms-snapshot";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const userClient = await getServerClient();
  const { data: auth } = userClient
    ? await userClient.auth.getUser()
    : { data: { user: null } };
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const force = req.nextUrl.searchParams.get("force") === "1";

  const { data: course, error: loadError } = await service
    .from("training_courses")
    .select(
      "id,title,short_description,long_description,domain,cover_url,duration,level,objectives,skills,prerequisites,audience,badge_name,program_structure,program,inter_price,intra_price,lms_course_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    // Colonne lms_course_id absente tant que la migration n'est pas appliquée
    if (/lms_course_id/i.test(loadError.message)) {
      const { data: fallback, error: fallbackError } = await service
        .from("training_courses")
        .select(
          "id,title,short_description,long_description,domain,cover_url,duration,level,objectives,skills,prerequisites,audience,badge_name,program_structure,program,inter_price,intra_price",
        )
        .eq("id", id)
        .maybeSingle();
      if (fallbackError || !fallback) {
        return NextResponse.json(
          { error: fallbackError?.message || "Fiche introuvable" },
          { status: fallbackError ? 500 : 404 },
        );
      }
      return createFromRow(service, userId, fallback as Record<string, unknown>, null, true);
    }
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }

  const linkedId =
    typeof course.lms_course_id === "string" && course.lms_course_id
      ? course.lms_course_id
      : null;

  if (linkedId && !force) {
    const { data: existing } = await service
      .from("courses")
      .select("id")
      .eq("id", linkedId)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({
        ok: true,
        courseId: existing.id,
        alreadyLinked: true,
        studioUrl: `/super/studio/formations/${existing.id}/structure`,
      });
    }
  }

  return createFromRow(
    service,
    userId,
    course as Record<string, unknown>,
    linkedId,
    false,
  );
}

async function createFromRow(
  service: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  userId: string,
  course: Record<string, unknown>,
  previousLinkedId: string | null,
  skipLinkColumn: boolean,
) {
  const structure = normalizeProgramStructure(
    course.program_structure,
    course.program as { title: string; duration?: string }[] | null | undefined,
  );
  if (!structure.length) {
    return NextResponse.json(
      { error: "Programme vide — ajoutez des sections avant de créer la formation LMS." },
      { status: 400 },
    );
  }

  const snapshot = trainingCourseToLmsSnapshot({
    title: String(course.title ?? ""),
    short_description: (course.short_description as string | null) ?? null,
    long_description: (course.long_description as string | null) ?? null,
    domain: (course.domain as string | null) ?? null,
    cover_url: (course.cover_url as string | null) ?? null,
    duration: (course.duration as string | null) ?? null,
    level: (course.level as string | null) ?? null,
    objectives: (course.objectives as string[] | null) ?? null,
    skills: (course.skills as string[] | null) ?? null,
    prerequisites: (course.prerequisites as string | null) ?? null,
    audience: (course.audience as string[] | null) ?? null,
    badge_name: (course.badge_name as string | null) ?? null,
    program_structure: structure,
    inter_price: (course.inter_price as number | null) ?? null,
    intra_price: (course.intra_price as number | null) ?? null,
  });

  const slugBase = snapshot.general.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${slugBase || "course"}-${Date.now()}`;

  const courseData: Record<string, unknown> = {
    title: snapshot.general.title,
    description: snapshot.general.subtitle || null,
    status: "draft",
    builder_snapshot: snapshot,
    cover_image: snapshot.general.cover_image || snapshot.general.heroImage || null,
    image_url: snapshot.general.cover_image || null,
    slug,
    creator_id: userId,
    owner_id: userId,
    price: snapshot.general.price || 0,
    category: snapshot.general.category || null,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...ficheColumnsFromSnapshot(snapshot),
  };

  const { data: created, error: createError } = await writeCourseRow(service, null, courseData);
  if (createError || !created?.id) {
    return NextResponse.json(
      { error: createError?.message || "Création LMS impossible" },
      { status: 500 },
    );
  }

  const courseId = String(created.id);
  const trainingId = String(course.id);

  if (!skipLinkColumn) {
    const { error: linkError } = await service
      .from("training_courses")
      .update({
        lms_course_id: courseId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", trainingId);

    if (linkError && !/lms_course_id/i.test(linkError.message)) {
      console.warn("[create-lms-course] link update failed", linkError.message);
    }
  }

  return NextResponse.json({
    ok: true,
    courseId,
    alreadyLinked: false,
    replacedPrevious: Boolean(previousLinkedId),
    studioUrl: `/super/studio/formations/${courseId}/structure`,
  });
}
