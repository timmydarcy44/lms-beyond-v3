import { NextRequest, NextResponse } from "next/server";
import { getCatalogItems } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";

const TIM_SUPER_ADMIN_ID = "60c88469-3c53-417f-a81d-565a662ad2f5";
const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[api/catalogue] Supabase client unavailable");
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    // Détecter le tenant depuis les headers (pour app.jessicacontentin.fr)
    const tenantId = request.headers.get('x-tenant-id');
    const tenantSuperAdminEmail = request.headers.get('x-super-admin-email');
    
    console.log("[api/catalogue] Tenant detection:", {
      tenantId,
      tenantSuperAdminEmail,
    });

    // Récupérer le superAdminId depuis les query params pour les pages publiques
    const { searchParams } = new URL(request.url);
    const superAdminId = searchParams.get('superAdminId') || undefined;
    const superAdminEmail = searchParams.get('superAdminEmail') || undefined;

    // PRIORITÉ 1: Si on est sur app.jessicacontentin.fr (tenant jessica-contentin-app), 
    // utiliser l'email du tenant depuis les headers
    let emailToUse = superAdminEmail || tenantSuperAdminEmail || undefined;
    
    // Si superAdminEmail est fourni (via query param ou tenant), récupérer l'ID
    let resolvedSuperAdminId = superAdminId;
    if (emailToUse && !superAdminId) {
      const { data: superAdminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailToUse)
        .maybeSingle();
      if (superAdminProfile) {
        resolvedSuperAdminId = superAdminProfile.id;
        console.log("[api/catalogue] Resolved superAdminId from email:", emailToUse, "->", resolvedSuperAdminId);
      } else {
        console.warn("[api/catalogue] Could not find profile for email:", emailToUse);
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
    if (!resolvedSuperAdminId && userId) {
      // Pour les apprenants B2C, trouver leur Super Admin via catalog_access
      const { data: access } = await supabase
        .from("catalog_access")
        .select("catalog_item_id, catalog_items!inner(creator_id)")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      
      if (access && (access as any).catalog_items?.creator_id) {
        resolvedSuperAdminId = (access as any).catalog_items.creator_id;
        console.log("[api/catalogue] Determined Super Admin from catalog_access:", resolvedSuperAdminId);
      }
    }
    
    // Si toujours pas de Super Admin, utiliser Tim par défaut pour Beyond No School
    if (!resolvedSuperAdminId) {
      // Pour Beyond No School, utiliser Tim par défaut
      // Vérifier si Tim existe dans les super_admins
      const { data: timSuperAdmin } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", TIM_SUPER_ADMIN_ID)
        .eq("is_active", true)
        .maybeSingle();
      
      if (timSuperAdmin) {
        resolvedSuperAdminId = TIM_SUPER_ADMIN_ID;
        console.log("[api/catalogue] Using Tim as default Super Admin for Beyond No School:", resolvedSuperAdminId);
      } else {
        // Fallback : essayer de trouver via les catalog_items les plus récents
        const { data: recentItems } = await supabase
          .from("catalog_items")
          .select("creator_id")
          .eq("is_active", true)
          .eq("target_audience", "apprenant")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (recentItems?.creator_id) {
          resolvedSuperAdminId = recentItems.creator_id;
          console.log("[api/catalogue] Determined Super Admin from recent catalog_items:", resolvedSuperAdminId);
        }
      }
    }
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
    
    // IMPORTANT: Si toujours pas de superAdminId et qu'on est sur Beyond No School (catalogue public),
    // forcer l'ID de Tim pour éviter de montrer les formations d'autres super admins
    // MAIS: Ne jamais forcer Tim si on est sur un tenant Jessica Contentin
    if (!finalSuperAdminId && !user && tenantId !== 'jessica-contentin-app' && tenantId !== 'jessica-contentin') {
      // Catalogue public sans authentification - utiliser Tim par défaut pour Beyond No School
      finalSuperAdminId = TIM_SUPER_ADMIN_ID;
      console.log("[api/catalogue] Public access - forcing Tim as default Super Admin for Beyond No School");
    }
    
    // SÉCURITÉ: Si on est sur app.jessicacontentin.fr mais qu'on n'a pas de superAdminId, 
    // FORCER l'ID de Jessica Contentin
    if ((tenantId === 'jessica-contentin-app' || tenantId === 'jessica-contentin') && !finalSuperAdminId) {
      // Essayer d'abord avec l'email du tenant
      const emailToResolve = tenantSuperAdminEmail || JESSICA_CONTENTIN_EMAIL;
      const { data: tenantProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", emailToResolve)
        .maybeSingle();
      if (tenantProfile) {
        finalSuperAdminId = tenantProfile.id;
        console.log("[api/catalogue] ✅ FORCED superAdminId from tenant Jessica Contentin:", finalSuperAdminId);
      } else {
        console.error("[api/catalogue] ❌ Could not resolve Jessica Contentin profile for email:", emailToResolve);
      }
    }
    
    // SÉCURITÉ FINALE: Si on est sur app.jessicacontentin.fr, on NE DOIT JAMAIS montrer les items de Tim
    // Si finalSuperAdminId est toujours Tim alors qu'on est sur Jessica Contentin, c'est une erreur
    if ((tenantId === 'jessica-contentin-app' || tenantId === 'jessica-contentin') && finalSuperAdminId === TIM_SUPER_ADMIN_ID) {
      console.error("[api/catalogue] ⚠️ SECURITY: Attempted to show Tim's items on Jessica Contentin domain! Blocking.");
      // Forcer un ID invalide pour retourner un tableau vide plutôt que les items de Tim
      finalSuperAdminId = "00000000-0000-0000-0000-000000000000";
    }

    console.log("[api/catalogue] Final params:", {
      organizationId,
      userRole,
      userId,
      finalSuperAdminId,
    });
    
    const items = await getCatalogItems(organizationId, userRole, userId, finalSuperAdminId);

    console.log("[api/catalogue] Final superAdminId:", finalSuperAdminId);
    console.log("[api/catalogue] Items count before filter:", items?.length || 0);
    
    // SÉCURITÉ RENFORCÉE: Si on est sur Jessica Contentin, filtrer strictement par creator_id
    let filteredItems = items || [];
    if ((tenantId === 'jessica-contentin-app' || tenantId === 'jessica-contentin') && finalSuperAdminId) {
      // Récupérer l'ID de Jessica Contentin pour double vérification
      const { data: jessicaProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", JESSICA_CONTENTIN_EMAIL)
        .maybeSingle();
      
      if (jessicaProfile) {
        const jessicaId = jessicaProfile.id;
        // Filtrer les items pour ne garder que ceux créés par Jessica Contentin
        filteredItems = filteredItems.filter((item: any) => {
          const itemCreatorId = item.creator_id;
          const isJessicaItem = itemCreatorId === jessicaId;
          
          if (!isJessicaItem) {
            console.warn(`[api/catalogue] ⚠️ Filtered out item "${item.title}" - creator_id: ${itemCreatorId} (expected: ${jessicaId})`);
          }
          
          return isJessicaItem;
        });
        
        console.log(`[api/catalogue] ✅ Filtered items: ${filteredItems.length} items from Jessica Contentin (removed ${(items?.length || 0) - filteredItems.length} items from other creators)`);
      }
    }
    
    if (filteredItems && filteredItems.length > 0) {
      console.log("[api/catalogue] First item:", {
        id: filteredItems[0].id,
        title: filteredItems[0].title,
        category: filteredItems[0].category,
        creator_id: (filteredItems[0] as any).creator_id,
        target_audience: (filteredItems[0] as any).target_audience,
        is_active: (filteredItems[0] as any).is_active,
      });
    }

    return NextResponse.json({ items: filteredItems }, { status: 200 });
  } catch (error) {
    console.error("[api/catalogue] Error:", error);
    return NextResponse.json(
      { items: [], error: "Erreur lors de la récupération du catalogue" },
      { status: 200 } // Retourner 200 avec un tableau vide plutôt que 500
    );
  }
}

