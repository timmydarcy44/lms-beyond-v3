import { NextRequest, NextResponse } from "next/server";
import { getUserFullDetails } from "@/lib/queries/super-admin";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // Vérifier que l'utilisateur est Super Admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const userDetails = await getUserFullDetails(userId);

    if (!userDetails) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(userDetails);
  } catch (error) {
    console.error("[api] Error fetching user details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Une erreur s'est produite" },
      { status: 500 }
    );
  }
}




