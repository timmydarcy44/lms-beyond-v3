import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailOtpType } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { getEntrepriseOtpEmail } from "@/lib/emails/templates/entreprise-otp";
import { generateOrgSlug } from "@/lib/onboarding/slug";
import { ENTREPRISE_NEXT_PATH } from "@/lib/entreprise/signup-redirect";
import { grantUserRole } from "@/lib/auth/user-roles";
import { afterSuccessfulAuth } from "@/lib/cfa/sync-tutor-assignment";

const HOUR_MS = 60 * 60 * 1000;
const RESEND_GAP_MS = 60 * 1000;
const CODE_TTL_MS = 10 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

export type SignupCodeMode = "signup" | "login";

type OpenRequest = {
  id: string;
  last_sent_at: string | null;
  sent_at: string[] | null;
  locked_until: string | null;
  attempts: number | null;
  expires_at: string;
  otp_type: string | null;
  mode: SignupCodeMode;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  verified_at: string | null;
};

export function secondsUntilResend(lastSentAt: string | null, now = Date.now()): number {
  if (!lastSentAt) return 0;
  const elapsed = now - new Date(lastSentAt).getTime();
  if (Number.isNaN(elapsed) || elapsed >= RESEND_GAP_MS) return 0;
  return Math.ceil((RESEND_GAP_MS - elapsed) / 1000);
}

export function sendsInLastHour(stamps: string[] | null | undefined, now = Date.now()): number {
  const from = now - HOUR_MS;
  return (stamps ?? []).filter((stamp) => {
    const time = new Date(stamp).getTime();
    return !Number.isNaN(time) && time >= from;
  }).length;
}

function recentStamps(stamps: string[] | null | undefined, now = Date.now()): string[] {
  const from = now - HOUR_MS;
  return (stamps ?? []).filter((stamp) => new Date(stamp).getTime() >= from);
}

export async function purgeOldSignupRequests(db: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * HOUR_MS).toISOString();
  await db.from("signup_requests").delete().is("verified_at", null).lt("created_at", cutoff);
}

async function latestOpenRequest(db: SupabaseClient, email: string): Promise<OpenRequest | null> {
  const { data, error } = await db
    .from("signup_requests")
    .select("id, last_sent_at, sent_at, locked_until, attempts, expires_at, otp_type, mode, user_id, first_name, last_name, company, verified_at")
    .eq("email", email)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OpenRequest | null) ?? null;
}

export async function issueEntrepriseCode(
  db: SupabaseClient,
  input: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    mode: SignupCodeMode;
    redirectTo: string;
  },
): Promise<{ ok: true; digits: number } | { ok: false; status: number; error: string; retryAfter?: number }> {
  await purgeOldSignupRequests(db);
  const open = await latestOpenRequest(db, input.email);
  const now = Date.now();
  if (open?.locked_until && new Date(open.locked_until).getTime() > now) {
    return { ok: false, status: 429, error: "Trop de tentatives. Réessayez dans 10 minutes." };
  }
  const wait = secondsUntilResend(open?.last_sent_at ?? null, now);
  if (wait > 0) {
    return { ok: false, status: 429, error: "Patientez avant de renvoyer un code.", retryAfter: wait };
  }
  const stamps = recentStamps(open?.sent_at, now);
  if (stamps.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, status: 429, error: "Trop d'envois. Réessayez dans une heure." };
  }

  const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: { redirectTo: input.redirectTo },
  });
  const otp = linkData?.properties?.email_otp?.trim();
  if (linkError || !otp) {
    console.error("[entreprise-code] generateLink:", linkError?.message ?? "email_otp absent");
    return { ok: false, status: 500, error: "Le code n'a pas pu être préparé." };
  }

  const template = getEntrepriseOtpEmail(otp);
  const sent = await sendEmail({
    to: input.email,
    subject: template.subject,
    html: template.html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
  });
  if (!sent.success) {
    console.error("[entreprise-code] resend:", sent.error);
    return { ok: false, status: 500, error: "L'email n'a pas pu être envoyé." };
  }

  const otpType = linkData.properties?.verification_type === "signup" ? "signup" : "magiclink";
  const payload = {
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
    company: input.company,
    expires_at: new Date(now + CODE_TTL_MS).toISOString(),
    last_sent_at: new Date(now).toISOString(),
    sent_at: [...stamps, new Date(now).toISOString()],
    otp_type: otpType,
    mode: input.mode,
    user_id: linkData.user?.id ?? null,
    attempts: 0,
    locked_until: null,
  };

  const write = open
    ? await db.from("signup_requests").update(payload).eq("id", open.id)
    : await db.from("signup_requests").insert(payload);
  if (write.error) {
    console.error("[entreprise-code] signup_requests:", write.error.message);
    return { ok: false, status: 503, error: "La demande de code n'a pas pu être enregistrée." };
  }
  return { ok: true, digits: otp.replace(/\D/g, "").length || 8 };
}

export type LoginHint = "unknown" | "otp" | "password";

export async function readLoginHint(db: SupabaseClient, email: string): Promise<LoginHint | null> {
  const { data, error } = await db.rpc("entreprise_login_hint", { p_email: email });
  if (error) {
    console.error("[entreprise-code] entreprise_login_hint:", error.message);
    return null;
  }
  if (data === "password" || data === "otp" || data === "unknown") return data;
  return null;
}

