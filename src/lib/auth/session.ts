import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { databaseToFrontendRole, type DatabaseRole } from "@/lib/utils/role-mapping";
import { getCurrentProfileWithAccess, type ProfileWithAccess } from "@/lib/auth/profile";
import { profileRolesIndicateSchoolDashboard } from "@/lib/auth/school-access";

const ADMIN_FALLBACK_EMAIL = "timmydarcy44@gmail.com";

const PROFILE_SERVICE_SELECT =
  "id, email, full_name, avatar_url, role, role_type, company_id, school_id, access_lms, access_connect, access_care";

function isRoleEmpty(value: string | null | undefined) {
  const s = String(value ?? "").trim().toLowerCase();
  return !s || s === "null";
}

export interface SessionUser {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
  /** Indique un accès garanti (ex. compte admin de secours). */
  authorized?: boolean;
}

export const getSession = async () => {
  const supabase = await getServerClient();
  if (!supabase) {
    console.warn("[session] Supabase indisponible, retour null");
    return null;
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser?.id) {
    return null;
  }

  const emailBypass = String(authUser.email ?? "").trim().toLowerCase();
  if (emailBypass === ADMIN_FALLBACK_EMAIL) {
    const md = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    return {
      id: authUser.id,
      email: authUser.email ?? null,
      role: "admin",
      fullName: typeof md.full_name === "string" ? md.full_name : authUser.email ?? null,
      avatarUrl: typeof md.avatar_url === "string" ? md.avatar_url : null,
      authorized: true,
    } satisfies SessionUser;
  }

  const profileContext = await getCurrentProfileWithAccess();
  const user = profileContext.user;
  if (!user) {
    return null;
  }

  let profile = profileContext.profile as ProfileWithAccess | null;

  // Seconde tentative : service role si profil absent ou rôles vides (alignement DB / auth)
  const service = getServiceRoleClient();
  if (service) {
    const needsRetry =
      !profile || (isRoleEmpty(profile.role) && isRoleEmpty(profile.role_type));
    if (needsRetry) {
      const { data: byId } = await service
        .from("profiles")
        .select(PROFILE_SERVICE_SELECT)
        .eq("id", user.id)
        .maybeSingle();
      if (byId) {
        profile = { ...(profile ?? ({} as ProfileWithAccess)), ...(byId as ProfileWithAccess) };
      }
      const emailNorm = String(user.email ?? "").trim().toLowerCase();
      if (emailNorm && (!profile || (isRoleEmpty(profile.role) && isRoleEmpty(profile.role_type)))) {
        const { data: byEmail } = await service
          .from("profiles")
          .select(PROFILE_SERVICE_SELECT)
          .eq("email", emailNorm)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byEmail) {
          profile = {
            ...(profile ?? ({} as ProfileWithAccess)),
            ...(byEmail as ProfileWithAccess),
            id: user.id,
          };
        }
      }
    }
  }

  if (!profile) {
    console.warn("[session] Profil encore absent après retry — fallback métadonnées auth:", {
      userId: user.id,
      email: user.email,
    });

    profile = {
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata && typeof user.user_metadata.full_name === "string"
          ? user.user_metadata.full_name
          : null) ?? user.email ?? null,
      avatar_url:
        (user.user_metadata && typeof user.user_metadata.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null) ?? null,
      role:
        (user.user_metadata && typeof user.user_metadata.role === "string"
          ? user.user_metadata.role
          : null) ?? null,
      role_type:
        (user.user_metadata && typeof user.user_metadata.role_type === "string"
          ? user.user_metadata.role_type
          : null) ?? null,
      company_id: null,
      school_id: null,
      access_lms: null,
      access_connect: null,
      access_care: null,
    };
  }

  // Vérifier aussi org_memberships pour le rôle (fallback si profile.role est vide)
  let { data: membership, error: membershipError } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if ((!membership && membershipError) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const serviceClient = getServiceRoleClient();
    if (serviceClient) {
      const { data: serviceMembership, error: serviceMembershipError } = await serviceClient
        .from("org_memberships")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (serviceMembership) {
        membership = serviceMembership;
        membershipError = null;
      } else if (serviceMembershipError) {
        console.warn("[session] Unable to fetch membership with service role:", serviceMembershipError.message);
      }
    }
  }

  const normalizedRoleSlug = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");

  /** Valeur canonique depuis la colonne `profiles.role` (prime sur `role_type` si celui-ci est résiduel, ex. student + role ecole). */
  function dbRoleFromProfileRoleColumn(norm: string): DatabaseRole | null {
    if (!norm || norm === "null") return null;
    if (norm === "ecole") return "ecole";
    if (norm === "instructor" || norm === "formateur") return "instructor";
    if (norm === "admin" || norm === "super_admin") return "admin";
    if (norm === "tutor" || norm === "tuteur") return "tutor";
    if (norm === "mentor") return "mentor";
    if (norm === "entreprise") return "entreprise";
    if (norm === "admin_hr") return "admin_hr";
    if (norm === "praticien_bct" || norm === "praticien") return "praticien_bct";
    if (norm === "expert") return "expert";
    if (norm === "manager") return "admin_hr";
    if (norm === "club") return "club";
    if (norm === "partenaire") return "partenaire";
    if (norm === "demo") return "demo";
    if (norm === "student" || norm === "apprenant" || norm === "particulier" || norm === "learner") return "student";
    return null;
  }

  // Convertir le rôle de la DB (anglais) vers le frontend (français)
  let dbRole: DatabaseRole;

  const roleColNorm = normalizedRoleSlug(profile.role);
  const fromRoleColumn = dbRoleFromProfileRoleColumn(roleColNorm);

  if (profileRolesIndicateSchoolDashboard(profile.role, profile.role_type)) {
    dbRole = "ecole";
    console.log(
      `[session] ✅ School dashboard role (profiles.role / role_type): "${profile.role}" / "${profile.role_type}" → ecole for ${user.email}`,
    );
  } else if (fromRoleColumn) {
    dbRole = fromRoleColumn;
    console.log(`[session] ✅ Using profiles.role column: "${profile.role}" → ${dbRole} for ${user.email}`);
  } else if (profile.role_type && profile.role_type !== null && profile.role_type !== "" && profile.role_type !== "null") {
    dbRole = profile.role_type as DatabaseRole;
    console.log(`[session] ✅ Using profiles role_type: "${profile.role_type}" for ${user.email}`);
  } else if (profile.role && profile.role !== null && profile.role !== "" && profile.role !== "null") {
    dbRole = profile.role as DatabaseRole;
    console.log(`[session] ✅ Using profiles role (fallback): "${profile.role}" for ${user.email}`);
  } else if (membership?.role) {
    // Fallback : utiliser org_memberships.role SEULEMENT si profiles.role est vraiment vide/null
    // Mapping des rôles de org_memberships (peut être "learner" au lieu de "student")
    const membershipRole = membership.role === "learner" ? "student" : membership.role;
    dbRole = membershipRole as DatabaseRole;
    console.log(`[session] ⚠️ Using org_memberships role as fallback (profiles.role was empty): "${membership.role}" → "${membershipRole}" for ${user.email}`);
  } else {
    // Si pas de rôle défini, on default à student
    console.warn(`[session] ⚠️ Profile ${profile.id} (${user.email}) has no role set. Defaulting to student.`);
    dbRole = "student";
  }

  const roleFromProfile = String(profile.role ?? profile.role_type ?? "").trim().toLowerCase();
  if (roleFromProfile === "super_admin") {
    dbRole = "admin";
  }

  const frontendRole = databaseToFrontendRole(dbRole);
  
  // Debug: logger le mapping pour diagnostiquer
  console.log(
    `[session] Role mapping for ${user.email}: role_type="${profile.role_type}", role="${profile.role}", Membership="${membership?.role}", Final DB="${dbRole}" → Frontend="${frontendRole}"`
  );

  const sessionData = {
    id: user.id,
    email: profile.email ?? user.email ?? null,
    role: frontendRole,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  } satisfies SessionUser;

  console.log(`[session] Session data for ${user.email}:`, {
    id: sessionData.id,
    email: sessionData.email,
    role: sessionData.role,
    fullName: sessionData.fullName,
  });

  return sessionData;
};

export const requireSession = cache(async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
});

export const requireRole = cache(async (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const session = await requireSession();

  if (!allowedRoles.includes(session.role)) {
    redirect("/unauthorized");
  }

  return session;
});


