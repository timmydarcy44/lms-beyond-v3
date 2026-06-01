import type { SupabaseClient } from "@supabase/supabase-js";

function splitName(full: string | null | undefined, email: string | null | undefined) {
  const parts = String(full ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return { prenom: parts[0], nom: parts.slice(1).join(" ") };
  if (parts.length === 1) return { prenom: parts[0], nom: "—" };
  const local = String(email ?? "praticien").split("@")[0] ?? "Praticien";
  return { prenom: local, nom: "BCT" };
}

export async function ensurePraticienForUser(
  service: SupabaseClient,
  userId: string,
): Promise<{ praticien: Record<string, unknown> | null; error?: string }> {
  const { data: existing, error: findErr } = await service
    .from("praticiens_bct")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (findErr) {
    return { praticien: null, error: findErr.message };
  }
  if (existing) return { praticien: existing as Record<string, unknown> };

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role, role_type")
    .eq("id", userId)
    .maybeSingle();

  const role = String(profile?.role ?? profile?.role_type ?? "").toLowerCase();
  if (role !== "praticien_bct" && role !== "praticien") {
    return {
      praticien: null,
      error: "Aucun profil praticien lié à votre compte. Contactez l'administrateur.",
    };
  }

  const { prenom, nom } = splitName(
    profile?.full_name as string | undefined,
    profile?.email as string | undefined,
  );

  const { data: created, error: insertErr } = await service
    .from("praticiens_bct")
    .insert({
      user_id: userId,
      prenom: (profile?.first_name as string) || prenom,
      nom: (profile?.last_name as string) || nom,
      tarif_session: 8000,
      duree_session: 60,
      bct_certified: true,
      status: "pending",
      visible_marketplace: false,
    })
    .select("*")
    .single();

  if (insertErr || !created) {
    return { praticien: null, error: insertErr?.message ?? "Création du profil praticien impossible" };
  }

  return { praticien: created as Record<string, unknown> };
}
