import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const firstName = String(body?.first_name || "").trim();
    const lastName = String(body?.last_name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const objectif = String(body?.objectif || "").trim();
    const authUserId = String(body?.auth_user_id || "").trim();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Prénom, nom et email requis." }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
    }

    if (authUserId) {
      const { data: existingProfile, error: lookupError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();
      if (lookupError) {
        console.error("Erreur Supabase détaillée:", lookupError);
        return NextResponse.json({ error: lookupError.message }, { status: 500 });
      }
      if (existingProfile?.id && existingProfile.id !== authUserId) {
        return NextResponse.json(
          {
            error:
              "Ce mail est déjà utilisé dans Beyond. Utilise un autre email ou contacte le support.",
          },
          { status: 409 }
        );
      }
    }

    const payload = {
      id: authUserId || undefined,
      first_name: firstName,
      last_name: lastName,
      email,
      role: "PARTICULIER",
      objectif,
      access_connect: true,
    };

    console.log("Données envoyées à Supabase:", payload);

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "email" })
      .select()
      .limit(1);

    if (error) {
      console.error("Erreur Supabase détaillée:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data?.[0] });
  } catch (error) {
    console.error("ERREUR API:", error);
    console.error("[register-particulier]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

