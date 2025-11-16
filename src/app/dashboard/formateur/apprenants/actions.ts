"use server";

import { revalidatePath } from "next/cache";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type AssignContentToLearnerResult = {
  success: boolean;
  count?: number;
  error?: string;
};

export type AssignableContentInput = {
  courseIds: string[];
  pathIds: string[];
  resourceIds: string[];
  testIds: string[];
};

export async function assignContentToGroup(
  groupId: string,
  content: AssignableContentInput,
): Promise<AssignContentToLearnerResult> {
  const supabase = await getServerClient();
  const adminClient = await getServiceRoleClientOrFallback();

  if (!supabase) {
    return { success: false, error: "Supabase client unavailable" };
  }

  if (!adminClient) {
    console.warn("[formateur] Admin client unavailable, falling back to session client for writes");
  }

  const writeClient = adminClient ?? supabase;
  console.log("[formateur] Using admin client for group assignment:", !!adminClient);

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier que le groupe existe et appartient à une organisation où le formateur est instructor
    const { data: group } = await supabase
      .from("groups")
      .select("id, org_id, owner_id")
      .eq("id", groupId)
      .single();

    if (!group) {
      return { success: false, error: "Groupe non trouvé" };
    }

    // Vérifier que le formateur est instructor dans l'organisation du groupe
    const { data: instructorMembership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", authData.user.id)
      .eq("org_id", group.org_id)
      .eq("role", "instructor")
      .single();

    if (!instructorMembership) {
      return { success: false, error: "Vous n'avez pas accès à ce groupe" };
    }

    // Récupérer tous les membres du groupe
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (!groupMembers || groupMembers.length === 0) {
      return { success: false, error: "Le groupe ne contient aucun membre" };
    }

    const learnerIds = groupMembers.map((m) => m.user_id);

    // Assigner le contenu à tous les membres du groupe
    let totalAssigned = 0;

    // Assigner les cours
    if (content.courseIds.length > 0) {
      const courseEnrollments: Array<{ course_id: string; learner_id: string; user_id?: string; role: "student" }> = [];

      for (const courseId of content.courseIds) {
        const { data: course } = await supabase
          .from("courses")
          .select("id, owner_id, creator_id")
          .eq("id", courseId)
          .single();

        if (!course || (course.owner_id !== authData.user.id && course.creator_id !== authData.user.id)) {
          continue;
        }

        // Assigner à tous les membres du groupe
        for (const learnerId of learnerIds) {
          courseEnrollments.push({
            course_id: courseId,
            learner_id: learnerId, // Utiliser learner_id en priorité
            user_id: learnerId, // Fallback pour user_id si learner_id n'existe pas
            role: "student",
          });
        }
      }

      if (courseEnrollments.length > 0) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .upsert(courseEnrollments, {
            onConflict: "learner_id,course_id",
          });

        if (enrollError) {
          console.error("[formateur] Error assigning courses to group", enrollError);
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des formations: ${enrollError.message}` 
          };
        }

        totalAssigned += courseEnrollments.length;
      }
    }

    // Assigner les parcours
    if (content.pathIds.length > 0) {
      const validPathIds: string[] = [];
      
      for (const pathId of content.pathIds) {
        const { data: path, error: pathQueryError } = await supabase
          .from("paths")
          .select("id, creator_id, status")
          .eq("id", pathId)
          .maybeSingle();

        if (pathQueryError) {
          console.warn("[formateur] Unable to verify path permissions for group assignment", {
            pathId,
            error: pathQueryError,
          });
          continue;
        }

        if (!path) {
          console.warn(`[formateur] Path ${pathId} not found, skipping`);
          continue;
        }

        const isOwner = path.creator_id === authData.user.id;
        const isPublished = (path as any).status === "published";

        if (isOwner || isPublished) {
          validPathIds.push(pathId);
        } else {
          console.warn("[formateur] Path not owned nor published; assigning due to shared organisation", {
            pathId,
            creatorId: path.creator_id,
            instructorId: authData.user.id,
          });
          validPathIds.push(pathId);
        }
      }

      if (validPathIds.length > 0) {
        const now = new Date().toISOString();
        const pathProgresses = validPathIds.flatMap((pathId) =>
          learnerIds.map((learnerId) => ({
            path_id: pathId,
            user_id: learnerId,
            progress_percent: 0,
            last_accessed_at: now,
          }))
        );

        const { error: pathError } = await supabase
          .from("path_progress")
          .upsert(pathProgresses);

        if (pathError) {
          console.error("[formateur] Error assigning paths to group", pathError);
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des parcours: ${pathError.message}` 
          };
        }

        totalAssigned += pathProgresses.length;
      }
    }

    // Assigner les ressources
    if (content.resourceIds.length > 0) {
      const validResourceIds: string[] = [];
      
      for (const resourceId of content.resourceIds) {
        const { data: resource } = await supabase
          .from("resources")
          .select("id, created_by")
          .eq("id", resourceId)
          .single();

        if (resource && resource.created_by === authData.user.id) {
          validResourceIds.push(resourceId);
        }
      }

      if (validResourceIds.length > 0) {
        const resourceViews = validResourceIds.flatMap((resourceId) =>
          learnerIds.map((learnerId) => ({
            resource_id: resourceId,
            user_id: learnerId,
            progress_percent: 0,
          }))
        );

        const { error: resourceError } = await supabase
          .from("resource_views")
          .upsert(resourceViews);

        if (resourceError) {
          console.error("[formateur] Error assigning resources to group", resourceError);
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des ressources: ${resourceError.message}` 
          };
        }

        totalAssigned += resourceViews.length;
      }
    }

    // Assigner les tests
    if (content.testIds.length > 0) {
      const validTestIds: string[] = [];
      
      for (const testId of content.testIds) {
        const { data: test } = await supabase
          .from("tests")
          .select("id, created_by")
          .eq("id", testId)
          .single();

        if (test && test.created_by === authData.user.id) {
          validTestIds.push(testId);
        }
      }

      if (validTestIds.length > 0) {
        for (const testId of validTestIds) {
          for (const learnerId of learnerIds) {
            const { data: existingAttempt } = await supabase
              .from("test_attempts")
              .select("id")
              .eq("user_id", learnerId)
              .eq("test_id", testId)
              .eq("status", "in_progress")
              .maybeSingle();

            if (!existingAttempt) {
              const { error: testError } = await supabase
                .from("test_attempts")
                .insert({
                  test_id: testId,
                  user_id: learnerId,
                  status: "in_progress" as const,
                });

              if (!testError) {
                totalAssigned += 1;
              }
            } else {
              totalAssigned += 1;
            }
          }
        }
      }
    }

    if (totalAssigned === 0) {
      return { 
        success: false, 
        error: "Aucun élément n'a pu être assigné. Vérifiez que les contenus vous appartiennent." 
      };
    }

    revalidatePath("/dashboard/formateur/apprenants");
    return { success: true, count: totalAssigned };
  } catch (error: any) {
    console.error("[formateur] Error assigning content to group", error);
    return { 
      success: false, 
      error: `Une erreur est survenue: ${error?.message || "Erreur inconnue"}` 
    };
  }
}

export async function assignContentToLearner(
  learnerId: string,
  content: AssignableContentInput,
): Promise<AssignContentToLearnerResult> {
  const supabase = await getServerClient();
  const adminClient = await getServiceRoleClientOrFallback();

  if (!supabase) {
    return { success: false, error: "Supabase client unavailable" };
  }

  if (!adminClient) {
    console.warn("[formateur] Admin client unavailable for group assignment, using session client");
  }

  const writeClient = adminClient ?? supabase;
  console.log("[formateur] Using admin client for group assignment:", !!adminClient);

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return { success: false, error: "Non authentifié" };
    }

    // Vérifier que l'apprenant appartient bien à une organisation du formateur
    const { data: learnerMemberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", learnerId)
      .eq("role", "learner");

    if (!learnerMemberships || learnerMemberships.length === 0) {
      return { success: false, error: "Apprenant non trouvé dans vos organisations" };
    }

    // Vérifier que le formateur est bien dans les mêmes organisations
    const orgIds = learnerMemberships.map((m) => m.org_id);
    const { data: instructorMemberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", authData.user.id)
      .eq("role", "instructor")
      .in("org_id", orgIds);

    if (!instructorMemberships || instructorMemberships.length === 0) {
      return { success: false, error: "Vous n'avez pas accès à cet apprenant" };
    }

    let totalAssigned = 0;

    // Assigner les cours
    if (content.courseIds.length > 0) {
      console.log("[formateur] Starting course assignment", {
        courseIds: content.courseIds,
        learnerId,
        instructorId: authData.user.id,
      });
      
      const courseEnrollments: Array<{ course_id: string; learner_id: string; user_id?: string; role: "student" }> = [];

      // Vérifier chaque ID pour déterminer s'il s'agit d'un course
      for (const id of content.courseIds) {
        // Essayer de trouver dans courses
        const { data: course, error: courseQueryError } = await supabase
          .from("courses")
          .select("id, title, owner_id, creator_id, status")
          .eq("id", id)
          .single();

        if (courseQueryError || !course) {
          console.warn(`[formateur] Course ${id} not found:`, {
            error: courseQueryError,
            message: courseQueryError?.message,
            code: courseQueryError?.code,
          });
          continue;
        }

        console.log(`[formateur] Found course:`, {
          id: course.id,
          title: course.title,
          owner_id: course.owner_id,
          creator_id: course.creator_id,
          status: course.status,
          instructorId: authData.user.id,
        });

        // Vérifier que le course appartient bien au formateur
        const isOwner = course.owner_id === authData.user.id || course.creator_id === authData.user.id;
        if (!isOwner) {
          console.warn(`[formateur] Course ${id} does not belong to instructor`, {
            courseOwnerId: course.owner_id,
            courseCreatorId: course.creator_id,
            instructorId: authData.user.id,
          });
          continue;
        }

        // C'est un course qui appartient au formateur
        // La table enrollments peut avoir learner_id OU user_id selon la migration
        courseEnrollments.push({
          course_id: id,
          learner_id: learnerId, // Utiliser learner_id en priorité
          user_id: learnerId, // Fallback pour user_id si learner_id n'existe pas
          role: "student",
        });
      }
      
      console.log("[formateur] Prepared enrollments:", {
        count: courseEnrollments.length,
        enrollments: courseEnrollments,
      });

      // Assigner les courses via enrollments
      if (courseEnrollments.length === 0) {
        console.warn("[formateur] No valid courses to assign after filtering");
        // Retourner une erreur si aucun cours valide n'a été trouvé
        return { 
          success: false, 
          error: "Aucune formation valide à assigner. Vérifiez que la formation existe et vous appartient." 
        };
      } else {
        console.log("[formateur] Attempting to create enrollments", {
          count: courseEnrollments.length,
          enrollments: courseEnrollments,
        });
        
        // Essayer avec learner_id d'abord, puis fallback sur user_id si la contrainte diffère
        let enrollError = null;
        
        // Tentative 1 : Utiliser learner_id avec onConflict
        let result = await writeClient
          .from("enrollments")
          .upsert(courseEnrollments, {
            onConflict: "learner_id,course_id",
          });
        
        enrollError = result.error;
        if (!enrollError) {
          console.log("[formateur] Enrollment upsert result", result.data);
        }
        
        if (enrollError) {
          console.error("[formateur] Upsert with learner_id failed, error details:", {
            error: enrollError,
            code: enrollError.code,
            message: enrollError.message,
            details: enrollError.details,
            hint: enrollError.hint,
            enrollments: courseEnrollments,
          });
          
          // Si erreur de contrainte avec learner_id, essayer avec user_id
          if (enrollError.code === '42704' || enrollError.message?.includes('conflict') || enrollError.message?.includes('constraint') || enrollError.code === '42P01') {
            console.warn("[formateur] Constraint mismatch with learner_id, trying user_id");
            result = await writeClient
              .from("enrollments")
              .upsert(courseEnrollments, {
                onConflict: "user_id,course_id",
              });
            enrollError = result.error;
            if (!enrollError) {
              console.log("[formateur] Enrollment upsert result (user_id)", result.data);
            }
            
            if (enrollError) {
              console.error("[formateur] Upsert with user_id also failed:", {
                error: enrollError,
                code: enrollError.code,
                message: enrollError.message,
              });
            } else {
              console.log("[formateur] Upsert with user_id succeeded");
            }
          }
        } else {
          console.log("[formateur] Upsert with learner_id succeeded");
        }

        if (enrollError) {
          console.error("[formateur] Final error creating course enrollments", {
            error: enrollError,
            code: enrollError.code,
            message: enrollError.message,
            details: enrollError.details,
            hint: enrollError.hint,
            enrollments: courseEnrollments,
          });
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des formations: ${enrollError.message || "Erreur inconnue"}` 
          };
        }

        console.log("[formateur] Successfully assigned courses", {
          count: courseEnrollments.length,
        });
        
        totalAssigned += courseEnrollments.length;
      }
    }

    // Assigner les parcours
    if (content.pathIds.length > 0) {
      const validPathIds: string[] = [];
      const now = new Date().toISOString();

      for (const pathId of content.pathIds) {
        const { data: path, error: pathQueryError } = await supabase
          .from("paths")
          .select("id, creator_id, status")
          .eq("id", pathId)
          .maybeSingle();

        if (pathQueryError) {
          console.warn("[formateur] Unable to verify path permissions, skipping", {
            pathId,
            error: pathQueryError,
          });
          continue;
        }

        if (!path) {
          console.warn(`[formateur] Path ${pathId} not found, skipping`);
          continue;
        }

        const isOwner = path.creator_id === authData.user.id;
        const isPublished = (path as any).status === "published";

        if (isOwner || isPublished) {
          validPathIds.push(pathId);
        } else {
          console.warn("[formateur] Path not owned nor published; assigning anyway due to shared organisation", {
            pathId,
            creatorId: path.creator_id,
            instructorId: authData.user.id,
          });
          validPathIds.push(pathId);
        }
      }

      if (validPathIds.length === 0) {
        console.warn("[formateur] No valid paths to assign after filtering");
      } else {
        const pathProgresses = validPathIds.map((pathId) => ({
          path_id: pathId,
          user_id: learnerId,
          progress_percent: 0,
          last_accessed_at: now,
        }));

        // Utiliser upsert sans spécifier onConflict - Supabase utilisera la clé primaire (user_id, path_id)
        const { data: pathResult, error: pathError } = await writeClient
          .from("path_progress")
          .upsert(pathProgresses)
          .select("user_id, path_id, progress_percent");

        if (pathError) {
          console.error("[formateur] Error creating path progress", pathError);
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des parcours: ${pathError.message || "Erreur inconnue"}` 
          };
        }

        console.log("[formateur] Upserted path progress for learner", {
          learnerId,
          count: pathResult?.length ?? 0,
          rows: pathResult,
        });

        totalAssigned += pathProgresses.length;
      }
    }

    // Assigner les ressources
    if (content.resourceIds.length > 0) {
      // Vérifier que les ressources appartiennent au formateur
      const validResourceIds: string[] = [];
      
      for (const resourceId of content.resourceIds) {
        const { data: resource } = await supabase
          .from("resources")
          .select("id, created_by")
          .eq("id", resourceId)
          .single();

        if (resource && resource.created_by === authData.user.id) {
          validResourceIds.push(resourceId);
        } else {
          console.warn(`[formateur] Resource ${resourceId} does not belong to instructor, skipping`);
        }
      }

      if (validResourceIds.length === 0) {
        console.warn("[formateur] No valid resources to assign after filtering");
      } else {
        const resourceViews = validResourceIds.map((resourceId) => ({
          resource_id: resourceId,
          user_id: learnerId,
          progress_percent: 0,
        }));

        // Utiliser upsert sans spécifier onConflict - Supabase utilisera la clé primaire (user_id, resource_id)
        const { error: resourceError } = await writeClient
          .from("resource_views")
          .upsert(resourceViews);

        if (resourceError) {
          console.error("[formateur] Error creating resource views", resourceError);
          return { 
            success: false, 
            error: `Erreur lors de l'assignation des ressources: ${resourceError.message || "Erreur inconnue"}` 
          };
        }

        totalAssigned += resourceViews.length;
      }
    }

    // Assigner les tests
    if (content.testIds.length > 0) {
      // Vérifier que les tests appartiennent au formateur
      const validTestIds: string[] = [];
      
      for (const testId of content.testIds) {
        const { data: test } = await supabase
          .from("tests")
          .select("id, created_by")
          .eq("id", testId)
          .single();

        if (test && test.created_by === authData.user.id) {
          validTestIds.push(testId);
        } else {
          console.warn(`[formateur] Test ${testId} does not belong to instructor, skipping`);
        }
      }

      if (validTestIds.length === 0) {
        console.warn("[formateur] No valid tests to assign after filtering");
      } else {
        // Pour test_attempts, vérifier d'abord s'il existe déjà un attempt, puis insérer ou ignorer
        // La table test_attempts a une clé primaire id, pas de contrainte unique sur (user_id, test_id)
        // On vérifie donc d'abord s'il existe déjà un attempt en cours pour éviter les doublons
        for (const testId of validTestIds) {
          const { data: existingAttempt } = await supabase
            .from("test_attempts")
            .select("id")
            .eq("user_id", learnerId)
            .eq("test_id", testId)
            .eq("status", "in_progress")
            .maybeSingle();

          if (!existingAttempt) {
            // Pas d'attempt en cours, on en crée un nouveau
            const { error: testError } = await writeClient
              .from("test_attempts")
              .insert({
                test_id: testId,
                user_id: learnerId,
                status: "in_progress" as const,
              });

            if (testError) {
              console.error(`[formateur] Error creating test attempt for ${testId}`, testError);
              // On continue avec les autres tests même si celui-ci échoue
            } else {
              totalAssigned += 1;
            }
          } else {
            // Attempt déjà existant, on compte quand même comme assigné
            totalAssigned += 1;
          }
        }
      }
    }

    if (totalAssigned === 0) {
      return { 
        success: false, 
        error: "Aucun élément n'a pu être assigné. Vérifiez que les contenus vous appartiennent." 
      };
    }

    revalidatePath("/dashboard/formateur/apprenants");
    revalidatePath("/dashboard/apprenant");
    revalidatePath("/dashboard");

    return { success: true, count: totalAssigned };
  } catch (error: any) {
    console.error("[formateur] Error assigning content to learner", error);
    return { 
      success: false, 
      error: `Une erreur est survenue: ${error?.message || "Erreur inconnue"}` 
    };
  }
}

