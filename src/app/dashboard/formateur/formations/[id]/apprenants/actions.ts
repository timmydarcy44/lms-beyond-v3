"use server";

import { getServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AssignLearnersResult = {
  success: boolean;
  count?: number;
  error?: string;
  enrolledLearnerIds?: string[];
};

export async function assignLearnersToCourse(
  courseId: string,
  learnerIds: string[],
  groupIds: string[],
): Promise<AssignLearnersResult> {
  const supabase = await getServerClient();

  if (!supabase) {
    return { success: false, error: "Supabase client unavailable" };
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier que le cours existe et appartient au formateur
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, owner_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return { success: false, error: "Formation introuvable" };
    }

    // Récupérer les membres des groupes sélectionnés
    const allLearnerIds = new Set<string>(learnerIds);

    if (groupIds.length > 0) {
      const { data: groupMembers, error: groupError } = await supabase
        .from("group_members")
        .select("user_id")
        .in("group_id", groupIds);

      if (!groupError && groupMembers) {
        groupMembers.forEach((member) => {
          allLearnerIds.add(member.user_id);
        });
      }
    }

    if (allLearnerIds.size === 0) {
      return { success: false, error: "Aucun apprenant à assigner" };
    }

    const enrollments = Array.from(allLearnerIds).map((userId) => ({
      course_id: courseId,
      learner_id: userId,
      user_id: userId,
      role: "student" as const,
    }));

    let enrollError: any = null;
    let result = await supabase.from("enrollments").upsert(enrollments, {
      onConflict: "learner_id,course_id",
    });

    enrollError = result.error;
    if (enrollError && (enrollError.code === "42704" || enrollError.message?.includes("conflict") || enrollError.message?.includes("constraint"))) {
      result = await supabase.from("enrollments").upsert(enrollments, {
        onConflict: "user_id,course_id",
      });
      enrollError = result.error;
    }

    if (enrollError) {
      return { success: false, error: `Erreur lors de l'assignation: ${enrollError.message || "Erreur inconnue"}` };
    }

    revalidatePath(`/dashboard/formateur/formations/${courseId}/apprenants`);
    return { success: true, count: allLearnerIds.size, enrolledLearnerIds: Array.from(allLearnerIds) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

export async function removeLearnerFromCourse(courseId: string, learnerId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await getServerClient();
  if (!supabase) return { success: false, error: "Supabase client unavailable" };

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return { success: false, error: "Non authentifié" };

    // Essayer `enrollments` avec learner_id puis user_id
    let res = await supabase.from("enrollments").delete().eq("course_id", courseId).eq("learner_id", learnerId);
    if (res.error) {
      res = await supabase.from("enrollments").delete().eq("course_id", courseId).eq("user_id", learnerId);
    }

    if (res.error) return { success: false, error: res.error.message };

    revalidatePath(`/dashboard/formateur/formations/${courseId}/apprenants`);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Erreur inconnue" };
  }
}

