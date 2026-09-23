import type { SupabaseClient } from "@supabase/supabase-js";

export type ParticulierProfileInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  objectif?: string | null;
};

/**
 * Crée ou met à jour le profil d'un particulier EDGE.
 * L'objectif est aussi stocké dans auth.user_metadata (voir route signup).
 */
export async function upsertParticulierProfile(
  supabase: SupabaseClient,
  input: ParticulierProfileInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const basePayload = {
    id: input.userId,
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
    full_name: fullName,
    /** Accès espace apprenant EDGE */
    role: "learner",
    role_type: "particulier",
  };

  const { error: baseError } = await supabase.from("profiles").upsert(basePayload, { onConflict: "id" });

  if (baseError) {
    const message = baseError.message ?? "Erreur profil";
    if (message.includes("profiles_role_check") || message.toLowerCase().includes("role")) {
      // Contrainte legacy : PARTICULIER / apprenant
      for (const role of ["apprenant", "PARTICULIER", "particulier"] as const) {
        const { error: retryError } = await supabase
          .from("profiles")
          .upsert({ ...basePayload, role }, { onConflict: "id" });
        if (!retryError) break;
        if (role === "particulier") {
          return { ok: false, error: retryError.message };
        }
      }
    } else {
      return { ok: false, error: message };
    }
  }

  const objectif = input.objectif?.trim();
  if (objectif) {
    const { error: objectifError } = await supabase
      .from("profiles")
      .update({ type_profil: objectif })
      .eq("id", input.userId);

    if (objectifError?.message?.includes("type_profil")) {
      console.warn(
        "[upsertParticulierProfile] type_profil column missing — objectif conservé dans user_metadata uniquement.",
      );
    } else if (objectifError) {
      console.warn("[upsertParticulierProfile] type_profil update:", objectifError.message);
    }
  }

  return { ok: true };
}
