import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { databaseToFrontendRole, type DatabaseRole } from "@/lib/utils/role-mapping";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export interface SessionUser {
  id: string;
  email: string | null;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
}

export const getSession = async () => {
  const profileContext = await getCurrentProfileWithAccess();
  const user = profileContext.user;
  let profile = profileContext.profile as {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    role_type: string | null;
  } | null;
  if (!user) {
    return null;
  }
  const supabase = await getServerClient();
  if (!supabase) {
    console.warn("[session] Supabase indisponible, retour null");
    return null;
  }

  // Log pour debug
  console.log(`[session] Fetching session for user: ${user.email} (${user.id})`);
  if (!profile) {
    console.error("[session] Unable to retrieve user profile, falling back to auth user metadata:", {
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

  // Convertir le rôle de la DB (anglais) vers le frontend (français)
  // Priorité ABSOLUE : profiles.role > org_memberships.role
  // Le rôle dans profiles est le rôle principal de l'utilisateur et doit TOUJOURS être utilisé s'il existe
  let dbRole: DatabaseRole;
  
  // Utiliser role_type en priorité ABSOLUE si present
  if (profile.role_type && profile.role_type !== null && profile.role_type !== "" && profile.role_type !== "null") {
    dbRole = profile.role_type as DatabaseRole;
    console.log(
      `[session] ✅ Using profiles role_type (PRIORITY): "${profile.role_type}" for ${user.email}`
    );
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
  
  const frontendRole = databaseToFrontendRole(dbRole);
  
  // Debug: logger le mapping pour diagnostiquer
  console.log(
    `[session] Role mapping for ${user.email}: role_type="${profile.role_type}", role="${profile.role}", Membership="${membership?.role}", Final DB="${dbRole}" → Frontend="${frontendRole}"`
  );

  const sessionData = {
    id: profile.id,
    email: profile.email,
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


