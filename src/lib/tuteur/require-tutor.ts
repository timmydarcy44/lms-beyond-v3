import type { SupabaseClient } from "@supabase/supabase-js";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getServerClient } from "@/lib/supabase/server";

export type TutorAuthContext = {
  supabase: SupabaseClient;
  userId: string;
  tutorName: string;
  email: string;
};

const tutorRoles = new Set(["tutor", "tuteur"]);

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
    return { ok: false, status: 403, message: "Accès réservé aux tuteurs" };
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
