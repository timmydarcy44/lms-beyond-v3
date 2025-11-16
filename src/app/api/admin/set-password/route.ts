import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Route temporaire pour définir un mot de passe pour un utilisateur
 * À supprimer après utilisation pour des raisons de sécurité
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Obtenir le client service role
    const supabaseAdmin = getServiceRoleClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY non configurée. Veuillez l'ajouter dans .env.local" },
        { status: 500 }
      );
    }

    // Trouver l'utilisateur par email
    const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers();

    if (findError) {
      console.error("[admin/set-password] Error finding users:", findError);
      return NextResponse.json(
        { error: "Erreur lors de la recherche de l'utilisateur" },
        { status: 500 }
      );
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: `Utilisateur avec l'email ${email} non trouvé` },
        { status: 404 }
      );
    }

    // Mettre à jour le mot de passe de l'utilisateur
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: password,
        email_confirm: true, // Confirmer l'email si ce n'est pas déjà fait
      }
    );

    if (updateError) {
      console.error("[admin/set-password] Error updating password:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour du mot de passe: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Mot de passe défini avec succès pour ${email}`,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("[admin/set-password] Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Une erreur inattendue s'est produite",
      },
      { status: 500 }
    );
  }
}

