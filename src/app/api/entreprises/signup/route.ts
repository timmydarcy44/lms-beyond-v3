import { NextRequest, NextResponse } from "next/server";
import { getEntrepriseSignupConfirmationEmail } from "@/lib/emails/templates/entreprise-signup-confirmation";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { provisionEntrepriseSignup } from "@/lib/entreprise/provision-entreprise-signup";
import {
  entrepriseSetPasswordUrl,
  resolveEntrepriseAppOrigin,
} from "@/lib/entreprise/signup-redirect";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = String(body?.first_name || "").trim();
    const lastName = String(body?.last_name || "").trim();
    const companyName = String(body?.company_name || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    if (!firstName || !lastName || !email || !companyName) {
      return NextResponse.json(
        { error: "Prénom, nom, nom d'entreprise et email sont requis." },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible." }, { status: 500 });
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email." },
        { status: 409 },
      );
    }

    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find((u) => u.email?.toLowerCase() === email);

    if (existingAuthUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email." },
        { status: 409 },
      );
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        company_name: companyName,
        role_type: "entreprise",
        account_type: "entreprise",
        signup_source: "edge_entreprises",
        trial_ends_at: trialEndsAt.toISOString(),
        origin: "edge",
        needs_password_setup: true,
      },
    });

    if (authError || !authData.user) {
      console.error("[entreprises/signup] createUser error:", authError);
      const message = authError?.message || "Erreur lors de la création du compte.";
      if (message.toLowerCase().includes("already") || (authError as { code?: string })?.code === "email_exists") {
        return NextResponse.json(
          { error: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const userId = authData.user.id;
    const origin = resolveEntrepriseAppOrigin(request);
    const redirectTo = entrepriseSetPasswordUrl(origin);

    const provision = await provisionEntrepriseSignup(supabase, {
      userId,
      email,
      firstName,
      lastName,
      companyName,
    });

    if (!provision.ok) {
      console.error("[entreprises/signup] provision error:", provision.error);
      return NextResponse.json({ error: provision.error }, { status: 500 });
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("[entreprises/signup] generateLink error:", linkError);
      return NextResponse.json(
        { error: "Compte créé, mais le lien de confirmation n'a pas pu être généré. Contactez le support." },
        { status: 500 },
      );
    }

    const template = getEntrepriseSignupConfirmationEmail({
      firstName,
      companyName,
      confirmationLink: linkData.properties.action_link,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      from: EDGE_COCKPIT_FROM,
    });

    if (!emailResult.success) {
      console.error("[entreprises/signup] resend error:", emailResult.error);
      return NextResponse.json(
        {
          success: true,
          warning: true,
          userId,
          trialEndsAt: provision.trialEndsAt,
          message:
            "Votre compte a été créé, mais l'email de confirmation n'a pas pu être envoyé. Contactez le support.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      success: true,
      needsEmailConfirmation: true,
      userId,
      trialEndsAt: provision.trialEndsAt,
      message:
        "Inscription enregistrée. Consultez votre boîte mail pour confirmer votre compte et créer votre mot de passe.",
    });
  } catch (error) {
    console.error("[entreprises/signup] unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
