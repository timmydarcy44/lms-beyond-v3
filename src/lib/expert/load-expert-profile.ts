import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ExpertAccessRow } from "@/lib/expert/expert-access";
import {
  EXPERT_PROFILE_SELECT_TIERS,
  isMissingColumnError,
} from "@/lib/expert/expert-profile-select";
import { getServiceRoleClient } from "@/lib/supabase/server";

async function selectExpertRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: ExpertAccessRow | null; error: { code?: string; message?: string } | null }> {
  for (const select of EXPERT_PROFILE_SELECT_TIERS) {
    const { data, error } = await supabase.from("experts").select(select).eq("id", userId).maybeSingle();
    if (!error) return { data: data as ExpertAccessRow | null, error: null };
    if (!isMissingColumnError(error)) return { data: null, error };
  }
  return { data: null, error: { message: "experts_select_failed" } };
}

function buildBootstrapRow(userId: string, user: User | null): Record<string, unknown> {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const email = (user?.email ?? "").trim().toLowerCase();
  const firstName =
    typeof meta.first_name === "string"
      ? meta.first_name.trim()
      : typeof meta.given_name === "string"
        ? meta.given_name.trim()
        : "";
  const lastName =
    typeof meta.last_name === "string"
      ? meta.last_name.trim()
      : typeof meta.family_name === "string"
        ? meta.family_name.trim()
        : "";

  return {
    id: userId,
    email: email || null,
    first_name: firstName || null,
    last_name: lastName || null,
    is_active: false,
    review_status: "pending_review",
    registration_step: 0,
    references: [
      {
        _type: "edge_registration_meta",
        status_label: "En attente de validation",
        domains: [],
        audiences: [],
        geographic_zones: [],
        languages: [],
        availabilities: [],
      },
    ],
  };
}

async function bootstrapExpertRow(userId: string, user: User | null): Promise<ExpertAccessRow | null> {
  const service = getServiceRoleClient();
  if (!service) return null;

  const payload = buildBootstrapRow(userId, user);
  const { error } = await service.from("experts").upsert(payload, { onConflict: "id" });
  if (error) {
    const minimal = await service.from("experts").upsert(
      {
        id: userId,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
      },
      { onConflict: "id" },
    );
    if (minimal.error) return null;
  }

  const { data } = await selectExpertRow(service, userId);
  return data;
}

/** Charge le profil expert ou le crée automatiquement — l'utilisateur ne doit jamais voir d'erreur fatale. */
export async function loadOrCreateExpertProfile(
  supabase: SupabaseClient,
  userId: string,
  user: User | null,
): Promise<ExpertAccessRow | null> {
  const first = await selectExpertRow(supabase, userId);
  if (first.data) return first.data;

  const bootstrapped = await bootstrapExpertRow(userId, user);
  if (!bootstrapped) return null;

  const retry = await selectExpertRow(supabase, userId);
  return retry.data ?? bootstrapped;
}