export async function ensureEntrepriseUser(
  db: SupabaseClient,
  input: { email: string; firstName: string; lastName: string; company: string; siret?: string },
): Promise<{ ok: true; hint: LoginHint } | { ok: false; status: number; error: string }> {
  const hint = await readLoginHint(db, input.email);
  if (!hint) {
    return { ok: false, status: 503, error: "La vérification par code n'est pas encore activée." };
  }
  if (hint !== "unknown") return { ok: true, hint };

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email: input.email,
    email_confirm: false,
    user_metadata: {
      first_name: input.firstName,
      last_name: input.lastName,
      full_name: `${input.firstName} ${input.lastName}`.trim(),
      company_name: input.company,
      ...(input.siret ? { siret: input.siret } : {}),
      role_type: "entreprise",
      account_type: "entreprise",
      signup_source: "edge_entreprises",
      trial_ends_at: trialEndsAt.toISOString(),
      origin: "edge",
      needs_password_setup: true,
    },
  });
  if (authData.user?.id) return { ok: true, hint: "unknown" };
  const message = authError?.message ?? "";
  if (message.toLowerCase().includes("already") || (authError as { code?: string } | null)?.code === "email_exists") {
    return { ok: true, hint: "otp" };
  }
  console.error("[entreprise-code] createUser:", message);
  return { ok: false, status: 500, error: "Le compte n'a pas pu être préparé." };
}

export async function verifyEntrepriseCode(
  sessionClient: SupabaseClient,
  db: SupabaseClient,
  email: string,
  token: string,
): Promise<{ ok: true; destination: string } | { ok: false; status: number; error: string }> {
  const open = await latestOpenRequest(db, email);
  const now = Date.now();
  if (!open || new Date(open.expires_at).getTime() <= now) {
    return { ok: false, status: 400, error: "Code incorrect ou expiré." };
  }
  if (open.locked_until && new Date(open.locked_until).getTime() > now) {
    return { ok: false, status: 429, error: "Trop de tentatives. Réessayez dans 10 minutes." };
  }
  if ((open.attempts ?? 0) >= MAX_ATTEMPTS) {
    await db
      .from("signup_requests")
      .update({ locked_until: new Date(now + LOCK_MS).toISOString() })
      .eq("id", open.id);
    return { ok: false, status: 429, error: "Trop de tentatives. Réessayez dans 10 minutes." };
  }

  const primary: EmailOtpType = open.otp_type === "signup" ? "signup" : "magiclink";
  let verified = await sessionClient.auth.verifyOtp({ email, token, type: primary });
  if (verified.error && primary !== "email") {
    const fallback = await sessionClient.auth.verifyOtp({ email, token, type: "email" });
    if (!fallback.error) verified = fallback;
  }
  if (verified.error || !verified.data.user) {
    const attempts = (open.attempts ?? 0) + 1;
    await db
      .from("signup_requests")
      .update({
        attempts,
        locked_until: attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MS).toISOString() : null,
      })
      .eq("id", open.id);
    return {
      ok: false,
      status: attempts >= MAX_ATTEMPTS ? 429 : 400,
      error: attempts >= MAX_ATTEMPTS ? "Trop de tentatives. Réessayez dans 10 minutes." : "Code incorrect ou expiré.",
    };
  }

  const userId = verified.data.user.id;
  const activated = await afterSuccessfulAuth(db, { userId, email: verified.data.user.email || email });
  if (open.company === "context:tuteur" || (activated.activatedTutor && open.mode !== "signup")) {
    await db.from("signup_requests").update({ verified_at: new Date().toISOString() }).eq("id", open.id);
    return { ok: true, destination: "/dashboard/tuteur" };
  }
  if (open.company === "context:apprenant") {
    await grantUserRole(db, userId, "apprenant");
    await db.from("signup_requests").update({ verified_at: new Date().toISOString() }).eq("id", open.id);
    return { ok: true, destination: "/dashboard/apprenant" };
  }
  if (open.mode === "signup") {
    const { data: profile } = await db.from("profiles").select("company_id").eq("id", userId).maybeSingle();
    if (!profile?.company_id) {
      const slug = generateOrgSlug(open.company || "entreprise");
      const { error } = await db.rpc("complete_entreprise_signup", {
        p_request_id: open.id,
        p_user_id: userId,
        p_email: email,
        p_first_name: open.first_name ?? "",
        p_last_name: open.last_name ?? "",
        p_company: open.company || "Mon entreprise",
        p_slug: slug,
      });
      if (error) {
        console.error("[entreprise-code] complete_entreprise_signup:", error.message);
        return { ok: false, status: 500, error: "Le code est bon, mais l'espace n'a pas pu être créé." };
      }
      const created = await db.auth.admin.getUserById(userId);
      const siret = String(created.data.user?.user_metadata?.siret ?? "").replace(/\s/g, "");
      if (/^\d{14}$/.test(siret)) {
        const linked = await db.from("profiles").select("company_id").eq("id", userId).maybeSingle();
        const organizationId = String((linked.data as { company_id?: string | null } | null)?.company_id ?? "");
        if (organizationId) {
          await db.from("organizations").update({ siret }).eq("id", organizationId);
        }
      }
    } else {
      await db.from("signup_requests").update({ verified_at: new Date().toISOString() }).eq("id", open.id);
    }
    return { ok: true, destination: ENTREPRISE_NEXT_PATH };
  }

  await db.from("signup_requests").update({ verified_at: new Date().toISOString() }).eq("id", open.id);
  return { ok: true, destination: ENTREPRISE_NEXT_PATH };
}
