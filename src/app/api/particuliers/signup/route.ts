import { NextRequest, NextResponse } from "next/server";
import { sendParticulierConfirmationLink } from "@/lib/particuliers/send-confirmation-link";
import { upsertParticulierProfile } from "@/lib/particuliers/upsert-particulier-profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = String(body?.first_name || "").trim();
    const lastName = String(body?.last_name || "").trim();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const objectif = String(body?.objectif || "").trim();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Prénom, nom et email sont requis." }, { status: 400 });
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
        {
          error: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.",
        },
        { status: 409 },
      );
    }

    const { data: usersList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = usersList?.users?.find((u) => u.email?.toLowerCase() === email);

    if (existingAuthUser) {
      return NextResponse.json(
        {
          error: "Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.",
        },
        { status: 409 },
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        role_type: "particulier",
        type_profil: objectif || null,
        signup_source: "edge_particuliers",
        origin: "edge",
        needs_password_setup: true,
      },
    });

    if (authError || !authData.user) {
      console.error("[particuliers/signup] createUser error:", authError);
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

    const profileResult = await upsertParticulierProfile(supabase, {
      userId,
      email,
      firstName,
      lastName,
      objectif: objectif || null,
    });

    if (!profileResult.ok) {
      console.error("[particuliers/signup] profile error:", profileResult.error);
      return NextResponse.json({ error: profileResult.error }, { status: 500 });
    }

    const publicSlug = slugify(`${firstName} ${lastName}` || email.split("@")[0] || userId);
    await supabase
      .from("user_profile_settings")
      .upsert({ user_id: userId, public_slug: publicSlug }, { onConflict: "user_id" });

    const emailResult = await sendParticulierConfirmationLink(supabase, request, email);

    if (!emailResult.ok) {
      console.error("[particuliers/signup] confirmation email error:", emailResult.error);
      if (emailResult.status >= 500) {
        return NextResponse.json(
          {
            success: true,
            warning: true,
            userId,
            message:
              "Votre compte a été créé, mais l'email de confirmation n'a pas pu être envoyé. Contactez le support.",
            emailError: emailResult.error,
          },
          { status: 200 },
        );
      }
      return NextResponse.json({ error: emailResult.error }, { status: emailResult.status });
    }

    return NextResponse.json({
      success: true,
      needsEmailConfirmation: true,
      userId,
      message:
        "Inscription enregistrée. Consultez votre boîte mail pour confirmer votre compte et créer votre mot de passe.",
    });
  } catch (error) {
    console.error("[particuliers/signup] unexpected error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
