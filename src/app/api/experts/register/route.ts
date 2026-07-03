import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getExpertRegistrationConfirmationEmail } from "@/lib/emails/templates/expert-registration-confirmation";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { EXPERT_REGISTER_GENERIC_ERROR } from "@/lib/expert/register-errors";
import { logExpertRegisterError, logExpertRegisterInfo, logExpertRegisterWarn } from "@/lib/expert/register-log";
import { provisionExpertAuthUser } from "@/lib/expert/provision-expert-auth";
import { provisionExpertSignup } from "@/lib/expert/provision-expert-signup";
import { expertSetPasswordUrl, resolveExpertAppOrigin } from "@/lib/expert/signup-redirect";
import { upsertExpertRegistration } from "@/lib/expert/upsert-expert-registration";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

async function generatePasswordSetupLink(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  email: string,
  redirectTo: string,
  preferRecovery: boolean,
): Promise<string | null> {
  const types = preferRecovery
    ? (["recovery", "magiclink", "invite", "signup"] as const)
    : (["signup", "invite", "magiclink", "recovery"] as const);

  for (const type of types) {
    const { data, error } = await supabase.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo },
    });
    if (!error && data?.properties?.action_link) {
      logExpertRegisterInfo("generateLink_ok", { type });
      return data.properties.action_link;
    }
    logExpertRegisterWarn("generateLink", error?.message ?? "no_action_link", { type });
  }
  return null;
}

