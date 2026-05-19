import type { SupabaseClient } from "@supabase/supabase-js";

/** Rôles UI/API super-admin → schéma LMS */
export type SuperAdminMemberApiRole =
  | "admin"
  | "trainer"
  | "student"
  | "tutor"
  | "handicap_referent";

export function toDbOrgMembershipRole(api: SuperAdminMemberApiRole): "admin" | "instructor" | "learner" | "tutor" {
  if (api === "trainer") return "instructor";
  if (api === "student") return "learner";
  if (api === "handicap_referent") return "tutor";
  if (api === "tutor") return "tutor";
  return "admin";
}

/** Colonne `profiles.role` (CHECK historique student | instructor | admin | tutor) + role_type métier */
export function defaultProfilesRolePair(api: SuperAdminMemberApiRole): {
  profileRole: "student" | "instructor" | "admin" | "tutor";
  roleType: string | null;
} {
  if (api === "student") return { profileRole: "student", roleType: "apprenant" };
  if (api === "trainer") return { profileRole: "instructor", roleType: "ecole" };
  if (api === "admin") return { profileRole: "admin", roleType: "ecole" };
  if (api === "handicap_referent") return { profileRole: "tutor", roleType: "referent_handicap" };
  return { profileRole: "tutor", roleType: "ecole" };
}

export type UpsertOrgMemberInput = {
  supabase: SupabaseClient;
  orgId: string;
  email: string;
  apiRole: SuperAdminMemberApiRole;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  tempPassword?: string;
  /** Rattache `profiles.school_id = orgId` (CFA : org = école) */
  attachSchoolId?: boolean;
  /** Pour apprenants : ligne `school_students` */
  enrollSchoolStudent?: boolean;
  profileRoleOverride?: "student" | "instructor" | "admin" | "tutor" | null;
  roleTypeOverride?: string | null;
  phone?: string | null;
  schoolClass?: string | null;
  contractType?: string | null;
  avatarUrl?: string | null;
};

export type UpsertOrgMemberResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; details?: string };

function buildIdentity(input: UpsertOrgMemberInput) {
  const first = (input.firstName ?? "").trim();
  const last = (input.lastName ?? "").trim();
  const explicitFull = (input.fullName ?? "").trim();
  const fullFromParts = [first, last].filter(Boolean).join(" ").trim();
  const full = fullFromParts || explicitFull;
  return { firstName: first, lastName: last, fullName: full };
}

async function upsertMembership(
  supabase: SupabaseClient,
  orgId: string,
  userId: string,
  dbRole: "admin" | "instructor" | "learner" | "tutor",
): Promise<{ error: Error | null }> {
  let membershipError: any = null;
  {
    const { error } = await supabase.from("org_memberships").upsert({
      org_id: orgId,
      user_id: userId,
      role: dbRole,
    });
    membershipError = error;
    if (membershipError?.code === "42703") {
      const { error: error2 } = await supabase.from("org_memberships").upsert({
        organisation_id: orgId,
        user_id: userId,
        role: dbRole,
      } as any);
      membershipError = error2;
    }
  }
  return { error: membershipError ? new Error(membershipError.message || "MEMBERSHIP_UPSERT_FAILED") : null };
}

/**
 * Crée ou invite l’utilisateur Auth, enrichit `profiles`, rattache `org_memberships`.
 * Optionnel : `school_id` + `school_students` pour les parcours CFA / Connect.
 */
