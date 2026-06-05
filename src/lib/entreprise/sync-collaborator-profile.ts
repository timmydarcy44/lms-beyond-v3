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
    role: "apprenant",
    role_type: "apprenant",
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
          role: "apprenant",
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
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.warn("[sync-collaborator-profile] listUsers:", error.message);
    return null;
  }
  const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
  return match?.id ?? null;
}
