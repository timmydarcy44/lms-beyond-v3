import type { SupabaseClient } from "@supabase/supabase-js";

type SyncCollaboratorProfileParams = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  employeeId: string;
};

/** Met à jour le profil apprenant et lie l'employé après invitation Supabase Auth. */
export async function syncCollaboratorProfileAfterInvite(
  service: SupabaseClient,
  params: SyncCollaboratorProfileParams,
): Promise<void> {
  const fullName = [params.firstName, params.lastName].filter(Boolean).join(" ").trim();
  const base: Record<string, unknown> = {
    id: params.userId,
    email: params.email.trim().toLowerCase(),
    first_name: params.firstName,
    last_name: params.lastName,
    full_name: fullName || params.email,
    role: "learner",
    role_type: "salarie",
    company_id: params.organizationId,
  };

  let profileErr = (await service.from("profiles").upsert(base, { onConflict: "id" })).error;
  if (profileErr?.code === "42703" || profileErr?.message?.includes("column")) {
    profileErr = (
      await service.from("profiles").upsert(
        {
          id: params.userId,
          email: params.email.trim().toLowerCase(),
          full_name: fullName || params.email,
          role: "learner",
        },
        { onConflict: "id" },
      )
    ).error;
  }
  if (profileErr) {
    console.warn("[sync-collaborator-profile] profiles upsert:", profileErr.message);
  }

  const { error: linkErr } = await service
    .from("employees")
    .update({ profile_id: params.userId })
    .eq("id", params.employeeId);
  if (linkErr) {
    console.warn("[sync-collaborator-profile] employee link:", linkErr.message);
  }
}

/** Résout l'id auth à partir de l'e-mail (utilisateur déjà existant). */
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
    const { data, error } = await admin.getUserByEmail(normalized);
    if (!error && data.user?.id) return data.user.id;
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
