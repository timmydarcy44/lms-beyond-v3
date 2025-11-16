'use server';

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getServiceRoleClient } from "@/lib/supabase/server";

const createLearnerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  lastName: z.string().trim().min(1, "Le nom est requis"),
  email: z.string().trim().email("Adresse e-mail invalide"),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  organizationId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  groups: z.array(z.string().min(1)).default([]),
  courses: z.array(z.string().min(1)).default([]),
  paths: z.array(z.string().min(1)).default([]),
  resources: z.array(z.string().min(1)).default([]),
  tests: z.array(z.string().min(1)).default([]),
});

export async function createLearnerAction(formData: FormData) {
  const toString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "");

  const parsed = createLearnerSchema.safeParse({
    firstName: toString(formData.get("firstName")),
    lastName: toString(formData.get("lastName")),
    email: toString(formData.get("email")),
    phone: toString(formData.get("phone")),
    organizationId: toString(formData.get("organizationId")),
    groups: formData.getAll("groups").map(String).filter(Boolean),
    courses: formData.getAll("courses").map(String).filter(Boolean),
    paths: formData.getAll("paths").map(String).filter(Boolean),
    resources: formData.getAll("resources").map(String).filter(Boolean),
    tests: formData.getAll("tests").map(String).filter(Boolean),
  });

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? "Formulaire invalide";
    redirect(`/admin/apprenants/new?error=${encodeURIComponent(message)}`);
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    organizationId,
    groups,
    courses,
    paths,
    resources,
    tests,
  } = parsed.data;

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.error("[createLearnerAction] Service role client missing", error);
    redirect(`/admin/apprenants/new?error=${encodeURIComponent("La configuration Supabase est incomplète")}`);
  }

  try {
    const inviteResponse = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone,
      },
    });

    if (inviteResponse.error || !inviteResponse.data?.user) {
      const message = inviteResponse.error?.message ?? "Impossible d'inviter cet utilisateur";
      throw new Error(message);
    }

    const userId = inviteResponse.data.user.id;

    const displayName = `${firstName} ${lastName}`.trim();
    const profileResult = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        role: "student",
        display_name: displayName,
      })
      .select("id")
      .maybeSingle();

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (organizationId) {
      const membershipResult = await supabase
        .from("org_memberships")
        .upsert(
          {
            org_id: organizationId,
            user_id: userId,
            role: "learner",
          },
          { onConflict: "org_id,user_id" },
        );

      if (membershipResult.error) {
        throw membershipResult.error;
      }
    }

    if (groups.length) {
      const groupResult = await supabase
        .from("group_members")
        .upsert(
          groups.map((groupId) => ({
            group_id: groupId,
            user_id: userId,
          })),
          { onConflict: "group_id,user_id" },
        );

      if (groupResult.error) {
        throw groupResult.error;
      }
    }

    if (courses.length) {
      const courseResult = await supabase
        .from("enrollments")
        .upsert(
          courses.map((courseId) => ({
            course_id: courseId,
            user_id: userId,
            role: "student",
          })),
          { onConflict: "user_id,course_id" },
        );

      if (courseResult.error) {
        throw courseResult.error;
      }
    }

    if (paths.length) {
      const now = new Date().toISOString();
      const pathResult = await supabase
        .from("path_progress")
        .upsert(
          paths.map((pathId) => ({
            path_id: pathId,
            user_id: userId,
            progress_percent: 0,
            last_accessed_at: now,
          })),
          { onConflict: "user_id,path_id" },
        );

      if (pathResult.error) {
        throw pathResult.error;
      }
    }

    if (resources.length) {
      const resourceResult = await supabase
        .from("resource_views")
        .upsert(
          resources.map((resourceId) => ({
            resource_id: resourceId,
            user_id: userId,
            progress_percent: 0,
          })),
          { onConflict: "user_id,resource_id" },
        );

      if (resourceResult.error) {
        throw resourceResult.error;
      }
    }

    if (tests.length) {
      const testResult = await supabase.from("test_attempts").insert(
        tests.map((testId) => ({
          test_id: testId,
          user_id: userId,
          status: "in_progress" as const,
        })),
      );

      if (testResult.error) {
        throw testResult.error;
      }
    }

    revalidatePath("/admin/apprenants");
    revalidatePath("/admin/groupes");

    redirect(
      `/admin/apprenants?success=${encodeURIComponent(
        `Invitation envoyée à ${displayName} (${email})`,
      )}`,
    );
  } catch (error) {
    console.error("[createLearnerAction]", error);
    const message = error instanceof Error ? error.message : "Une erreur est survenue";
    redirect(`/admin/apprenants/new?error=${encodeURIComponent(message)}`);
  }
}




