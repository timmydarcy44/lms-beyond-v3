import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getCatalogItemsForSuperAdmin } from "@/lib/queries/super-admin-catalogue";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const items = await getCatalogItemsForSuperAdmin();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/super-admin/catalogue/items] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    
    // Récupérer l'utilisateur depuis la session Next.js
    const serverClient = await getServerClient();
    if (!serverClient) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data: { user }, error: userError } = await serverClient.auth.getUser();
    
    if (userError || !user) {
      console.error("[api/super-admin/catalogue/items] User error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Vérifier le rôle de l'utilisateur avant de continuer
    const { data: profile } = await serverClient
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .single();
    
    console.log("[api/super-admin/catalogue/items] User profile:", {
      id: user.id,
      email: profile?.email,
      role: profile?.role
    });
    
    if (!profile || profile.role !== 'super_admin') {
      console.error("[api/super-admin/catalogue/items] User is not a super admin:", {
        userId: user.id,
        email: profile?.email,
        role: profile?.role
      });
      return NextResponse.json(
        { 
          error: "Only super admins can insert catalog items",
          details: `User role: ${profile?.role || 'unknown'}, Email: ${profile?.email || 'unknown'}`
        },
        { status: 403 }
      );
    }

    // Utiliser le service role client si disponible (bypass RLS)
    // Sinon, utiliser la fonction PostgreSQL SECURITY DEFINER pour bypass RLS
    const serviceRoleClient = getServiceRoleClient();
    
    let item, error;
    
    if (serviceRoleClient) {
      // Service role client bypass RLS directement
      const result = await serviceRoleClient
        .from("catalog_items")
        .insert({
          ...body,
          created_by: user.id,
          creator_id: user.id, // IMPORTANT: Assigner creator_id pour le filtrage
        })
        .select()
        .single();
      item = result.data;
      error = result.error;
    } else {
      // Utiliser la fonction PostgreSQL SECURITY DEFINER
      console.log("[api/super-admin/catalogue/items] Using SECURITY DEFINER function to bypass RLS");
      console.log("[api/super-admin/catalogue/items] User ID:", user.id);
      console.log("[api/super-admin/catalogue/items] Body:", JSON.stringify(body, null, 2));
      
      const result = await serverClient.rpc('insert_catalog_item', {
        p_item_type: body.item_type,
        p_content_id: body.content_id,
        p_title: body.title || "Titre par défaut",
        p_description: body.description || null,
        p_short_description: body.short_description || body.description || null,
        p_hero_image_url: body.hero_image_url || null,
        p_thumbnail_url: body.thumbnail_url || null,
        p_price: typeof body.price === 'number' ? body.price : (parseFloat(body.price) || 0),
        p_is_free: body.is_free || false,
        p_category: body.category || null,
        p_thematique: body.thematique || null,
        p_duration: body.duration || null,
        p_level: body.level || null,
        p_target_audience: body.target_audience || 'pro',
        p_is_featured: body.is_featured || false,
        p_created_by: user.id, // Toujours passer l'ID utilisateur explicitement
      });
      
      if (result.error) {
        error = result.error;
      } else {
        // La fonction retourne un tableau (SETOF), prendre le premier élément
        item = Array.isArray(result.data) ? result.data[0] : result.data;
      }
    }

    if (error) {
      console.error("[api/super-admin/catalogue/items] Insert error:", error);
      console.error("[api/super-admin/catalogue/items] Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: error.message || "Erreur lors de l'ajout",
          details: error.code || error.hint || undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[api/super-admin/catalogue/items] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de l'item" },
      { status: 500 }
    );
  }
}

