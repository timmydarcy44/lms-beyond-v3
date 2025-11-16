import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServiceRoleClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { CourseBuilderWorkspaceSuperAdmin } from "@/components/super-admin/course-builder-workspace-super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SuperAdminModuleStructurePage({ params }: PageProps) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { id: courseId } = await params;

  if (!courseId) {
    notFound();
  }

  // Pour Super Admin, utiliser le service role client directement (bypass RLS)
  // Si pas disponible, fallback sur le client normal
  let supabase = getServiceRoleClient();
  
  if (!supabase) {
    console.warn("[super-admin/modules/structure] Service role client not available, using fallback");
    supabase = await getServiceRoleClientOrFallback();
  } else {
    console.log("[super-admin/modules/structure] Using service role client (bypass RLS)");
  }
  
  if (!supabase) {
    console.error("[super-admin/modules/structure] Supabase client unavailable");
    notFound();
  }

  console.log("[super-admin/modules/structure] Fetching course:", courseId);

  // Essayer d'abord avec la requête
  let { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, creator_id, owner_id, status, builder_snapshot")
    .eq("id", courseId)
    .maybeSingle();

  // Si erreur, essayer avec service role client si disponible
  if (courseError) {
    console.warn("[super-admin/modules/structure] First attempt failed, trying with service role client");
    const serviceRoleClient = getServiceRoleClient();
    if (serviceRoleClient) {
      console.log("[super-admin/modules/structure] Retrying with service role client");
      supabase = serviceRoleClient;
      const retry = await supabase
        .from("courses")
        .select("id, title, creator_id, owner_id, status, builder_snapshot")
        .eq("id", courseId)
        .maybeSingle();
      course = retry.data;
      courseError = retry.error;
      
      if (!courseError && course) {
        console.log("[super-admin/modules/structure] ✅ Course found with service role client");
      }
    }
  }

  if (courseError) {
    console.error("[super-admin/modules/structure] Error fetching course:", {
      error: courseError,
      code: courseError.code,
      message: courseError.message,
      details: courseError.details,
      hint: courseError.hint,
      courseId,
    });
    notFound();
  }

  if (!course) {
    console.error("[super-admin/modules/structure] Course not found:", courseId);
    notFound();
  }

  console.log("[super-admin/modules/structure] Course found:", {
    id: course.id,
    title: course.title,
    creator_id: course.creator_id,
    owner_id: course.owner_id,
  });

  // Vérifier que le module appartient à timdarcypro@gmail.com
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "timdarcypro@gmail.com")
    .eq("role", "super_admin")
    .single();

  if (creatorProfile && course.creator_id !== creatorProfile.id) {
    // Rediriger vers la liste si ce n'est pas le créateur
    redirect("/super/studio/modules");
  }

  // Récupérer le snapshot du builder
  const snapshot = await getCourseBuilderSnapshot(courseId);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Modifier la structure du module
        </h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Modifiez la structure de votre module : sections, chapitres et contenus pédagogiques.
        </p>
      </div>
      <CourseBuilderWorkspaceSuperAdmin 
        initialData={snapshot || undefined}
        previewHref={`/super/studio/modules/${courseId}/preview`}
        courseId={courseId}
        initialCourseId={courseId}
      />
    </>
  );
}

