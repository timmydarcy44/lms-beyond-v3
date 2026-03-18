import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const isNevo = siteUrl.includes("nevo");
    const redirectTo = isNevo
      ? "https://www.nevo-app.fr/app-landing/complete-profile"
      : `${siteUrl}/auth/callback`;

    if (!email || !password) {
      return NextResponse.json(
        { user: null, session: null, error: "Email et mot de passe requis" },
        { status: 400 },
      );
    }

    const supabase = await getServerClient();

    if (!supabase) {
      console.error("[api/auth/signup] Failed to get Supabase client");
      return NextResponse.json(
        { user: null, session: null, error: "Configuration Supabase manquante" },
        { status: 500 },
      );
    }

    const nameParts = typeof fullName === "string" ? fullName.trim().split(/\s+/) : [];
    const first_name = nameParts.shift() || "";
    const last_name = nameParts.join(" ") || "";

    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo,
        data: {
          full_name: typeof fullName === "string" ? fullName : "",
          first_name,
          last_name,
        },
      },
    });

    if (signUpResult.error) {
      console.error("[api/auth/signup] Auth error:", signUpResult.error);
      return NextResponse.json(
        { user: null, session: null, error: signUpResult.error.message },
        { status: 400 },
      );
    }

    if (signUpResult.data?.session && signUpResult.data.user) {
      await supabase.from("profiles").upsert(
        {
          id: signUpResult.data.user.id,
          email,
          full_name: typeof fullName === "string" ? fullName : "",
          first_name,
          last_name,
        },
        { onConflict: "id" }
      );
      return NextResponse.json({
        user: signUpResult.data.user,
        session: signUpResult.data.session,
        error: null,
      });
    }

    if (signUpResult.data?.user && !signUpResult.data.session) {
      await supabase.from("profiles").upsert(
        {
          id: signUpResult.data.user.id,
          email,
          full_name: typeof fullName === "string" ? fullName : "",
          first_name,
          last_name,
        },
        { onConflict: "id" }
      );
      return NextResponse.json({
        user: signUpResult.data.user,
        session: null,
        error: null,
        needsEmailConfirmation: true,
      });
    }
  } catch (error) {
    console.error("[api/auth/signup] Unexpected error:", error);
    return NextResponse.json(
      {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : "Erreur inattendue",
      },
      { status: 500 },
    );
  }
}

