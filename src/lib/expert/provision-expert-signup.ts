import type { SupabaseClient } from "@supabase/supabase-js";

type ProvisionInput = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
};

export async function provisionExpertSignup(
  supabase: SupabaseClient,
  input: ProvisionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const profilePayload: Record<string, unknown> = {
    id: input.userId,
    email: input.email,
    role: "expert",
    full_name: fullName || null,
  };

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    const minimal = await supabase
      .from("profiles")
      .upsert({ id: input.userId, email: input.email, role: "expert" }, { onConflict: "id" });
    if (minimal.error) {
      console.warn("[provisionExpertSignup] profiles upsert:", profileError, minimal.error);
      return { ok: false, error: profileError.message || minimal.error.message };
    }
  }

  return { ok: true };
}
