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

    // Créer les enrollments
    // La table enrollments peut avoir learner_id OU user_id selon la migration
    const enrollments = Array.from(allLearnerIds).map((userId) => ({
      course_id: courseId,
      learner_id: userId, // Utiliser learner_id en priorité
      user_id: userId, // Fallback pour user_id si learner_id n'existe pas
      role: "student" as const,
    }));

    // Essayer d'abord avec learner_id, puis fallback sur user_id
    let enrollError = null;
    let result = await supabase.from("enrollments").upsert(enrollments, {
      onConflict: "learner_id,course_id",
    });
    
    enrollError = result.error;
    
    // Si erreur de contrainte avec learner_id, essayer avec user_id
    if (enrollError && (enrollError.code === '42704' || enrollError.message?.includes('conflict') || enrollError.message?.includes('constraint'))) {
      console.warn("[formateur] Constraint mismatch with learner_id, trying user_id");
      result = await supabase.from("enrollments").upsert(enrollments, {
        onConflict: "user_id,course_id",
      });
      enrollError = result.error;
    }

    if (enrollError) {
      console.error("[formateur] Error creating enrollments", enrollError);
      return { success: false, error: "Erreur lors de l'assignation" };
    }

    revalidatePath(`/dashboard/formateur/formations/${courseId}/apprenants`);
    revalidatePath("/dashboard/formateur/formations");

    return {
      success: true,
      count: allLearnerIds.size,
      enrolledLearnerIds: Array.from(allLearnerIds),
    };
  } catch (error) {
    console.error("[formateur] Error in assignLearnersToCourse", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

export type RemoveLearnerResult = {
  success: boolean;
  error?: string;
};

export async function removeLearnerFromCourse(courseId: string, learnerId: string): Promise<RemoveLearnerResult> {
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

    // Supprimer l'enrollment
    // Essayer d'abord avec learner_id, puis fallback sur user_id
    let deleteError = null;
    let result = await supabase
      .from("enrollments")
      .delete()
      .eq("course_id", courseId)
      .eq("learner_id", learnerId);
    
    deleteError = result.error;
    
    // Si erreur avec learner_id, essayer avec user_id
    if (deleteError) {
      result = await supabase
        .from("enrollments")
        .delete()
        .eq("course_id", courseId)
        .or(`user_id.eq.${learnerId},learner_id.eq.${learnerId}`);
      deleteError = result.error;
    }

    if (deleteError) {
      console.error("[formateur] Error deleting enrollment", deleteError);
      return { success: false, error: "Erreur lors de la suppression" };
    }

    revalidatePath(`/dashboard/formateur/formations/${courseId}/apprenants`);
    revalidatePath("/dashboard/formateur/formations");

    return { success: true };
  } catch (error) {
    console.error("[formateur] Error in removeLearnerFromCourse", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}



