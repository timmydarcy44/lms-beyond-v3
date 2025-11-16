"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";

export type AddContentToPathResult = {
  success: boolean;
  count?: number;
  error?: string;
};

export async function addContentToPath(
  pathId: string,
  content: { courseIds: string[]; testIds: string[]; resourceIds: string[] }
): Promise<AddContentToPathResult> {
  const supabase = await getServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase client unavailable" };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier que le parcours existe et appartient au formateur
    const { data: path } = await supabase
      .from("paths")
      .select("id, owner_id, creator_id")
      .eq("id", pathId)
      .single();

    if (!path || (path.owner_id !== authData.user.id && path.creator_id !== authData.user.id)) {
      return { success: false, error: "Parcours non trouvé ou accès non autorisé" };
    }

    let totalAdded = 0;
    let maxOrder = 0;

    // Récupérer l'ordre maximum existant pour chaque type
    const [coursesData, testsData, resourcesData] = await Promise.all([
      supabase.from("path_courses").select("order").eq("path_id", pathId),
      supabase.from("path_tests").select("order").eq("path_id", pathId),
      supabase.from("path_resources").select("order").eq("path_id", pathId),
    ]);

    maxOrder = Math.max(
      ...(coursesData.data?.map((c) => c.order) ?? []),
      ...(testsData.data?.map((t) => t.order) ?? []),
      ...(resourcesData.data?.map((r) => r.order) ?? [])
    );

    // Ajouter les cours
    if (content.courseIds.length > 0) {
      const courseInserts = content.courseIds.map((courseId, index) => ({
        path_id: pathId,
        course_id: courseId,
        order: maxOrder + index + 1,
      }));

      const { error: courseError } = await supabase.from("path_courses").upsert(courseInserts, {
        onConflict: "path_id,course_id",
      });

      if (courseError) {
        console.error("[parcours] Error adding courses:", courseError);
      } else {
        totalAdded += courseInserts.length;
      }
    }

    // Ajouter les tests
    if (content.testIds.length > 0) {
      const testInserts = content.testIds.map((testId, index) => ({
        path_id: pathId,
        test_id: testId,
        order: maxOrder + totalAdded + index + 1,
      }));

      const { error: testError } = await supabase.from("path_tests").upsert(testInserts, {
        onConflict: "path_id,test_id",
      });

      if (testError) {
        console.error("[parcours] Error adding tests:", testError);
      } else {
        totalAdded += testInserts.length;
      }
    }

    // Ajouter les ressources
    if (content.resourceIds.length > 0) {
      const resourceInserts = content.resourceIds.map((resourceId, index) => ({
        path_id: pathId,
        resource_id: resourceId,
        order: maxOrder + totalAdded + index + 1,
      }));

      const { error: resourceError } = await supabase.from("path_resources").upsert(resourceInserts, {
        onConflict: "path_id,resource_id",
      });

      if (resourceError) {
        console.error("[parcours] Error adding resources:", resourceError);
      } else {
        totalAdded += resourceInserts.length;
      }
    }

    revalidatePath("/dashboard/formateur/parcours");
    revalidatePath(`/dashboard/formateur/parcours/${pathId}/edit`);

    return { success: true, count: totalAdded };
  } catch (error) {
    console.error("[parcours] Error in addContentToPath:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}



