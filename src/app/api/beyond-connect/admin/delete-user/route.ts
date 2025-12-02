import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Supprime un utilisateur par email (admin uniquement)
 * POST /api/beyond-connect/admin/delete-user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const supabaseService = getServiceRoleClient();
    if (!supabaseService) {
      return NextResponse.json({ error: "Service non disponible" }, { status: 500 });
    }

    // Trouver l'utilisateur par email via profiles (méthode plus fiable)
    const { data: profileData } = await supabaseService
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    let userId: string | null = null;

    if (profileData) {
      userId = profileData.id;
      console.log(`[delete-user] Utilisateur trouvé via profiles: ${userId}`);
    } else {
      // Essayer via listUsers si profiles ne trouve rien
      try {
        const { data: usersData, error: listError } = await supabaseService.auth.admin.listUsers();
        
        if (!listError && usersData?.users) {
          const user = usersData.users.find((u) => u.email === email);
          if (user) {
            userId = user.id;
            console.log(`[delete-user] Utilisateur trouvé via listUsers: ${userId}`);
          }
        }
      } catch (error) {
        console.error("[delete-user] Error listing users:", error);
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: `L'utilisateur ${email} n'existe pas dans la base de données.` 
      }, { status: 404 });
    }

    // Supprimer les données associées
    console.log(`[delete-user] Suppression des données associées pour ${email}...`);
    
    // Supprimer les candidatures
    const { error: appsError } = await supabaseService
      .from("beyond_connect_applications")
      .delete()
      .eq("user_id", userId);

    if (appsError) {
      console.error("[delete-user] Error deleting applications:", appsError);
    }

    // Supprimer le profil
    const { error: profileError } = await supabaseService
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("[delete-user] Error deleting profile:", profileError);
    }

    // Supprimer l'utilisateur de auth.users
    console.log(`[delete-user] Suppression de l'utilisateur auth ${userId}...`);
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("[delete-user] Error deleting user:", deleteError);
      return NextResponse.json({ 
        success: false, 
        error: "Erreur lors de la suppression de l'utilisateur",
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Utilisateur ${email} supprimé avec succès.`,
      userId 
    });

  } catch (error) {
    console.error("[delete-user] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}

