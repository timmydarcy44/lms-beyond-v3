"use server";

import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function requireEdgeAdmin(): Promise<{ ok: true; userId: string } | { ok: false }> {
  const session = await getSession();
  if (!session?.id) return { ok: false };

  if (await isSuperAdmin()) {
    return { ok: true, userId: session.id };
  }

  const supabase = await getServerClient();
  if (!supabase) return { ok: false };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.id).maybeSingle();
  if (profile?.role === "admin") {
    return { ok: true, userId: session.id };
  }

  const { data: memberships } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("user_id", session.id)
    .eq("role", "admin")
    .limit(1);

  if (memberships && memberships.length > 0) {
    return { ok: true, userId: session.id };
  }

  return { ok: false };
}
