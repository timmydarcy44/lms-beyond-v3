import { isSuperAdmin } from "@/lib/auth/super-admin";
import { canAccessHandicapSpace } from "@/lib/handicap/access";
import { getServerClient } from "@/lib/supabase/server";

/** Staff handicap : référente OF / role_type handicap / super-admin. */
export async function isDisabilityStaff(userId?: string | null): Promise<boolean> {
  if (await canAccessHandicapSpace(userId)) return true;
  return isSuperAdmin();
}

export async function requireDisabilityStaff(): Promise<
  | { ok: true; userId: string; email: string | null; firstName: string | null }
  | { ok: false; status: 401 | 403 }
> {
  const client = await getServerClient();
  const { data } = client ? await client.auth.getUser() : { data: { user: null } };
  const user = data.user;
  if (!user?.id) return { ok: false, status: 401 };

  const allowed = (await canAccessHandicapSpace(user.id)) || (await isSuperAdmin());
  if (!allowed) return { ok: false, status: 403 };

  let firstName: string | null = null;
  try {
    const { getServiceRoleClient } = await import("@/lib/supabase/server");
    const service = getServiceRoleClient();
    if (service) {
      const { data: profile } = await service
        .from("profiles")
        .select("first_name, full_name")
        .eq("id", user.id)
        .maybeSingle();
      firstName =
        String(profile?.first_name ?? "").trim() ||
        String(profile?.full_name ?? "")
          .trim()
          .split(/\s+/)[0] ||
        null;
    }
  } catch {
    firstName = null;
  }

  return {
    ok: true,
    userId: user.id,
    email: user.email ?? null,
    firstName,
  };
}
