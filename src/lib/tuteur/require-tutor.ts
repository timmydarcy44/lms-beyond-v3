import type { SupabaseClient } from "@supabase/supabase-js";

import { grantUserRole } from "@/lib/auth/user-roles";
import { afterSuccessfulAuth } from "@/lib/cfa/sync-tutor-assignment";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export type TutorAuthContext = {
  supabase: SupabaseClient;
  userId: string;
  tutorName: string;
  email: string;
};

const tutorRoles = new Set(["tutor", "tuteur"]);

async function linkTutorMembership(userId: string, email: string) {
  const db = getServiceRoleClient();
  if (!db) return false;
  const activated = await afterSuccessfulAuth(db, { userId, email });
  if (activated.activatedTutor) return true;
  const normalized = email.trim();
  const [roles, byUser, byEmail] = await Promise.all([
    db.from("user_roles").select("role").eq("user_id", userId).in("role", ["tuteur", "tutor"]),
    db.from("company_tutors").select("id").eq("user_id", userId).limit(1),
    normalized
      ? db.from("company_tutors").select("id, user_id").ilike("email", normalized)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const listed = !roles.error && (roles.data?.length ?? 0) > 0;
  const linked = !byUser.error && (byUser.data?.length ?? 0) > 0;
  const emailRows = (!byEmail.error ? byEmail.data ?? [] : []) as Array<{ id: string; user_id?: string | null }>;
  if (!listed && !linked && emailRows.length === 0) return false;
  const pending = emailRows.filter((row) => !row.user_id).map((row) => row.id);
  if (pending.length) {
    await db
      .from("company_tutors")
      .update({ user_id: userId, activated_at: new Date().toISOString() })
      .in("id", pending);
  }
  await grantUserRole(db, userId, "tuteur");
  return true;
}

function displayNameFromProfile(row: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) {
  const fn = String(row.full_name ?? "").trim();
  if (fn) return fn;
  const parts = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  return String(row.email ?? "").trim() || "Tuteur";
}

export async function requireTutorClient(): Promise<
  { ok: true; ctx: TutorAuthContext } | { ok: false; status: number; message: string }
> {
  const supabase = await getServerClient();
  if (!supabase) {
    return { ok: false, status: 503, message: "Supabase indisponible" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { ok: false, status: 401, message: "Non authentifié" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, status: 403, message: "Profil introuvable" };
  }

  const role = String((profile as { role?: string }).role ?? "").toLowerCase();
  const email = String((profile as { email?: string | null }).email ?? user.email ?? "");
  if (!tutorRoles.has(role) && !isJadeDemoEmail(email)) {
    const allowed = await linkTutorMembership(user.id, email);
    if (!allowed) return { ok: false, status: 403, message: "Accès réservé aux tuteurs" };
  }

  return {
    ok: true,
    ctx: {
      supabase,
      userId: user.id,
      tutorName: displayNameFromProfile(profile as Record<string, string | null | undefined>),
      email,
    },
  };
}
