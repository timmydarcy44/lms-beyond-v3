import { NextRequest, NextResponse } from "next/server";
import { getCatalogItems } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/catalogue] Supabase client unavailable");
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Récupérer le superAdminId depuis les query params pour les pages publiques
    const { searchParams } = new URL(request.url);
    const superAdminId = searchParams.get('superAdminId') || undefined;
    const superAdminEmail = searchParams.get('superAdminEmail') || undefined;

    // Si superAdminEmail est fourni, récupérer l'ID
    let resolvedSuperAdminId = superAdminId;
    if (superAdminEmail && !superAdminId) {
      const { data: superAdminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", superAdminEmail)
        .maybeSingle();
      if (superAdminProfile) {
        resolvedSuperAdminId = superAdminProfile.id;
      }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Si pas d'utilisateur authentifié, retourner le catalogue public (filtré par superAdminId si fourni)
    if (authError || !user) {
      console.log("[api/catalogue] Public access - no authenticated user");
      if (resolvedSuperAdminId) {
        const items = await getCatalogItems(undefined, undefined, undefined, resolvedSuperAdminId);
        return NextResponse.json({ items: items || [] }, { status: 200 });
      }
      // Sinon, retourner tous les items actifs (catalogue public)
      const items = await getCatalogItems(undefined, undefined, undefined, undefined);
      return NextResponse.json({ items: items || [] }, { status: 200 });
    }

    // Récupérer le rôle de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[api/catalogue] Error fetching profile:", profileError);
    }

    const userRole = profile?.role === "learner" ? "learner" : 
                     profile?.role === "instructor" ? "instructor" :
                     profile?.role === "admin" ? "admin" :
                     profile?.role === "tutor" ? "tutor" : undefined;

    // Récupérer l'organisation de l'utilisateur (essayer depuis profile d'abord, puis org_memberships)
    let organizationId = profile?.org_id;

    if (!organizationId) {
      const { data: membership } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      
      organizationId = membership?.org_id;
    }

    // Si pas d'organisation et que c'est un learner, c'est un utilisateur B2C
    // Passer le userId pour vérifier les accès individuels
    const userId = !organizationId && userRole === "learner" ? user.id : undefined;

    // Pour les utilisateurs B2C, déterminer leur Super Admin via catalog_access
    // OU si c'est un Super Admin qui prévisualise son catalogue
    // Utiliser resolvedSuperAdminId si fourni via query params, sinon déterminer
    let finalSuperAdminId: string | undefined = resolvedSuperAdminId;
    
    if (!finalSuperAdminId) {
      // Vérifier si l'utilisateur est un Super Admin (pour la prévisualisation)
      const { data: superAdminCheck } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (superAdminCheck) {
        // Super Admin prévisualise son propre catalogue
        finalSuperAdminId = user.id;
        console.log("[api/catalogue] Super Admin previewing their own catalogue:", finalSuperAdminId);
      } else if (!organizationId && userRole === "learner" && userId) {
        // Récupérer le creator_id du premier item auquel l'utilisateur a accès
        const { data: access } = await supabase
          .from("catalog_access")
          .select("catalog_item_id, catalog_items!inner(creator_id)")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        
        if (access && (access as any).catalog_items?.creator_id) {
          // Assigner le creator_id du catalog item comme superAdminId
          finalSuperAdminId = (access as any).catalog_items.creator_id;
          console.log("[api/catalogue] Super Admin ID from catalog_access:", finalSuperAdminId);
        }
      }
    }

    const items = await getCatalogItems(organizationId, userRole, userId, finalSuperAdminId);

    console.log("[api/catalogue] Final superAdminId:", finalSuperAdminId);
    console.log("[api/catalogue] Items count:", items?.length || 0);

    return NextResponse.json({ items: items || [] }, { status: 200 });
  } catch (error) {
    console.error("[api/catalogue] Error:", error);
    return NextResponse.json(
      { items: [], error: "Erreur lors de la récupération du catalogue" },
      { status: 200 } // Retourner 200 avec un tableau vide plutôt que 500
    );
  }
}

