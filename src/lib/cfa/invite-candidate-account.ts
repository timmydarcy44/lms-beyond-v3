import type { SupabaseClient } from "@supabase/supabase-js";

import { grantUserRole } from "@/lib/auth/user-roles";
import { cfaCandidateSetPasswordRedirect } from "@/lib/cfa/dossier-url";

export async function inviteCfaCandidateAccount(
  db: SupabaseClient,
  input: { email: string; firstName: string; lastName: string; resumeToken: string },
): Promise<{ profileId: string | null; passwordSetupUrl: string | null }> {
  const email = input.email.trim().toLowerCase();
  const created = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: `${input.firstName} ${input.lastName}`.trim(),
      role_type: "apprenant",
      account_type: "apprenant",
      needs_password_setup: true,
      signup_source: "cfa_manual_candidate",
    },
  });
  let profileId = created.data.user?.id ?? null;
  if (profileId) {
    await grantUserRole(db, profileId, "apprenant");
  } else {
    const message = created.error?.message ?? "";
    const exists =
      message.toLowerCase().includes("already") ||
      (created.error as { code?: string } | null)?.code === "email_exists";
    if (!exists && created.error) {
      console.error("[cfa-invite] createUser", message);
    }
    const found = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    profileId = String((found.data as { id?: string } | null)?.id ?? "").trim() || null;
    if (profileId) await grantUserRole(db, profileId, "apprenant");
  }

  const redirectTo = cfaCandidateSetPasswordRedirect(input.resumeToken);
  const types = ["invite", "magiclink", "recovery", "signup"] as const;
  let passwordSetupUrl: string | null = null;
  for (const type of types) {
    const link = await db.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo },
    });
    const href = link.data?.properties?.action_link ?? null;
    if (!link.error && href) {
      passwordSetupUrl = href;
      break;
    }
  }
  return { profileId, passwordSetupUrl };
}