export async function upsertOrgMember(input: UpsertOrgMemberInput): Promise<UpsertOrgMemberResult> {
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { ok: false, error: "EMAIL_REQUIRED" };

  const attachSchoolId = input.attachSchoolId !== false;
  const dbMembershipRoleEarly = toDbOrgMembershipRole(input.apiRole);
  const enrollSchoolStudent =
    dbMembershipRoleEarly === "learner" &&
    attachSchoolId &&
    input.enrollSchoolStudent !== false;

  const identity = buildIdentity(input);
  const fullName = identity.fullName;
  const tempPassword = (input.tempPassword ?? "").trim();
  const dbMembershipRole = dbMembershipRoleEarly;
  const defaults = defaultProfilesRolePair(input.apiRole);
  const pair = {
    profileRole: input.profileRoleOverride ?? defaults.profileRole,
    roleType:
      input.roleTypeOverride !== undefined && input.roleTypeOverride !== null
        ? input.roleTypeOverride
        : defaults.roleType,
  };

  const supabase = input.supabase;
  const orgId = input.orgId;

  let userId: string | null = null;
  {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, first_name, last_name")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      if (profileError.code === "42703") {
        const { data: profile2, error: profileError2 } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("email", email)
          .maybeSingle();
        if (profileError2) {
          return { ok: false, error: "PROFILE_LOOKUP_FAILED", details: profileError2.message };
        }
        userId = profile2?.id ?? null;
      } else {
        return { ok: false, error: "PROFILE_LOOKUP_FAILED", details: profileError.message };
      }
    } else {
      userId = profile?.id ?? null;
    }
  }

  if (!userId) {
    if (tempPassword) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: fullName || undefined,
          first_name: identity.firstName || undefined,
          last_name: identity.lastName || undefined,
          role: dbMembershipRole,
        },
      });
      if (createError || !created?.user?.id) {
        return { ok: false, error: "AUTH_CREATE_USER_FAILED", details: createError?.message };
      }
      userId = created.user.id;
    } else {
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName || undefined,
          first_name: identity.firstName || undefined,
          last_name: identity.lastName || undefined,
          role: dbMembershipRole,
        },
      });
      if (inviteError || !invited?.user?.id) {
        return { ok: false, error: "AUTH_INVITE_FAILED", details: inviteError?.message };
      }
      userId = invited.user.id;
    }
  }

  if (userId) {
    const profileBase: Record<string, any> = {
      id: userId,
      email,
      role: pair.profileRole,
    };
    if (fullName) profileBase.full_name = fullName;
    if (identity.firstName) profileBase.first_name = identity.firstName;
    if (identity.lastName) profileBase.last_name = identity.lastName;
    if (pair.roleType) profileBase.role_type = pair.roleType;
    if (attachSchoolId) profileBase.school_id = orgId;
    const phone = (input.phone ?? "").trim();
    const schoolClass = (input.schoolClass ?? "").trim();
    const contractType = (input.contractType ?? "").trim();
    if (phone) {
      profileBase.phone = phone;
      profileBase.telephone = phone;
    }
    if (schoolClass) profileBase.school_class = schoolClass;
    if (contractType) profileBase.contract_type = contractType;
    const avatar = String(input.avatarUrl ?? "").trim();
    if (avatar) profileBase.avatar_url = avatar;

    const tryUpsert = async (payload: Record<string, any>) => supabase.from("profiles").upsert(payload, { onConflict: "id" });

    let profileUpsertError: any = null;
    const r1 = await tryUpsert(profileBase);
    profileUpsertError = r1.error;

    if (profileUpsertError?.code === "42703") {
      const reduced: Record<string, any> = { id: userId, email };
      if (fullName) reduced.full_name = fullName;
      const r2 = await tryUpsert(reduced);
      profileUpsertError = r2.error;
    }

    if (profileUpsertError) {
      console.error("profiles upsert (org member):", profileUpsertError);
    }
  }

  const { error: memErr } = await upsertMembership(supabase, orgId, userId!, dbMembershipRole);
  if (memErr) {
    return { ok: false, error: memErr.message };
  }

  if (enrollSchoolStudent && userId) {
    const { error: ssErr } = await supabase.from("school_students").insert({
      school_id: orgId,
      student_id: userId,
    });
    if (ssErr && ssErr.code !== "23505" && ssErr.code !== "42P01") {
      return { ok: false, error: ssErr.message };
    }
  }

  return { ok: true, userId: userId! };
}
