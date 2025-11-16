import { getServerClient } from "@/lib/supabase/server";

export type CatalogItem = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  content_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  thematique: string | null;
  duration: string | null;
  level: string | null;
  target_audience?: "pro" | "apprenant" | "all";
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  course_slug?: string | null; // Slug du course associé (pour les modules)
};

export async function getCatalogItems(
  organizationId?: string,
  userRole?: "learner" | "instructor" | "admin" | "tutor",
  userId?: string, // Nouveau paramètre pour les utilisateurs B2C
  superAdminId?: string // ID du Super Admin pour filtrer le catalogue
): Promise<CatalogItem[]> {
  const supabase = await getServerClient();

  // Construire la requête avec filtrage par audience si c'est un apprenant
  let query = supabase
    .from("catalog_items")
    .select("*")
    .eq("is_active", true);

  // IMPORTANT: Filtrer par creator_id (Super Admin) si spécifié
  // Pour contentin.cabinet@gmail.com, on ne montre que ses items
  if (superAdminId) {
    query = query.eq("creator_id", superAdminId);
    console.log("[catalogue] Filtering by super admin:", superAdminId);
  }

  // Si c'est un apprenant, ne montrer que les items pour apprenants ou tous publics
  if (userRole === "learner") {
    query = query.or("target_audience.eq.apprenant,target_audience.eq.all");
  }
  // Sinon, montrer les items pour pro ou tous publics (formateurs, admins, tuteurs)
  else if (userRole && userRole !== "learner") {
    query = query.or("target_audience.eq.pro,target_audience.eq.all");
  }

  // Récupérer tous les items actifs du catalogue (filtrés selon le rôle)
  const { data: items, error } = await query
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[catalogue] Error fetching catalog items:", error);
    return [];
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Vérifier les accès : B2B (organisation) ou B2C (utilisateur individuel)
  let accessMap = new Map<string, string>();
  
  // B2B : Si une organisation est fournie, vérifier les accès au niveau organisation
  if (organizationId) {
    const { data: accesses } = await supabase
      .from("catalog_access")
      .select("catalog_item_id, access_status")
      .eq("organization_id", organizationId);

    accessMap = new Map(
      accesses?.map((a) => [a.catalog_item_id, a.access_status]) || []
    );
  }
  // B2C : Si pas d'organisation mais un userId, vérifier les accès au niveau utilisateur
  else if (userId && userRole === "learner") {
    const { data: accesses } = await supabase
      .from("catalog_access")
      .select("catalog_item_id, access_status")
      .eq("user_id", userId)
      .is("organization_id", null);

    if (accesses) {
      accesses.forEach((a) => {
        accessMap.set(a.catalog_item_id, a.access_status);
      });
    }
  }

  // Enrichir les items avec les images depuis les courses/builder_snapshot
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      // Si l'item a déjà une hero_image_url, s'assurer que thumbnail_url est aussi défini
      if (item.hero_image_url && !item.thumbnail_url) {
        item.thumbnail_url = item.hero_image_url;
      }
      
      // Si l'item a déjà une hero_image_url, on la garde
      if (item.hero_image_url) {
        return {
          ...item,
          access_status: accessMap.get(item.id) || (item.is_free ? "free" : "pending_payment"),
        };
      }

      // Pour les modules, récupérer l'image et le prix depuis le course
      if (item.item_type === "module") {
        try {
          const { data: courseData } = await supabase
            .from("courses")
            .select("cover_image, builder_snapshot, price")
            .eq("id", item.content_id)
            .single();
          
          // Mettre à jour le prix depuis le course si disponible
          if (courseData?.price !== null && courseData?.price !== undefined) {
            item.price = courseData.price;
            // Mettre à jour is_free en fonction du prix
            item.is_free = courseData.price === 0 || courseData.price === null;
            console.log(`[catalogue] ✅ Updated price for item ${item.id} from course:`, courseData.price, `(is_free: ${item.is_free})`);
          } else if (courseData?.builder_snapshot) {
            // Sinon, essayer de récupérer le prix depuis builder_snapshot
            try {
              const snapshot = typeof courseData.builder_snapshot === 'string'
                ? JSON.parse(courseData.builder_snapshot)
                : courseData.builder_snapshot;
              
              if (snapshot?.general?.price !== null && snapshot?.general?.price !== undefined) {
                item.price = snapshot.general.price;
                item.is_free = snapshot.general.price === 0 || snapshot.general.price === null;
                console.log(`[catalogue] ✅ Updated price for item ${item.id} from snapshot:`, snapshot.general.price, `(is_free: ${item.is_free})`);
              }
            } catch (e) {
              console.error("[catalogue] Error parsing builder_snapshot for price", item.id, e);
            }
          }

          if (courseData) {
            let heroImage = courseData.cover_image;

            // Si pas d'image, chercher dans builder_snapshot
            if (!heroImage && courseData.builder_snapshot) {
              try {
                const snapshot = typeof courseData.builder_snapshot === 'string'
                  ? JSON.parse(courseData.builder_snapshot)
                  : courseData.builder_snapshot;

                // Chercher dans general.heroImage
                if (snapshot?.general?.heroImage) {
                  heroImage = snapshot.general.heroImage;
                } else {
                  // Recherche récursive pour "istockphoto-1783743772-612x612" ou toute image
                  const findImageRecursive = (obj: any, depth = 0): string | null => {
                    if (depth > 10 || !obj || typeof obj !== 'object') return null;
                    
                    for (const key in obj) {
                      const value = obj[key];
                      
                      if (typeof value === 'string') {
                        if (value.includes('istockphoto-1783743772-612x612') || 
                            value.startsWith('data:image/') ||
                            (value.length > 50 && (
                              value.includes('http') || 
                              value.includes('/images/') || 
                              value.includes('istock') ||
                              value.includes('supabase') ||
                              value.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
                            ))) {
                          return value;
                        }
                      }
                      
                      if (typeof value === 'object' && value !== null) {
                        const found = findImageRecursive(value, depth + 1);
                        if (found) return found;
                      }
                    }
                    
                    return null;
                  };

                  const foundImage = findImageRecursive(snapshot);
                  if (foundImage) {
                    heroImage = foundImage;
                  }
                }
              } catch (e) {
                console.error("[catalogue] Error parsing builder_snapshot for item", item.id, e);
              }
            }

            // Mettre à jour l'item avec l'image trouvée
            if (heroImage) {
              item.hero_image_url = heroImage;
              // Si pas de thumbnail_url, utiliser hero_image_url comme thumbnail
              if (!item.thumbnail_url) {
                item.thumbnail_url = heroImage;
              }
              console.log(`[catalogue] ✅ Enriched item ${item.id} with image:`, heroImage.substring(0, 100));
            } else {
              console.log(`[catalogue] ❌ No image found for item ${item.id} (module: ${item.content_id})`);
            }
            
            // Enrichir aussi la catégorie depuis builder_snapshot si elle n'est pas définie
            if (!item.category && courseData.builder_snapshot) {
              try {
                const snapshot = typeof courseData.builder_snapshot === 'string'
                  ? JSON.parse(courseData.builder_snapshot)
                  : courseData.builder_snapshot;
                
                if (snapshot?.general?.category) {
                  item.category = snapshot.general.category;
                  console.log(`[catalogue] ✅ Enriched item ${item.id} with category:`, item.category);
                }
              } catch (e) {
                console.error("[catalogue] Error parsing builder_snapshot for category", item.id, e);
              }
            }
            
            // Récupérer le slug du course pour les redirections
            if (courseData?.slug) {
              (item as any).course_slug = courseData.slug;
            }
          }
        } catch (e) {
          console.error("[catalogue] Error fetching course for item", item.id, e);
        }
      }

      // Pour les tests, récupérer le prix et les images depuis la table tests
      // ET depuis catalog_items (le prix dans catalog_items est la source de vérité)
      if (item.item_type === "test") {
        try {
          // D'abord, vérifier le prix dans catalog_items (source de vérité)
          if (item.price !== null && item.price !== undefined) {
            item.is_free = item.price === 0 || item.price === null;
            console.log(`[catalogue] Using price from catalog_items for test ${item.id}:`, item.price, `(is_free: ${item.is_free})`);
          }
          
          // Ensuite, récupérer les images depuis la table tests
          let { data: testData, error: testError } = await supabase
            .from("tests")
            .select("cover_image, hero_image_url, thumbnail_url, price")
            .eq("id", item.content_id)
            .maybeSingle();
          
          // Si erreur de colonne manquante, réessayer avec moins de colonnes
          if (testError && testError.code === '42703') {
            const { data: testMinimal, error: testMinErr } = await supabase
              .from("tests")
              .select("cover_image, price")
              .eq("id", item.content_id)
              .maybeSingle();
            
            if (!testMinErr && testMinimal) {
              testData = testMinimal;
            }
          }
          
          if (testData) {
            // Si le prix dans catalog_items n'est pas défini, utiliser celui du test
            if ((item.price === null || item.price === undefined || item.price === 0) && 
                testData.price !== null && testData.price !== undefined) {
              item.price = testData.price;
              item.is_free = testData.price === 0 || testData.price === null;
              console.log(`[catalogue] ✅ Updated price for test ${item.id} from tests table:`, testData.price, `(is_free: ${item.is_free})`);
            }
            
            // Mettre à jour les images (avec fallback si colonnes n'existent pas)
            const testImage = (testData as any).hero_image_url || (testData as any).thumbnail_url || (testData as any).cover_image;
            if (testImage && !item.hero_image_url && !item.thumbnail_url) {
              item.hero_image_url = testImage;
              item.thumbnail_url = testImage;
              console.log(`[catalogue] ✅ Enriched test ${item.id} with image`);
            }
          }
        } catch (e) {
          console.error("[catalogue] Error fetching test for item", item.id, e);
        }
      }

      // Pour les ressources, récupérer le prix et les images depuis la table resources
      if (item.item_type === "ressource") {
        try {
          // Essayer d'abord avec toutes les colonnes
          let { data: resourceData, error: resourceError } = await supabase
            .from("resources")
            .select("price, cover_url, thumbnail_url, hero_image_url, file_url")
            .eq("id", item.content_id)
            .maybeSingle();
          
          // Si erreur de colonne manquante, réessayer avec moins de colonnes
          if (resourceError && resourceError.code === '42703') {
            const { data: resourceMinimal, error: resourceMinErr } = await supabase
              .from("resources")
              .select("price, cover_url, thumbnail_url, file_url")
              .eq("id", item.content_id)
              .maybeSingle();
            
            if (!resourceMinErr && resourceMinimal) {
              resourceData = resourceMinimal;
            }
          }
          
          if (resourceData) {
            // Mettre à jour le prix depuis la ressource si disponible
            if (resourceData.price !== null && resourceData.price !== undefined) {
              item.price = resourceData.price;
              item.is_free = resourceData.price === 0 || resourceData.price === null;
              console.log(`[catalogue] ✅ Updated price for resource ${item.id}:`, resourceData.price, `(is_free: ${item.is_free})`);
            }
            
            // Mettre à jour les images - priorité : hero_image_url > thumbnail_url > cover_url > file_url (si image)
            const resourceImage = 
              (resourceData as any).hero_image_url || 
              (resourceData as any).thumbnail_url || 
              (resourceData as any).cover_url ||
              ((resourceData as any).file_url && (resourceData as any).file_url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ? (resourceData as any).file_url : null);
            
            // Toujours mettre à jour les images, même si catalog_items en a déjà (pour forcer la mise à jour)
            if (resourceImage) {
              item.hero_image_url = resourceImage;
              item.thumbnail_url = resourceImage;
              console.log(`[catalogue] ✅ Enriched resource ${item.id} with image:`, resourceImage.substring(0, 100));
            } else {
              console.log(`[catalogue] ⚠️ No image found for resource ${item.id} (content_id: ${item.content_id})`);
            }
          } else {
            console.log(`[catalogue] ⚠️ Resource data not found for item ${item.id} (content_id: ${item.content_id})`);
          }
        } catch (e) {
          console.error("[catalogue] Error fetching resource for item", item.id, e);
        }
      }

      return {
        ...item,
        access_status: accessMap.get(item.id) || (item.is_free ? "free" : "pending_payment"),
      };
    })
  );

  return enrichedItems;
}

