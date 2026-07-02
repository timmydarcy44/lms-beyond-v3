import { NextRequest, NextResponse } from "next/server";
import { getExpertRegistrationConfirmationEmail } from "@/lib/emails/templates/expert-registration-confirmation";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { provisionExpertSignup } from "@/lib/expert/provision-expert-signup";
import { expertSetPasswordUrl, resolveExpertAppOrigin } from "@/lib/expert/signup-redirect";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

async function generatePasswordSetupLink(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  email: string,
  redirectTo: string,
): Promise<string | null> {
  const attempts: Array<"signup" | "magiclink"> = ["signup", "magiclink"];
  for (const type of attempts) {
    const { data, error } = await supabase.auth.admin.generateLink({
      type,
      email,
      options: { redirectTo },
    });
    if (!error && data?.properties?.action_link) {
      return data.properties.action_link;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    const data = body ?? {};

    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const firstName = typeof data.first_name === "string" ? data.first_name.trim() : "";
    const lastName = typeof data.last_name === "string" ? data.last_name.trim() : "";
    const headline = typeof data.headline === "string" ? data.headline.trim() : "";
    const photoUrl = typeof data.photo_url === "string" ? data.photo_url.trim() : "";
    const linkedinUrl = typeof data.linkedin_url === "string" ? data.linkedin_url.trim() : "";
    const wantsCertification = Boolean(data.wants_certification ?? data.wantsCertification ?? data.wants_beyond_certified);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }
    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Prénom/Nom requis." }, { status: 400 });
    }

    const { data: existingExpert } = await supabase
      .from("experts")
      .select("id, review_status, is_active")
      .eq("email", email)
      .maybeSingle();

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
      (typeof data.availability === "string" && data.availability.trim()
        ? [data.availability.trim()]
        : []);

    const regions = asStringArray(data.regions) ?? (geographicZones.length > 0 ? geographicZones : null);

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
      },
    ];

    let userId: string | null = null;
    let isNewAuthUser = false;

    const { data: existingAuth, error: existingAuthError } = await supabase.auth.admin.getUserByEmail(email);

    if (existingAuth?.user?.id) {
      userId = existingAuth.user.id;
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          role_type: "expert",
          account_type: "expert",
          signup_source: "edge_expert",
          origin: "edge",
          needs_password_setup: true,
        },
      });
    } else {
      if (existingAuthError && !String(existingAuthError.message).toLowerCase().includes("not found")) {
        console.warn("[experts/register] getUserByEmail:", existingAuthError);
      }

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          role_type: "expert",
          account_type: "expert",
          signup_source: "edge_expert",
          origin: "edge",
          needs_password_setup: true,
        },
      });

      if (createError || !created?.user?.id) {
        console.error("[experts/register] createUser error:", createError);
        return NextResponse.json({ error: createError?.message || "Impossible de créer le compte." }, { status: 500 });
      }

      userId = created.user.id;
      isNewAuthUser = true;
    }

    if (!userId) {
      return NextResponse.json({ error: "Impossible de créer l'utilisateur Auth." }, { status: 500 });
    }

    const provision = await provisionExpertSignup(supabase, { userId, email, firstName, lastName });
    if (!provision.ok) {
      return NextResponse.json({ error: provision.error }, { status: 500 });
    }

    const expertPayload: Record<string, unknown> = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      headline: headline || null,
      photo_url: photoUrl || null,
      linkedin_url: linkedinUrl || null,
      is_active: false,
      specialties,
      formats_supported: formatsSupported,
      regions,
      review_status: "pending_review",
      wants_certification: wantsCertification,
      references: registrationMeta,
    };

    const { error: expertError } = await supabase.from("experts").upsert(expertPayload, { onConflict: "id" });
    if (expertError) {
      const { error: emailConflictError } = await supabase.from("experts").upsert(expertPayload, { onConflict: "email" });
      if (emailConflictError) throw emailConflictError;
    }

    const origin = resolveExpertAppOrigin(request);
    const redirectTo = expertSetPasswordUrl(origin);
    const passwordSetupLink = await generatePasswordSetupLink(supabase, email, redirectTo);

    if (!passwordSetupLink) {
      return NextResponse.json(
        { error: "Profil enregistré, mais le lien de création de mot de passe n'a pas pu être généré. Contactez le support." },
        { status: 500 },
      );
    }

    const template = getExpertRegistrationConfirmationEmail({ firstName, passwordSetupLink });
    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      from: EDGE_COCKPIT_FROM,
    });

    revalidatePath("/dashboard/expert");
    revalidatePath("/admin/experts");

    if (!emailResult.success) {
      console.warn("[experts/register] resend error:", emailResult.error);
      return NextResponse.json({
        success: true,
        warning: true,
        review_status: "pending_review",
        isNewAuthUser,
        message:
          "Votre profil a été enregistré, mais l'email n'a pas pu être envoyé. Contactez le support EDGE.",
      });
    }

    return NextResponse.json({
      success: true,
      review_status: "pending_review",
      isNewAuthUser,
      message: "Profil enregistré. Consultez votre boîte mail pour créer votre mot de passe.",
    });
  } catch (error: unknown) {
    const err = error as { message?: string; details?: string; hint?: string; code?: string };
    console.error("ERREUR API REGISTER:", error);
    return NextResponse.json(
      {
        error: err?.message || "Erreur serveur",
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
      },
      { status: 500 },
    );
  }
}
