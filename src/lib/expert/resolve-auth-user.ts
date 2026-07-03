import type { SupabaseClient } from "@supabase/supabase-js";

/** Résout l'id auth à partir de l'e-mail (côté serveur, service role uniquement). */
export async function resolveAuthUserIdByEmail(
  service: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();

  const admin = service.auth.admin as {
    getUserByEmail?: (email: string) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
    listUsers: (opts: { page: number; perPage: number }) => Promise<{
      data: { users: Array<{ id: string; email?: string | null }> };
      error: unknown;
    }>;
  };

  if (typeof admin.getUserByEmail === "function") {
    try {
      const { data, error } = await admin.getUserByEmail(normalized);
      if (!error && data.user?.id) return data.user.id;
    } catch {
      /* SDK sans getUserByEmail — fallback listUsers */
    }
  }

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error || !data.users.length) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match?.id) return match.id;
    if (data.users.length < 1000) break;
  }

  return null;
}