/**
 * Récupère un item du catalogue par son ID avec les détails du contenu associé
 */
export async function getCatalogItemById(
  catalogItemId: string,
  organizationId?: string
): Promise<(CatalogItem & { course?: any; test?: any; slug?: string }) | null> {
  const supabase = await getServerClient();

  // Récupérer l'item du catalogue avec creator_id
  let { data: item, error: itemError } = await supabase
    .from("catalog_items")
    .select("*, creator_id")
    .eq("id", catalogItemId)
    .eq("is_active", true)
    .single();

  // Si l'item n'est pas dans catalog_items, essayer de le trouver directement dans les tables
  if (itemError || !item) {
    console.log("[catalogue] Item not found in catalog_items, attempting lookup by content_id for:", catalogItemId);

    const { data: byContent, error: byContentError } = await supabase
      .from("catalog_items")
      .select("*, creator_id")
      .eq("content_id", catalogItemId)
      .eq("is_active", true)
      .maybeSingle();

    if (byContent && !byContentError) {
      console.log("[catalogue] Found catalog item via content_id:", byContent.id);
      item = byContent;
    } else {
      console.log("[catalogue] Item still not found, trying direct table lookup for:", catalogItemId);
      console.log("[catalogue] Original error:", itemError?.message || itemError);
      
      // Essayer de trouver dans tests
      const { data: testData, error: testError } = await supabase
        .from("tests")
        .select("id, title, description, price, category, cover_image, hero_image_url, thumbnail_url, creator_id, created_at, updated_at")
        .eq("id", catalogItemId)
        .maybeSingle();
      
      if (!testError && testData) {
        console.log("[catalogue] Found test directement dans tests:", testData.id);
        item = {
          id: testData.id,
          content_id: testData.id,
          item_type: "test" as const,
          title: testData.title,
          description: testData.description || "",
          short_description: testData.description || "",
          price: testData.price || 0,
          is_free: !testData.price || testData.price === 0,
          thumbnail_url: testData.thumbnail_url || testData.cover_image || testData.hero_image_url,
          hero_image_url: testData.hero_image_url || testData.cover_image || testData.thumbnail_url,
          category: testData.category,
          creator_id: testData.creator_id,
          created_at: testData.created_at,
          updated_at: testData.updated_at,
          is_active: true,
          target_audience: "all",
        } as any;
      } else {
        // Essayer de trouver dans courses
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, price, cover_image, hero_image_url, thumbnail_url, creator_id, slug, created_at, updated_at")
        .eq("id", catalogItemId)
        .maybeSingle();
      
      if (!courseError && courseData) {
        console.log("[catalogue] Found course directly in courses table:", courseData.id);
        // Créer un item de catalogue virtuel depuis le course
        item = {
          id: courseData.id,
          content_id: courseData.id,
          item_type: "module" as const,
          title: courseData.title,
          description: courseData.description || "",
          short_description: courseData.description || "",
          price: courseData.price || 0,
          is_free: !courseData.price || courseData.price === 0,
          thumbnail_url: courseData.thumbnail_url || courseData.cover_image || courseData.hero_image_url,
          hero_image_url: courseData.hero_image_url || courseData.cover_image || courseData.thumbnail_url,
          creator_id: courseData.creator_id,
          created_at: courseData.created_at,
          updated_at: courseData.updated_at,
          is_active: true,
          target_audience: "all",
        } as any;
      } else {
        console.error("[catalogue] Error fetching catalog item from catalog_items:", itemError?.message || itemError);
        console.error("[catalogue] Lookup by content_id error:", byContentError?.message || byContentError);
        console.error("[catalogue] Test lookup error:", testError?.message || testError);
        console.error("[catalogue] Course lookup error:", courseError?.message || courseError);
        console.error("[catalogue] Item ID searched:", catalogItemId);
        return null;
      }
      }
    }
  }

  // Récupérer les détails du contenu associé (pour les modules, c'est un course; pour les tests, c'est un test)
  let course = null;
  let test = null;
  
  if (item.item_type === "module") {
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id, title, description, cover_image, slug, builder_snapshot")
      .eq("id", item.content_id)
      .single();

    if (!courseError && courseData) {
      course = courseData;
    }
  } else if (item.item_type === "test") {
    const { data: testData, error: testError } = await supabase
      .from("tests")
      .select("id, title, description, duration, evaluation_type, skills, display_format, questions")
      .eq("id", item.content_id)
      .single();

    if (!testError && testData) {
      test = testData;
    }
  }
  
  // Si l'item est un module et qu'on a un course, enrichir avec builder_snapshot
  if (item.item_type === "module" && course) {
    const courseData = course;
    // Si l'item du catalogue n'a pas d'image hero ou d'accroche, utiliser ceux du course/builder_snapshot
    if (!item.hero_image_url && courseData.builder_snapshot) {
        try {
          const snapshot = typeof courseData.builder_snapshot === 'string' 
            ? JSON.parse(courseData.builder_snapshot) 
            : courseData.builder_snapshot;
          
          if (snapshot?.general?.heroImage) {
            item.hero_image_url = snapshot.general.heroImage;
          }
        } catch (e) {
          console.error("[catalogue] Error parsing builder_snapshot:", e);
        }
      }
      
      // Si pas de cover_image dans catalog_item, utiliser celui du course
      if (!item.hero_image_url && courseData.cover_image) {
        item.hero_image_url = courseData.cover_image;
      }
      
      // Recherche approfondie de l'image "istockphoto-1783743772-612x612" dans le builder_snapshot
      if (courseData.builder_snapshot) {
        try {
          const snapshot = typeof courseData.builder_snapshot === 'string' 
            ? JSON.parse(courseData.builder_snapshot) 
            : courseData.builder_snapshot;
          
          // Fonction récursive pour chercher l'image dans tout le snapshot
          const findImageInSnapshot = (obj: any, path = ''): string | null => {
            if (!obj || typeof obj !== 'object') return null;
            
            // Chercher dans les valeurs de l'objet
            for (const key in obj) {
              const value = obj[key];
              const currentPath = path ? `${path}.${key}` : key;
              
              // Si c'est une string et qu'elle contient l'image recherchée ou ressemble à une URL d'image
              if (typeof value === 'string') {
                // Chercher spécifiquement "istockphoto-1783743772-612x612"
                if (value.includes('istockphoto-1783743772-612x612')) {
                  console.log(`[catalogue] Found istockphoto image at ${currentPath}:`, value);
                  return value;
                }
                
                // Chercher aussi les URLs d'images ou chemins
                if (value.match(/\.(jpg|jpeg|png|webp|gif)$/i) || 
                    value.includes('http') || 
                    value.includes('/images/') ||
                    value.includes('supabase') ||
                    value.startsWith('/')) {
                  // Si c'est une longue string (probablement une URL complète), la prendre
                  if (value.length > 20) {
                    console.log(`[catalogue] Found potential image URL at ${currentPath}:`, value.substring(0, 100));
                    return value;
                  }
                }
              }
              
              // Si c'est un objet ou un tableau, chercher récursivement
              if (typeof value === 'object' && value !== null) {
                const found = findImageInSnapshot(value, currentPath);
                if (found) return found;
              }
            }
            
            return null;
          };
          
          const foundImage = findImageInSnapshot(snapshot);
          if (foundImage && !item.hero_image_url) {
            item.hero_image_url = foundImage;
            console.log("[catalogue] Set hero_image_url from builder_snapshot:", foundImage);
          }
        } catch (e) {
          console.error("[catalogue] Error searching for image in builder_snapshot:", e);
        }
      }
      
      // Si pas d'accroche dans catalog_item, utiliser celle du course/builder_snapshot
      if (!item.short_description && !item.description) {
        if (courseData.builder_snapshot) {
          const snapshot = typeof courseData.builder_snapshot === 'string' 
            ? JSON.parse(courseData.builder_snapshot) 
            : courseData.builder_snapshot;
          
          if (snapshot?.general?.subtitle) {
            item.short_description = snapshot.general.subtitle;
          }
        }
        
        // Fallback sur description du course
        if (!item.short_description && courseData.description) {
          item.short_description = courseData.description;
        }
      }
  }

  // Récupérer le statut d'accès si une organisation est fournie
  let accessStatus: "pending_payment" | "purchased" | "manually_granted" | "free" | null = null;
  if (organizationId) {
    const { data: access } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItemId)
      .eq("organization_id", organizationId)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .single();

    accessStatus = access?.access_status || null;
  }

  // Si gratuit, l'accès est automatique
  if (item.is_free) {
    accessStatus = "free";
  }

  return {
    ...item,
    access_status: accessStatus || "pending_payment",
    course,
    test,
    slug: course?.slug || null,
  };
}

export async function getCatalogItemAccess(
  catalogItemId: string,
  organizationId: string
): Promise<"pending_payment" | "purchased" | "manually_granted" | "free" | null> {
  const supabase = await getServerClient();

  const { data: access } = await supabase
    .from("catalog_access")
    .select("access_status")
    .eq("catalog_item_id", catalogItemId)
    .eq("organization_id", organizationId)
    .in("access_status", ["purchased", "manually_granted", "free"])
    .single();

  return access?.access_status || null;
}
