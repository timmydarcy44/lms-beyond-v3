import type { SupabaseClient } from "@supabase/supabase-js";
import { generateOrgSlug } from "@/lib/onboarding/slug";

export type EntrepriseSignupInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

export type EntrepriseSignupResult =
  | { ok: true; organizationId: string; trialEndsAt: string }
  | { ok: false; error: string };

function addTrialDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function provisionEntrepriseSignup(
  supabase: SupabaseClient,
  input: EntrepriseSignupInput,
): Promise<EntrepriseSignupResult> {
  const fullName = `${input.firstName} ${input.lastName}`.trim();
  const orgName = input.companyName.trim() || fullName || "Mon entreprise";
  const slug = generateOrgSlug(orgName);
  const trialEndsAt = addTrialDays(30);

  let organizationId: string | null = null;

  const orgInsert = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      onboarding_step: "account_activated",
    })
    .select("id")
    .single();

  if (orgInsert.data?.id) {
    organizationId = orgInsert.data.id as string;
  } else {
    const fallback = await supabase.from("organizations").insert({ name: orgName, slug }).select("id").single();
    if (!fallback.data?.id) {
      return { ok: false, error: orgInsert.error?.message ?? fallback.error?.message ?? "Impossible de créer l'organisation" };
    }
    organizationId = fallback.data.id as string;
  }

  const profilePayload = {
    id: input.userId,
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
    full_name: fullName,
    role: "admin",
    role_type: "admin_hr",
    company_id: organizationId,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    const reduced = {
      id: input.userId,
      email: input.email,
      full_name: fullName,
      role: "admin",
    };
    const { error: reducedError } = await supabase.from("profiles").upsert(reduced, { onConflict: "id" });
    if (reducedError) {
      return { ok: false, error: profileError.message ?? reducedError.message };
    }

    await supabase
      .from("profiles")
      .update({ role_type: "admin_hr", company_id: organizationId, first_name: input.firstName, last_name: input.lastName })
      .eq("id", input.userId);
  }

  const membership = await supabase.from("org_memberships").upsert(
    { org_id: organizationId, user_id: input.userId, role: "admin" },
    { onConflict: "org_id,user_id" },
  );

  if (membership.error) {
    console.warn("[provisionEntrepriseSignup] org_memberships:", membership.error.message);
  }

  return { ok: true, organizationId, trialEndsAt };
}
