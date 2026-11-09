import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BpfLearnerStatus } from "@/lib/formation-dossier/constants";

export type EnsureLearnerInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationId: string;
  bpfLearnerStatus?: BpfLearnerStatus | null;
  needsSpecificSupport?: boolean;
  jobTitle?: string | null;
};

export type EnsureLearnerResult = {
  profileId: string;
  createdAuthUser: boolean;
  mirroredEmployeeId: string | null;
};

/**
 * Upsert apprenant = profiles + org_memberships (learner).
 *
 * Contrainte DB : profiles.id → auth.users. Sans compte Auth impossible d’insérer un profil.
 * On crée donc un compte Auth **silencieux** (pas d’email d’invitation, pas de magic link).
 * Aucun inviteUserByEmail.
 */
export async function ensureLearnerProfileByEmail(
  service: SupabaseClient,
  input: EnsureLearnerInput,
): Promise<EnsureLearnerResult> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    throw new Error("Email de référence invalide");
  }

  const firstName = String(input.firstName ?? "").trim();
  const lastName = String(input.lastName ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || email;

  const existing = await findProfileByEmail(service, email);
  let profileId = existing?.id ?? null;
  let createdAuthUser = false;

  if (!profileId) {
    const password = randomBytes(24).toString("base64url");
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role_type: "learner",
        account_type: "formation_participant",
        provisioning: "formation_dossier",
        no_invite: true,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      },
      app_metadata: {
        formation_directory_only: true,
      },
    });
    if (created?.user?.id) {
      profileId = created.user.id;
      createdAuthUser = true;
    } else {
      const already =
        Boolean(error?.message?.toLowerCase().includes("already")) ||
        error?.status === 422;
      if (!already) {
        throw new Error(error?.message || "Création profil apprenant impossible");
      }
      // Compte Auth existant sans profil visible : on ne peut pas résoudre l'id sans invite.
      throw new Error(
        `Un compte existe déjà pour ${email} mais aucun profil n'est lié. Reliez-le manuellement.`,
      );
    }
  }

  // Ne jamais rétrograder un responsable RH / admin entreprise en « collaborateur ».
  const { data: existingProfile } = await service
    .from("profiles")
    .select("role, role_type, full_name, first_name, last_name")
    .eq("id", profileId)
    .maybeSingle();
  const { data: existingMembership } = await service
    .from("org_memberships")
    .select("role")
    .eq("org_id", input.organizationId)
    .eq("user_id", profileId)
    .maybeSingle();

  const privilegedProfileRoles = new Set([
    "entreprise",
    "admin",
    "admin_hr",
    "rh",
    "manager",
    "super_admin",
  ]);
  const keepProfileRole =
    privilegedProfileRoles.has(String(existingProfile?.role || "")) ||
    privilegedProfileRoles.has(String(existingProfile?.role_type || "")) ||
    String(existingMembership?.role || "") === "admin";

  const profilePatch: Record<string, unknown> = {
    id: profileId,
    email,
    reference_email: email,
    first_name: firstName || existingProfile?.first_name || undefined,
    last_name: lastName || existingProfile?.last_name || undefined,
    full_name: fullName || existingProfile?.full_name || email,
    needs_specific_support: Boolean(input.needsSpecificSupport),
  };
  if (!keepProfileRole) {
    profilePatch.role = "learner";
  }
  if (input.bpfLearnerStatus) {
    profilePatch.bpf_learner_status = input.bpfLearnerStatus;
  }

  const { error: profileErr } = await service.from("profiles").upsert(profilePatch, {
    onConflict: "id",
  });
  if (profileErr) {
    // Colonnes BPF peuvent manquer avant migration — retry minimal
    const minimal: Record<string, unknown> = {
      id: profileId,
      email,
      full_name: fullName,
    };
    if (!keepProfileRole) minimal.role = "learner";
    await service.from("profiles").upsert(minimal, { onConflict: "id" });
  }

  if (String(existingMembership?.role || "") === "admin") {
    // Garde le siège admin (créateur / RH) — participation formation ≠ rétrogradation.
  } else if (!existingMembership) {
    await service.from("org_memberships").insert({
      org_id: input.organizationId,
      user_id: profileId,
      role: "learner",
    });
  } else if (String(existingMembership.role) !== "tutor" && String(existingMembership.role) !== "instructor") {
    await service
      .from("org_memberships")
      .update({ role: "learner" })
      .eq("org_id", input.organizationId)
      .eq("user_id", profileId);
  }

  let mirroredEmployeeId: string | null = null;
  const { data: employee } = await service
    .from("employees")
    .select("id, profile_id")
    .eq("company_id", input.organizationId)
    .ilike("email", email)
    .maybeSingle();
  if (employee?.id) {
    mirroredEmployeeId = String(employee.id);
    if (!employee.profile_id) {
      await service.from("employees").update({ profile_id: profileId }).eq("id", employee.id);
    }
  }

  return { profileId, createdAuthUser, mirroredEmployeeId };
}

async function findProfileByEmail(
  service: SupabaseClient,
  email: string,
): Promise<{ id: string } | null> {
  const { data: byRef } = await service
    .from("profiles")
    .select("id")
    .ilike("reference_email", email)
    .maybeSingle();
  if (byRef?.id) return { id: String(byRef.id) };

  const { data: byEmail } = await service
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (byEmail?.id) return { id: String(byEmail.id) };

  return null;
}