function envDiagnostics(): Record<string, boolean> {
  return {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasPublicUrl: Boolean(
      process.env.NEXT_PUBLIC_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL,
    ),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      logExpertRegisterError("config", "SUPABASE_SERVICE_ROLE_KEY missing", envDiagnostics());
      return NextResponse.json({ error: EXPERT_REGISTER_GENERIC_ERROR }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const data = body ?? {};

    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const firstName = typeof data.first_name === "string" ? data.first_name.trim() : "";
    const lastName = typeof data.last_name === "string" ? data.last_name.trim() : "";
    const headline = typeof data.headline === "string" ? data.headline.trim() : "";
    const photoUrl = typeof data.photo_url === "string" ? data.photo_url.trim() : "";
    const linkedinUrl = typeof data.linkedin_url === "string" ? data.linkedin_url.trim() : "";
    const wantsCertification = Boolean(
      data.wants_certification ?? data.wantsCertification ?? data.wants_beyond_certified,
    );

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Prénom/Nom requis." }, { status: 400 });
    }

    logExpertRegisterInfo("start", { emailDomain: email.split("@")[1], env: envDiagnostics() });

    const { data: existingExpert, error: existingExpertError } = await supabase
      .from("experts")
      .select("id, review_status, is_active")
      .eq("email", email)
      .maybeSingle();

    if (existingExpertError) {
      logExpertRegisterError("experts_lookup", existingExpertError);
    }

    if (existingExpert?.review_status === "approved" && existingExpert.is_active === true) {
      return NextResponse.json(
        { error: "Un profil expert validé existe déjà avec cet email. Connectez-vous à votre espace." },
        { status: 409 },
      );
    }

    const specialties = asStringArray(data.specialties);
    const formatsSupported = asStringArray(data.formats_supported);
    const audiences = asStringArray(data.audiences);
    const languages = asStringArray(data.languages);
    const primaryDomain = typeof data.primary_domain === "string" ? data.primary_domain.trim() : "";
    const secondaryDomains = asStringArray(data.secondary_domains) ?? [];
    const domains = asStringArray(data.domains) ?? (primaryDomain ? [primaryDomain, ...secondaryDomains] : []);
    const yearsExperience = typeof data.years_experience === "string" ? data.years_experience.trim() : "";

    const geographicZones =
      asStringArray(data.geographic_zones) ??
      (typeof data.geographic_zone === "string" && data.geographic_zone.trim()
        ? [data.geographic_zone.trim()]
        : []);

    const availabilities =
      asStringArray(data.availabilities) ??
      (typeof data.availability === "string" && data.availability.trim() ? [data.availability.trim()] : []);

    const registrationMeta = [
      {
        _type: "edge_registration_meta",
        status_label: "En attente de validation",
        primary_domain: primaryDomain || null,
        secondary_domains: secondaryDomains,
        domains,
        audiences: audiences ?? [],
        years_experience: yearsExperience || null,
        geographic_zones: geographicZones,
        languages: languages ?? [],
        availabilities,
        photo_url: photoUrl || null,
        linkedin_url: linkedinUrl || null,
      },
    ];

    const origin = resolveExpertAppOrigin(request);
    const redirectTo = expertSetPasswordUrl(origin);
    logExpertRegisterInfo("redirectTo", { origin, redirectTo });

    const authResult = await provisionExpertAuthUser(supabase, {
      email,
      firstName,
      lastName,
      redirectTo,
    });

    if (!authResult.ok) {
      logExpertRegisterError("auth_provision", authResult.error, envDiagnostics());
      return NextResponse.json({ error: EXPERT_REGISTER_GENERIC_ERROR }, { status: 500 });
    }

    const { userId, isNewAuthUser, inviteSent } = authResult;

    const provision = await provisionExpertSignup(supabase, { userId, email, firstName, lastName });
    if (!provision.ok) {
      logExpertRegisterError("profiles_provision", provision.error);
      return NextResponse.json({ error: EXPERT_REGISTER_GENERIC_ERROR }, { status: 500 });
    }

    const expertUpsert = await upsertExpertRegistration(supabase, {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      headline: headline || null,
      is_active: false,
      specialties,
      formats_supported: formatsSupported,
      review_status: "pending_review",
      wants_certification: wantsCertification,
      linkedin_url: linkedinUrl || null,
      references: registrationMeta,
    });

    if (!expertUpsert.ok) {
      logExpertRegisterError("experts_provision", expertUpsert.error, envDiagnostics());
      return NextResponse.json({ error: EXPERT_REGISTER_GENERIC_ERROR }, { status: 500 });
    }

    revalidatePath("/dashboard/expert");
    revalidatePath("/admin/experts");

    logExpertRegisterInfo("profile_created", { userId, isNewAuthUser, inviteSent });

    const passwordSetupLink = await generatePasswordSetupLink(supabase, email, redirectTo, !isNewAuthUser);

    if (!passwordSetupLink && !inviteSent) {
      logExpertRegisterError("password_link", "generateLink_exhausted", { redirectTo });
      return NextResponse.json({
        success: true,
        warning: true,
        review_status: "pending_review",
        isNewAuthUser,
        message:
          "Profil créé, mais l'email d'accès n'a pas pu être envoyé. Contactez le support EDGE pour recevoir votre lien.",
      });
    }

    if (!passwordSetupLink && inviteSent) {
      return NextResponse.json({
        success: true,
        review_status: "pending_review",
        isNewAuthUser,
        message:
          "Profil enregistré. Consultez votre boîte mail pour créer votre mot de passe (invitation Supabase).",
      });
    }

    const template = getExpertRegistrationConfirmationEmail({
      firstName,
      passwordSetupLink: passwordSetupLink!,
    });
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      from: EDGE_COCKPIT_FROM,
    });

    if (!emailResult.success) {
      logExpertRegisterError("resend", emailResult.error ?? "send_failed", envDiagnostics());
      return NextResponse.json({
        success: true,
        warning: true,
        review_status: "pending_review",
        isNewAuthUser,
        message:
          "Profil créé, mais l'email d'accès n'a pas pu être envoyé. Contactez le support EDGE pour recevoir votre lien.",
      });
    }

    return NextResponse.json({
      success: true,
      review_status: "pending_review",
      isNewAuthUser,
      message: "Profil enregistré. Consultez votre boîte mail pour créer votre mot de passe.",
    });
  } catch (error: unknown) {
    logExpertRegisterError("unhandled", error, envDiagnostics());
    return NextResponse.json({ error: EXPERT_REGISTER_GENERIC_ERROR }, { status: 500 });
  }
}
