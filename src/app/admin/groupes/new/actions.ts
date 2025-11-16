'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServiceRoleClient } from "@/lib/supabase/server";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Le nom du groupe est requis"),
  organizationId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  learners: z.array(z.string().min(1)).default([]),
  courses: z.array(z.string().min(1)).default([]),
  paths: z.array(z.string().min(1)).default([]),
  resources: z.array(z.string().min(1)).default([]),
  tests: z.array(z.string().min(1)).default([]),
});

export async function createGroupAction(formData: FormData) {
  const toString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

  const parsed = createGroupSchema.safeParse({
    name: toString(formData.get("name")),
    organizationId: toString(formData.get("organizationId")),
    learners: formData.getAll("learners").map(String).filter(Boolean),
    courses: formData.getAll("courses").map(String).filter(Boolean),
    paths: formData.getAll("paths").map(String).filter(Boolean),
    resources: formData.getAll("resources").map(String).filter(Boolean),
    tests: formData.getAll("tests").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Formulaire invalide";
    redirect(`/admin/groupes/new?error=${encodeURIComponent(message)}`);
  }

  const { name, organizationId, learners, courses, paths, resources, tests } = parsed.data;

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.error("[createGroupAction] Service role client missing", error);
    redirect(`/admin/groupes/new?error=${encodeURIComponent("La configuration Supabase est incomplète")}`);
  }

  try {
    const groupInsert = await supabase
      .from("groups")
      .insert({
        name,
        org_id: organizationId ?? null,
      })
      .select("id")
      .single();

    if (groupInsert.error || !groupInsert.data?.id) {
      throw groupInsert.error ?? new Error("Impossible de créer le groupe");
    }

    const groupId = groupInsert.data.id as string;

    if (learners.length) {
      const memberResult = await supabase
        .from("group_members")
        .upsert(
          learners.map((learnerId) => ({
            group_id: groupId,
            user_id: learnerId,
          })),
          { onConflict: "group_id,user_id" },
        );

      if (memberResult.error) {
        throw memberResult.error;
      }
    }

    if (learners.length && courses.length) {
      const enrollmentPayload = learners.flatMap((learnerId) =>
        courses.map((courseId) => ({
          user_id: learnerId,
          course_id: courseId,
          role: "student",
        })),
      );

      const enrollmentResult = await supabase
        .from("enrollments")
        .upsert(enrollmentPayload, { onConflict: "user_id,course_id" });

      if (enrollmentResult.error) {
        throw enrollmentResult.error;
      }
    }

    if (learners.length && paths.length) {
      const now = new Date().toISOString();
      const pathPayload = learners.flatMap((learnerId) =>
        paths.map((pathId) => ({
          user_id: learnerId,
          path_id: pathId,
          progress_percent: 0,
          last_accessed_at: now,
        })),
      );

      const pathResult = await supabase
        .from("path_progress")
        .upsert(pathPayload, { onConflict: "user_id,path_id" });

      if (pathResult.error) {
        throw pathResult.error;
      }
    }

    if (learners.length && resources.length) {
      const resourcePayload = learners.flatMap((learnerId) =>
        resources.map((resourceId) => ({
          user_id: learnerId,
          resource_id: resourceId,
          progress_percent: 0,
        })),
      );

      const resourceResult = await supabase
        .from("resource_views")
        .upsert(resourcePayload, { onConflict: "user_id,resource_id" });

      if (resourceResult.error) {
        throw resourceResult.error;
      }
    }

    if (learners.length && tests.length) {
      const testsResult = await supabase.from("test_attempts").insert(
        learners.flatMap((learnerId) =>
          tests.map((testId) => ({
            user_id: learnerId,
            test_id: testId,
            status: "in_progress" as const,
          })),
        ),
      );

      if (testsResult.error) {
        throw testsResult.error;
      }
    }

    revalidatePath("/admin/groupes");
    revalidatePath("/admin/apprenants");

    redirect(`/admin/groupes?success=${encodeURIComponent(`Groupe "${name}" créé avec succès`)}`);
  } catch (error) {
    console.error("[createGroupAction]", error);
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    redirect(`/admin/groupes/new?error=${encodeURIComponent(message)}`);
  }
}




