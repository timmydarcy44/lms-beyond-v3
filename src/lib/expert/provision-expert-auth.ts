import type { SupabaseClient } from "@supabase/supabase-js";
import { logExpertRegisterError, logExpertRegisterWarn } from "@/lib/expert/register-log";
import { resolveAuthUserIdByEmail } from "@/lib/expert/resolve-auth-user";

export type ProvisionExpertAuthResult =
  | { ok: true; userId: string; isNewAuthUser: boolean; inviteSent: boolean }
  | { ok: false; error: string };

function isEmailAlreadyRegistered(message?: string): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("user already exists") ||
    m.includes("email address has already been registered")
  );
}

function isRateLimitError(message?: string, code?: string): boolean {
  if (code === "over_email_send_rate_limit") return true;
  return (message ?? "").toLowerCase().includes("rate limit");
}

const expertUserMetadata = (firstName: string, lastName: string) => ({
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`.trim(),
  role_type: "expert",
  account_type: "expert",
  signup_source: "edge_expert",
  origin: "edge",
  needs_password_setup: true,
});

export async function provisionExpertAuthUser(
  supabase: SupabaseClient,
  params: { email: string; firstName: string; lastName: string; redirectTo: string },
): Promise<ProvisionExpertAuthResult> {
  const { email, firstName, lastName, redirectTo } = params;
  const meta = expertUserMetadata(firstName, lastName);

  const existingAuthUserId = await resolveAuthUserIdByEmail(supabase, email);
  if (existingAuthUserId) {
    const { error: updateMetaError } = await supabase.auth.admin.updateUserById(existingAuthUserId, {
      user_metadata: meta,
    });
    if (updateMetaError) {
      logExpertRegisterWarn("updateUserById", updateMetaError.message, { userId: existingAuthUserId });
    }
    return { ok: true, userId: existingAuthUserId, isNewAuthUser: false, inviteSent: false };
  }

  // createUser n'envoie pas d'email Supabase — l'email EDGE part via Resend + generateLink.
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: meta,
  });

  if (!createError && created?.user?.id) {
    return { ok: true, userId: created.user.id, isNewAuthUser: true, inviteSent: false };
  }

  if (createError) {
    logExpertRegisterError("createUser", createError, { emailDomain: email.split("@")[1] });
    if (isEmailAlreadyRegistered(createError.message)) {
      const existing = await resolveAuthUserIdByEmail(supabase, email);
      if (existing) {
        return { ok: true, userId: existing, isNewAuthUser: false, inviteSent: false };
      }
    }
  }

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: meta,
    redirectTo,
  });

  if (!inviteError && inviteData?.user?.id) {
    return { ok: true, userId: inviteData.user.id, isNewAuthUser: true, inviteSent: true };
  }

  if (inviteError) {
    logExpertRegisterError("inviteUserByEmail", inviteError, { emailDomain: email.split("@")[1] });
    if (isRateLimitError(inviteError.message, inviteError.code)) {
      const afterRateLimit = await resolveAuthUserIdByEmail(supabase, email);
      if (afterRateLimit) {
        return { ok: true, userId: afterRateLimit, isNewAuthUser: false, inviteSent: false };
      }
    }
    if (isEmailAlreadyRegistered(inviteError.message)) {
      const existing = await resolveAuthUserIdByEmail(supabase, email);
      if (existing) {
        return { ok: true, userId: existing, isNewAuthUser: false, inviteSent: false };
      }
    }
  }

  const finalLookup = await resolveAuthUserIdByEmail(supabase, email);
  if (finalLookup) {
    return { ok: true, userId: finalLookup, isNewAuthUser: false, inviteSent: false };
  }

  return {
    ok: false,
    error: createError?.message ?? inviteError?.message ?? "auth_provision_failed",
  };
}
