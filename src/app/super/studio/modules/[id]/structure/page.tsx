import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SuperAdminModuleStructurePage({ params }: PageProps) {
  // Vérifier l'authentification
  const sessionClient = await getServerClient();
  if (!sessionClient) {
    redirect("/login");
  }

  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.id) {
    redirect("/login");
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

  // Si pas trouvé, essayer de trouver via catalog_items (l'ID pourrait être celui du catalog_item)
  if (courseError || !course) {
    console.log("[super-admin/modules/structure] Course not found directly, trying via catalog_items");
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("content_id")
      .eq("id", courseId)
      .eq("item_type", "module")
      .maybeSingle();

    if (catalogItem?.content_id) {
      console.log("[super-admin/modules/structure] Found catalog_item, fetching course with content_id:", catalogItem.content_id);
      const { data: courseFromCatalog, error: courseFromCatalogError } = await supabase
        .from("courses")
        .select("id, title, creator_id, owner_id, status, builder_snapshot")
        .eq("id", catalogItem.content_id)
        .maybeSingle();

      if (!courseFromCatalogError && courseFromCatalog) {
        course = courseFromCatalog;
        courseError = null;
        console.log("[super-admin/modules/structure] ✅ Course found via catalog_item");
      } else {
        courseError = courseFromCatalogError;
      }
    }
  }

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

  // Vérifier l'accès : super admin OU créateur du contenu
  const isSuper = await isSuperAdmin();
  const isCreator = course.creator_id === user.id;

  if (!isSuper && !isCreator) {
    redirect("/dashboard");
  }

  // Récupérer le snapshot du builder
  const snapshot = await getCourseBuilderSnapshot(courseId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Modifier la structure du module
          </h1>
          <p className="text-gray-400 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Modifiez la structure de votre module : sections, chapitres et contenus pédagogiques.
          </p>
        </div>
        <CourseBuilderWorkspace 
          initialData={snapshot || undefined}
          previewHref={`/super/studio/modules/${courseId}/preview`}
          courseId={courseId}
        />
      </div>
    </div>
  );
}

