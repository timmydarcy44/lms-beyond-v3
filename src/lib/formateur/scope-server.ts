"use server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";

import { resolveFormateurScope, type FormateurScope } from "@/lib/formateur/scope";

const STAFF_ROLES = new Set([
  "admin",
  "instructor",
  "formateur",
  "trainer",
  "tutor",
  "staff",
  "owner",
]);

export async function getFormateurScopeForSession(): Promise<FormateurScope | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user?.id) return null;

  const [superAdmin, membershipsRes, profileRes] = await Promise.all([
    isSuperAdmin(),
    supabase.from("org_memberships").select("org_id, role").eq("user_id", user.id),
    supabase.from("profiles").select("school_id, email").eq("id", user.id).maybeSingle(),
  ]);

  const membershipOrgIds = Array.from(
    new Set(
      (membershipsRes.data ?? [])
        .filter((m) => STAFF_ROLES.has(String(m.role ?? "").toLowerCase()))
        .map((m) => String(m.org_id ?? "").trim())
        .filter(Boolean),
    ),
  );

  const schoolId = profileRes.data?.school_id?.trim();
  if (schoolId && !membershipOrgIds.includes(schoolId)) {
    membershipOrgIds.push(schoolId);
  }

  return resolveFormateurScope({
    userId: user.id,
    email: user.email ?? profileRes.data?.email,
    isSuperAdmin: superAdmin,
    membershipOrgIds,
  });
}
