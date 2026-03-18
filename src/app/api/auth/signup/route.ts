import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();
    const emailRedirectTo = "https://www.nevo-app.fr/note-app";

    if (!email) {
      return NextResponse.json(
        { user: null, session: null, error: "Email requis" },
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

    const otpResult = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        data: {
          origin: "nevo",
        },
      },
    });

    if (otpResult.error) {
      console.error("[api/auth/signup] Auth error:", otpResult.error);
      return NextResponse.json(
        { user: null, session: null, error: otpResult.error.message },
        { status: 400 },
      );
    }

    if (otpResult.data?.user) {
      await supabase.from("profiles").upsert(
        {
          id: otpResult.data.user.id,
          email,
          full_name: typeof fullName === "string" ? fullName : "",
          first_name,
          last_name,
        },
        { onConflict: "id" }
      );
    }

    return NextResponse.json({
      user: otpResult.data?.user || null,
      session: null,
      error: null,
      needsEmailConfirmation: true,
    });
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

