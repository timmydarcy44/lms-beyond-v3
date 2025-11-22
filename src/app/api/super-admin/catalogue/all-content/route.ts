import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log("[api/super-admin/catalogue/all-content] Request received");
  
  try {
    console.log("[api/super-admin/catalogue/all-content] Checking super admin access...");
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      console.log("[api/super-admin/catalogue/all-content] Access denied");
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("[api/super-admin/catalogue/all-content] Getting Supabase client...");
    const supabase = await getServerClient();
    if (!supabase) {
      console.log("[api/super-admin/catalogue/all-content] Supabase client unavailable");
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    
    console.log("[api/super-admin/catalogue/all-content] Getting user...");
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log("[api/super-admin/catalogue/all-content] User not found");
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }
    
    console.log("[api/super-admin/catalogue/all-content] User found:", user.id);

    // Récupérer tous les contenus créés par le Super Admin depuis les tables directes
    // TypeScript assertion: supabase est vérifié non-null ci-dessus
    const supabaseClient = supabase!;
    console.log("[api/super-admin/catalogue/all-content] Fetching content for user:", user.id);
    
    const [modulesResult, testsResult, resourcesResult, pathsResult] = await Promise.all([
      // Modules (courses)
      supabaseClient
        .from("courses")
        .select("id, title, description, cover_image, slug, created_at, updated_at, builder_snapshot")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false }),
      
      // Tests
      supabaseClient
        .from("tests")
        .select("id, title, description, duration, created_at, updated_at, published, cover_image, hero_image_url, thumbnail_url, price, category")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false }),
      
      // Ressources - récupérer aussi file_url pour les images
      supabaseClient
        .from("resources")
        .select("id, title, description, kind, created_at, updated_at, published, thumbnail_url, cover_url, hero_image_url, price, category, file_url")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false }),
      
      // Parcours (paths)
      supabaseClient
        .from("paths")
        .select("id, title, description, created_at, updated_at, published")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    console.log("[api/super-admin/catalogue/all-content] Results:", {
      modules: modulesResult.data?.length || 0,
      tests: testsResult.data?.length || 0,
      resources: resourcesResult.data?.length || 0,
      paths: pathsResult.data?.length || 0,
      moduleTitles: modulesResult.data?.map(m => m.title) || [],
    });
    
    // Vérifier les erreurs
    if (modulesResult.error) {
      console.error("[api/super-admin/catalogue/all-content] Error fetching modules:", modulesResult.error);
    }

    // Récupérer tous les catalog_items en une seule requête pour optimiser
    const moduleIds = modulesResult.data?.map(m => m.id) || [];
    const testIds = testsResult.data?.map(t => t.id) || [];
    const resourceIds = resourcesResult.data?.map(r => r.id) || [];
    const pathIds = pathsResult.data?.map(p => p.id) || [];
    
    const allContentIds = [
      ...moduleIds,
      ...testIds,
      ...resourceIds,
      ...pathIds,
    ];

    // Récupérer tous les catalog_items en une seule requête (seulement si on a des IDs)
    let allCatalogItems = null;
    if (allContentIds.length > 0) {
      const { data } = await supabaseClient
        .from("catalog_items")
        .select("id, content_id, item_type")
        .eq("creator_id", user.id)
        .in("content_id", allContentIds);
      allCatalogItems = data;
    }

    // Créer un Map pour accès rapide
    const catalogItemsMap = new Map<string, string>();
    if (allCatalogItems) {
      for (const item of allCatalogItems) {
        catalogItemsMap.set(`${item.content_id}-${item.item_type}`, item.id);
      }
    }

    // Transformer les résultats en format uniforme pour le catalogue
    const allItems = [];

    // Modules
    if (modulesResult.data) {
      for (const module of modulesResult.data) {
        // Extraire l'image depuis builder_snapshot ou cover_image
        let heroImage = module.cover_image;
        let thumbnail = module.cover_image;
        let price = 0;
        let category = null;
        
        if (module.builder_snapshot) {
          try {
            const snapshot = typeof module.builder_snapshot === 'string' 
              ? JSON.parse(module.builder_snapshot) 
              : module.builder_snapshot;
            
            if (snapshot?.general?.heroImage) {
              heroImage = snapshot.general.heroImage;
              thumbnail = snapshot.general.heroImage;
            }
            if (snapshot?.general?.price) {
              price = snapshot.general.price;
            }
            if (snapshot?.general?.category) {
              category = snapshot.general.category;
            }
          } catch (e) {
            console.error("[catalogue/all-content] Error parsing builder_snapshot:", e);
          }
        }

        // Récupérer l'ID du catalogue depuis le Map
        const catalogItemId = catalogItemsMap.get(`${module.id}-module`);

        allItems.push({
          id: catalogItemId || module.id, // Utiliser l'ID du catalogue si disponible
          content_id: module.id,
          item_type: "module",
          title: module.title,
          description: module.description,
          short_description: module.description?.substring(0, 150) || null,
          hero_image_url: heroImage,
          thumbnail_url: thumbnail,
          price: price,
          is_free: price === 0,
          category: category,
          duration: null,
          level: null,
          created_at: module.created_at,
          updated_at: module.updated_at,
        });
      }
    }

    // Tests
    if (testsResult.data) {
      for (const test of testsResult.data) {
        // Récupérer l'ID du catalogue depuis le Map
        const catalogItemId = catalogItemsMap.get(`${test.id}-test`);

        allItems.push({
          id: catalogItemId || test.id,
          content_id: test.id,
          item_type: "test",
          title: test.title,
          description: test.description,
          short_description: test.description?.substring(0, 150) || null,
          hero_image_url: test.hero_image_url || test.cover_image || null,
          thumbnail_url: test.thumbnail_url || test.cover_image || test.hero_image_url || null,
          price: test.price || 0,
          is_free: (test.price || 0) === 0,
          category: test.category || null,
          duration: test.duration,
          level: null,
          created_at: test.created_at,
          updated_at: test.updated_at,
          published: test.published,
        });
      }
    }

    // Ressources
    if (resourcesResult.data) {
      for (const resource of resourcesResult.data) {
        // Récupérer l'ID du catalogue depuis le Map
        const catalogItemId = catalogItemsMap.get(`${resource.id}-ressource`);

        // Priorité pour les images : hero_image_url > thumbnail_url > cover_url > file_url (si image)
        const resourceImage = 
          resource.hero_image_url || 
          resource.thumbnail_url || 
          resource.cover_url ||
          (resource.file_url && resource.file_url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ? resource.file_url : null);

        allItems.push({
          id: catalogItemId || resource.id,
          content_id: resource.id,
          item_type: "ressource",
          title: resource.title,
          description: resource.description,
          short_description: resource.description?.substring(0, 150) || null,
          hero_image_url: resourceImage,
          thumbnail_url: resourceImage,
          price: resource.price || 0,
          is_free: (resource.price || 0) === 0,
          category: resource.category || null,
          duration: null,
          level: null,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
          published: resource.published,
          kind: resource.kind,
        });
      }
    }

    // Parcours
    if (pathsResult.data) {
      for (const path of pathsResult.data) {
        // Récupérer l'ID du catalogue depuis le Map
        const catalogItemId = catalogItemsMap.get(`${path.id}-parcours`);

        allItems.push({
          id: catalogItemId || path.id,
          content_id: path.id,
          item_type: "parcours",
          title: path.title,
          description: path.description,
          short_description: path.description?.substring(0, 150) || null,
          hero_image_url: null,
          thumbnail_url: null,
          price: 0,
          is_free: true,
          category: null,
          duration: null,
          level: null,
          created_at: path.created_at,
          updated_at: path.updated_at,
          published: path.published,
        });
      }
    }

    // Trier par date de création (plus récent en premier)
    allItems.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    const duration = Date.now() - startTime;
    console.log("[api/super-admin/catalogue/all-content] Returning", allItems.length, "items in", duration, "ms");
    return NextResponse.json({ items: allItems });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[api/super-admin/catalogue/all-content] Error after", duration, "ms:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des contenus", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

