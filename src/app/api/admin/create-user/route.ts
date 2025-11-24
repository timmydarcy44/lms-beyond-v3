import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom complet sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 }
      );
    }

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer automatiquement l'email
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (authError || !authData.user) {
      console.error("[admin/create-user] Error creating auth user:", authError);
      return NextResponse.json(
        { error: authError?.message || "Erreur lors de la création de l'utilisateur" },
        { status: 500 }
      );
    }

    // Créer le profil dans profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        phone: phone || null,
        role: "learner",
      });

    if (profileError) {
      console.error("[admin/create-user] Error creating profile:", profileError);
      // Essayer de supprimer l'utilisateur auth si le profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      email: authData.user.email,
    });
  } catch (error: any) {
    console.error("[admin/create-user] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
}

