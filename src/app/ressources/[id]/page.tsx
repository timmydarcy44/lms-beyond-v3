import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { Button } from "@/components/ui/button";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { Play, FileText, Video, Headphones, CreditCard } from "lucide-react";
import { BuyButton } from "@/components/jessica-contentin/buy-button";
import { ResourcePurchaseSection } from "@/components/jessica-contentin/resource-purchase-section";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { headers } from "next/headers";
import { PaymentCleanupWrapper } from "./payment-cleanup-wrapper";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface RessourceDetailPageProps {
  params: Promise<{ id: string }>;
}

// Fonction pour détecter si c'est un UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Forcer la revalidation à chaque requête pour éviter les problèmes de cache (notamment sur Edge)
// Cela empêche Next.js et les navigateurs (notamment Edge) de mettre en cache les réponses
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function RessourceDetailPage({ params }: RessourceDetailPageProps) {
  console.log("[ressources/[id]] ========================================");
  console.log("[ressources/[id]] PAGE FUNCTION CALLED");
  console.log("[ressources/[id]] ========================================");
  
  // Vérifier le tenant pour s'assurer que la route est accessible sur jessicacontentin.fr
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  
  // Si on est en production et que ce n'est pas le tenant jessica-contentin, rediriger
  if (!isLocalhost && tenant && tenant.id !== 'jessica-contentin' && tenant.id !== 'jessica-contentin-app') {
    console.log("[ressources/[id]] Not on jessica-contentin tenant, redirecting");
    redirect('/');
  }
  
  const { id } = await params;
  console.log("[ressources/[id]] Params extracted, id:", id);

  if (!id) {
    console.error("[ressources/[id]] ❌ No ID provided, calling notFound()");
    notFound();
  }

  const supabase = await getServerClient();
  console.log("[ressources/[id]] Supabase client:", supabase ? "✅ Created" : "❌ Null");
  
  if (!supabase) {
    console.error("[ressources/[id]] ❌ Supabase client is null, calling notFound()");
    notFound();
  }

  // Vérifier l'authentification (optionnel pour voir la page, mais requis pour accéder au contenu)
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[ressources/[id]] User:", user ? `✅ Logged in (${user.id})` : "❌ Not logged in");
  // Ne pas rediriger si l'utilisateur n'est pas connecté - permettre la visualisation de la page

  // Récupérer l'ID de Jessica Contentin
  // IMPORTANT: Utiliser le service role client pour contourner RLS si l'utilisateur n'est pas connecté
  const serviceClient = getServiceRoleClient();
  const profileClient = serviceClient || supabase;
  
  console.log("[ressources/[id]] Looking for Jessica profile with email:", JESSICA_CONTENTIN_EMAIL);
  console.log("[ressources/[id]] Using client:", serviceClient ? "Service Role" : "Regular");
  
  const { data: jessicaProfile, error: jessicaProfileError } = await profileClient
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (jessicaProfileError) {
    console.error("[ressources/[id]] ❌ Error fetching Jessica profile:", jessicaProfileError);
    // Ne pas appeler notFound() si c'est juste une erreur RLS - continuer quand même
    // On utilisera l'UUID direct de Jessica si le profil n'est pas trouvé
  }

  // Si le profil n'est pas trouvé, utiliser l'UUID direct de Jessica Contentin
  const jessicaProfileId = jessicaProfile?.id || "17364229-fe78-4986-ac69-41b880e34631";
  
  if (!jessicaProfile && !jessicaProfileError) {
    console.warn("[ressources/[id]] ⚠️ Jessica profile not found, using hardcoded UUID:", jessicaProfileId);
  } else if (jessicaProfile) {
    console.log("[ressources/[id]] ✅ Jessica profile found:", jessicaProfile.id);
  } else {
    console.log("[ressources/[id]] ⚠️ Using hardcoded Jessica UUID due to error:", jessicaProfileId);
  }

  // Récupérer le profil pour obtenir l'organisation (si l'utilisateur est connecté)
  let organizationId: string | undefined = undefined;
  if (user?.id) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();
    organizationId = profile?.org_id || undefined;
  }

  // Détecter si c'est un UUID ou un slug
  const isIdUUID = isUUID(id);
  let resourceId = id;
  let catalogItem = null;

  console.log("[ressources/[id]] ========================================");
  console.log("[ressources/[id]] Starting search for resource:", { id, isIdUUID, jessicaProfileId });
  console.log("[ressources/[id]] ========================================");

  // Utiliser le service role client pour contourner RLS lors de la recherche initiale
  // (on l'a déjà créé plus haut, mais on le recrée ici pour être sûr)
  const searchServiceClient = getServiceRoleClient();
  const searchClient = searchServiceClient || supabase;

  if (isIdUUID) {
    // C'est un UUID, chercher directement par ID dans catalog_items (sans filtre créateur d'abord)
    const { data: catalogItemDirect } = await searchClient
      .from("catalog_items")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    
    console.log("[ressources/[id]] Direct catalog_items lookup:", { found: !!catalogItemDirect, created_by: catalogItemDirect?.created_by, creator_id: catalogItemDirect?.creator_id });
    
    if (catalogItemDirect) {
      console.log("[ressources/[id]] ✅ Found catalog_item_direct:", {
        id: catalogItemDirect.id,
        item_type: catalogItemDirect.item_type,
        title: catalogItemDirect.title,
        content_id: catalogItemDirect.content_id,
        created_by: catalogItemDirect.created_by,
        is_active: catalogItemDirect.is_active,
      });
      console.log("[ressources/[id]] Calling getCatalogItemById with:", { id, organizationId, userId: user?.id });
      catalogItem = await getCatalogItemById(id, organizationId, user?.id, serviceClient);
      console.log("[ressources/[id]] Result from getCatalogItemById:", { 
        found: !!catalogItem, 
        itemType: catalogItem?.item_type,
        itemId: catalogItem?.id,
      });
      
      // Si getCatalogItemById ne retourne rien, utiliser directement catalogItemDirect
      if (!catalogItem && catalogItemDirect) {
        console.log("[ressources/[id]] ⚠️ getCatalogItemById returned null, using catalogItemDirect directly");
        catalogItem = {
          id: catalogItemDirect.id,
          content_id: catalogItemDirect.content_id,
          item_type: catalogItemDirect.item_type,
          title: catalogItemDirect.title,
          description: catalogItemDirect.description,
          short_description: catalogItemDirect.short_description,
          price: catalogItemDirect.price || 0,
          is_free: catalogItemDirect.is_free || false,
          thumbnail_url: catalogItemDirect.thumbnail_url,
          hero_image_url: catalogItemDirect.hero_image_url,
          category: catalogItemDirect.category,
          created_by: catalogItemDirect.created_by,
          creator_id: catalogItemDirect.creator_id,
          access_status: "pending_payment" as const,
        } as any;
        console.log("[ressources/[id]] ✅ Created catalogItem from catalogItemDirect:", {
          id: catalogItem.id,
          item_type: catalogItem.item_type,
          title: catalogItem.title,
        });
      }
    } else {
      console.log("[ressources/[id]] ❌ catalogItemDirect not found for id:", id);
    }
    
    // Si pas trouvé, essayer de chercher par content_id dans catalog_items
    if (!catalogItem) {
      const { data: catalogItemByContentId } = await searchClient
        .from("catalog_items")
        .select("id, content_id, item_type, created_by, creator_id")
        .eq("content_id", id)
        .eq("item_type", "ressource")
        .maybeSingle();
      
      console.log("[ressources/[id]] Search by content_id:", { found: !!catalogItemByContentId, id: catalogItemByContentId?.id, created_by: catalogItemByContentId?.created_by });
      
      if (catalogItemByContentId) {
        catalogItem = await getCatalogItemById(catalogItemByContentId.id, organizationId, user?.id, serviceClient);
      }
    }
    
    // Si toujours pas trouvé, chercher directement dans la table resources
    if (!catalogItem) {
      console.log("[ressources/[id]] Trying direct lookup in resources table:", id);
      const { data: resourceDirect, error: resourceDirectError } = await searchClient
        .from("resources")
        .select("id, title, description, price, kind, created_by, owner_id, cover_url, thumbnail_url, slug")
        .eq("id", id)
        .maybeSingle();
      
      console.log("[ressources/[id]] Direct resources lookup:", { 
        found: !!resourceDirect, 
        id: resourceDirect?.id, 
        created_by: resourceDirect?.created_by,
        error: resourceDirectError?.message 
      });
      
      if (resourceDirect) {
        // Chercher d'abord le catalog_item correspondant
        const { data: catalogItemForResource } = await searchClient
          .from("catalog_items")
          .select("*")
          .eq("content_id", resourceDirect.id)
          .eq("item_type", "ressource")
    .maybeSingle();

        if (catalogItemForResource) {
          console.log("[ressources/[id]] Found catalog_item for resource:", catalogItemForResource.id);
          catalogItem = await getCatalogItemById(catalogItemForResource.id, organizationId, user?.id, serviceClient);
        } else {
          // Utiliser getCatalogItemById avec l'ID de la ressource (qui cherchera dans resources si pas trouvé dans catalog_items)
          catalogItem = await getCatalogItemById(resourceDirect.id, organizationId, user?.id, serviceClient);
          
          // Si toujours pas trouvé, créer un item virtuel avec toutes les données
          if (!catalogItem) {
            console.log("[ressources/[id]] Creating virtual catalog item from resource");
            catalogItem = {
              id: resourceDirect.id,
              content_id: resourceDirect.id,
              item_type: "ressource" as const,
              title: resourceDirect.title || "",
              description: resourceDirect.description || null,
              short_description: resourceDirect.description || null,
              price: (resourceDirect as any).price || 0,
              is_free: !(resourceDirect as any).price || (resourceDirect as any).price === 0,
              thumbnail_url: (resourceDirect as any).thumbnail_url || (resourceDirect as any).cover_url || null,
              hero_image_url: (resourceDirect as any).cover_url || (resourceDirect as any).thumbnail_url || null,
              category: (resourceDirect as any).kind || null,
              created_by: resourceDirect.created_by || resourceDirect.owner_id,
              creator_id: resourceDirect.created_by || resourceDirect.owner_id,
              slug: (resourceDirect as any).slug || null,
              access_status: "pending_payment" as const,
            } as any;
          }
        }
      }
    }
  } else {
      // C'est un slug, chercher d'abord dans catalog_items par slug ou titre
      const { data: catalogItemBySlug } = await searchClient
        .from("catalog_items")
        .select("id, content_id, item_type, created_by, creator_id")
        .or(`slug.eq.${id},title.ilike.%${id.replace(/-/g, " ")}%`)
        .eq("is_active", true)
        .maybeSingle();

      console.log("[ressources/[id]] Search by slug/title:", { found: !!catalogItemBySlug, id: catalogItemBySlug?.id, created_by: catalogItemBySlug?.created_by });

    if (catalogItemBySlug) {
      catalogItem = await getCatalogItemById(catalogItemBySlug.id, organizationId, user?.id, serviceClient);
    } else {
      // Si pas trouvé dans catalog_items, chercher dans resources par slug ou titre
      const { data: resource } = await searchClient
        .from("resources")
        .select("id, created_by, owner_id")
        .or(`slug.eq.${id},title.ilike.%${id.replace(/-/g, " ")}%`)
        .maybeSingle();

      console.log("[ressources/[id]] Search in resources table:", { found: !!resource, id: resource?.id });

      if (resource) {
        resourceId = resource.id;
        catalogItem = await getCatalogItemById(resourceId, organizationId, user?.id, serviceClient);
      } else {
        // Si pas trouvé dans resources, chercher dans tests
        const { data: test } = await searchClient
          .from("tests")
          .select("id, title, created_by")
          .or(`slug.eq.${id},title.ilike.%${id.replace(/-/g, " ")}%`)
          .maybeSingle();

        console.log("[ressources/[id]] Search in tests table:", { found: !!test, id: test?.id, title: test?.title });

        if (test) {
          resourceId = test.id;
          catalogItem = await getCatalogItemById(resourceId, organizationId, user?.id, serviceClient);
        } else {
          // Dernière tentative : chercher dans catalog_items par titre partiel
          const { data: catalogItemByTitle } = await searchClient
            .from("catalog_items")
            .select("id, content_id, item_type, created_by, creator_id")
            .ilike("title", `%${id.replace(/-/g, " ")}%`)
            .eq("is_active", true)
            .maybeSingle();

          console.log("[ressources/[id]] Final search by partial title:", { found: !!catalogItemByTitle, id: catalogItemByTitle?.id, created_by: catalogItemByTitle?.created_by });

          if (catalogItemByTitle) {
            catalogItem = await getCatalogItemById(catalogItemByTitle.id, organizationId, user?.id, serviceClient);
          } else {
            console.error("[ressources/[id]] ❌ Resource not found after all attempts for ID:", id);
            notFound();
          }
        }
      }
    }
  }

  // Si toujours pas trouvé, essayer avec l'ID original via getCatalogItemById
  if (!catalogItem) {
    console.log("[ressources/[id]] Trying getCatalogItemById with original id:", id);
    catalogItem = await getCatalogItemById(id, organizationId, user?.id);
  }

  // Si toujours pas trouvé, essayer une recherche directe dans catalog_items sans filtre créateur
  if (!catalogItem && isIdUUID) {
    console.log("[ressources/[id]] Trying direct catalog_items lookup without creator filter:", id);
    const { data: directItem } = await supabase
      .from("catalog_items")
      .select("*")
      .or(`id.eq.${id},content_id.eq.${id}`)
      .eq("item_type", "ressource")
      .eq("is_active", true)
      .maybeSingle();
    
    if (directItem) {
      console.log("[ressources/[id]] Found direct item:", { id: directItem.id, created_by: directItem.created_by });
      // Créer un objet catalogItem minimal depuis directItem
      catalogItem = {
        id: directItem.id,
        content_id: directItem.content_id,
        item_type: directItem.item_type,
        title: directItem.title,
        description: directItem.description,
        short_description: directItem.short_description,
        price: directItem.price || 0,
        is_free: directItem.is_free || false,
        thumbnail_url: directItem.thumbnail_url,
        hero_image_url: directItem.hero_image_url,
        category: directItem.category,
        created_by: directItem.created_by,
        creator_id: directItem.creator_id,
        access_status: "pending_payment" as const,
      } as any;
    }
  }

  if (!catalogItem) {
    console.error("[ressources/[id]] ❌❌❌ Catalog item not found after all attempts:", { id, isIdUUID });
    console.error("[ressources/[id]] All search attempts failed. Calling notFound()");
    notFound();
  }
  
  console.log("[ressources/[id]] ✅✅✅ Final catalogItem found:", {
    id: catalogItem.id,
    item_type: catalogItem.item_type,
    title: catalogItem.title,
    content_id: catalogItem.content_id,
  });
  
  console.log("[ressources/[id]] Catalog item found:", { 
    id: catalogItem.id, 
    item_type: catalogItem.item_type,
    title: catalogItem.title,
    created_by: (catalogItem as any).created_by,
    creator_id: (catalogItem as any).creator_id
  });

  // Accepter les ressources et les tests
  if (catalogItem.item_type !== "ressource" && catalogItem.item_type !== "test") {
    console.error("[ressources/[id]] ❌ Unsupported item type:", { id, item_type: catalogItem.item_type });
    console.error("[ressources/[id]] Calling notFound() due to unsupported item type");
    notFound();
  }
  
  console.log("[ressources/[id]] ✅ Item type is valid:", catalogItem.item_type);

  // Utiliser le catalog_item_id réel (peut être différent de l'id passé en paramètre)
  const catalogItemId = catalogItem.id;

  // Vérifier si l'utilisateur a accès AVANT de récupérer les détails sensibles
  // IMPORTANT : Seul le créateur (Jessica) ou les utilisateurs ayant payé peuvent accéder
  // Même les ressources gratuites nécessitent un accès explicite dans catalog_access
  
  // Vérifier si l'utilisateur est Jessica Contentin (le créateur)
  // Utiliser plusieurs méthodes pour être sûr :
  // 1. Comparer user.id avec jessicaProfile.id
  // 2. Vérifier l'email de l'utilisateur
  // 3. Vérifier que le catalog_item a été créé par Jessica
  let isCreator = false;
  if (user?.id && jessicaProfile?.id) {
    // Méthode 1 : Comparer les IDs
    isCreator = String(user.id) === String(jessicaProfile.id);
    
    // Méthode 2 : Si les IDs ne correspondent pas, vérifier l'email
    if (!isCreator && user.email) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .maybeSingle();
      
      if (userProfile?.email === JESSICA_CONTENTIN_EMAIL) {
        isCreator = true;
      }
    }
  }
  
  // Méthode 3 : Vérifier que le catalog_item a été créé par Jessica (même si l'utilisateur n'est pas connecté)
  // Si le catalog_item a été créé par Jessica, elle a toujours accès
  const catalogItemCreatorId = (catalogItem as any).created_by || (catalogItem as any).creator_id;
  const isItemCreatedByJessica = catalogItemCreatorId && jessicaProfile?.id && String(catalogItemCreatorId) === String(jessicaProfile.id);
  
  // Si l'item a été créé par Jessica ET que l'utilisateur connecté est Jessica, accès garanti
  if (isItemCreatedByJessica && user?.id && jessicaProfile?.id && String(user.id) === String(jessicaProfile.id)) {
    isCreator = true;
  }
  
  console.log("[ressources/[id]] Creator check:", {
    userId: user?.id,
    userEmail: user?.email,
    jessicaProfileId,
    isCreator,
    isItemCreatedByJessica,
    catalogItemCreatorId,
  });
  
  // Vérifier explicitement dans catalog_access si l'utilisateur a un accès
  // C'est la SEULE source de vérité pour l'accès utilisateur
  // Utiliser le catalog_item_id réel, pas l'id passé en paramètre
  // Vérifier soit par user_id (B2C) soit par organization_id (B2B)
  // IMPORTANT: user_id dans catalog_access correspond à profiles.id (qui est aussi auth.users.id)
  let userAccess = null;
  if (user?.id || organizationId) {
    // TOUJOURS utiliser le service role client pour contourner RLS
    // Cela garantit que la vérification d'accès fonctionne même si l'utilisateur n'a pas les bonnes permissions RLS
    const accessClient = serviceClient || supabase;
    
    if (!serviceClient) {
      console.warn("[ressources/[id]] ⚠️ Service role client not available, using regular client (may fail due to RLS)");
    }
    
    console.log("[ressources/[id]] Checking access in catalog_access:", {
      catalogItemId,
      userId: user?.id,
      organizationId,
      usingServiceClient: !!serviceClient,
    });
    
    // Construire la requête selon qu'on a un user_id ou organization_id
    // IMPORTANT: user_id dans catalog_access correspond à profiles.id (qui est aussi auth.users.id)
    let accessQuery = accessClient
      .from("catalog_access")
      .select("access_status, user_id, catalog_item_id")
      .eq("catalog_item_id", catalogItemId);
    
    if (user?.id) {
      // Pour les accès B2C, vérifier user_id et s'assurer que organization_id est null
      accessQuery = accessQuery.eq("user_id", user.id).is("organization_id", null);
    } else if (organizationId) {
      // Pour les accès B2B, vérifier organization_id
      accessQuery = accessQuery.eq("organization_id", organizationId);
    }
    
    const { data: access, error: accessError } = await accessQuery.maybeSingle();
    
    if (accessError) {
      console.error("[ressources/[id]] ❌ Error checking access:", {
        error: accessError.message,
        code: accessError.code,
        details: accessError.details,
        hint: accessError.hint,
      });
    } else {
      console.log("[ressources/[id]] ✅ Access check result:", {
        found: !!access,
        accessStatus: access?.access_status,
        userId: access?.user_id,
        catalogItemId: access?.catalog_item_id,
        matchesUserId: access?.user_id === user?.id,
      });
    }
    
    userAccess = access;
  } else {
    console.log("[ressources/[id]] ⚠️ No user ID or organization ID, skipping access check");
  }
  
  // L'utilisateur a accès UNIQUEMENT si :
  // 1. Il est le créateur (Jessica) - TOUJOURS accès (même si la session échoue partiellement)
  // 2. Il a un accès explicite dans catalog_access (purchased, free, ou manually_granted)
  // Le access_status du catalogItem n'est pas suffisant, il faut vérifier catalog_access
  const hasExplicitAccess = userAccess && (
    userAccess.access_status === "purchased" ||
    userAccess.access_status === "free" ||
    userAccess.access_status === "manually_granted"
  );
  
  // Si l'item a été créé par Jessica ET que l'utilisateur est Jessica, accès garanti
  // Même si la vérification de session a échoué partiellement
  const hasAccess = isCreator || isItemCreatedByJessica || hasExplicitAccess;
  
  console.log("[ressources/[id]] Final access determination:", {
    isCreator,
    isItemCreatedByJessica,
    hasExplicitAccess,
    hasAccess,
    userAccessStatus: userAccess?.access_status,
  });

  // Récupérer les détails de la ressource ou du test UNIQUEMENT si l'utilisateur a accès
  // Pour protéger les URLs de fichiers/vidéos/audios
  let resourceData = null;
  let testData = null;
  let contentSlug: string | null = null;
  
  if (catalogItem.item_type === "ressource" && catalogItem.content_id) {
    if (hasAccess) {
      console.log("[ressources/[id]] ✅ User has access, fetching resource data with URLs for content_id:", catalogItem.content_id);
      const { data: resource, error: resourceError } = await supabase
        .from("resources")
        .select("id, title, description, kind, file_url, video_url, audio_url, slug")
        .eq("id", catalogItem.content_id)
        .maybeSingle();

      if (resourceError) {
        console.error("[ressources/[id]] ❌ Error fetching resource:", resourceError);
      } else {
        console.log("[ressources/[id]] ✅ Resource data fetched:", {
          id: resource?.id,
          title: resource?.title,
          hasFileUrl: !!resource?.file_url,
          hasVideoUrl: !!resource?.video_url,
          hasAudioUrl: !!resource?.audio_url,
          fileUrl: resource?.file_url,
        });
      }

      if (resource) {
        resourceData = resource;
        contentSlug = resource.slug || null;
      }
    } else {
      console.log("[ressources/[id]] ⚠️ User does NOT have access, fetching resource metadata only (no URLs)");
    // Si pas d'accès, récupérer seulement les métadonnées publiques (pas les URLs)
    const { data: resource } = await supabase
      .from("resources")
        .select("id, title, description, kind, slug")
      .eq("id", catalogItem.content_id)
        .maybeSingle();

    if (resource) {
      resourceData = {
        ...resource,
        // Pas d'accès, donc pas d'URLs
        file_url: null,
        video_url: null,
        audio_url: null,
      };
        contentSlug = resource.slug || null;
      }
    }
  } else if (catalogItem.item_type === "test" && catalogItem.content_id) {
    // Pour les tests, récupérer les données du test
    const { data: test } = await supabase
      .from("tests")
      .select("id, title, description, slug")
      .eq("id", catalogItem.content_id)
      .maybeSingle();
    
    if (test) {
      testData = test;
      contentSlug = test.slug || null;
    }
  }

  // Déterminer l'image hero
  let heroImage = catalogItem.hero_image_url || catalogItem.thumbnail_url;

  // Déterminer l'accroche
  let accroche = catalogItem.short_description || catalogItem.description || resourceData?.description || testData?.description;

  // URL vers la ressource (si accès) - PROTÉGÉ : null si pas d'accès
  // IMPORTANT: Si l'utilisateur a accès, TOUJOURS récupérer les URLs même si resourceData n'a pas été chargé avec les URLs
  // Cela peut arriver si hasAccess était false au moment du chargement initial
  // SÉCURITÉ: Utiliser une route proxy pour masquer l'URL Supabase
  let resourceUrl = null;
  
  // Si l'utilisateur a accès, récupérer les données avec les URLs pour s'assurer qu'on a le file_url
  if (hasAccess && catalogItem.item_type === "ressource" && catalogItem.content_id) {
    // Toujours récupérer les données avec les URLs si l'utilisateur a accès
    // Utiliser le service role client pour contourner RLS si nécessaire
    const resourceClient = serviceClient || supabase;
    const { data: resourceWithUrls, error: resourceError } = await resourceClient
      .from("resources")
      .select("id, title, description, kind, file_url, video_url, audio_url, slug")
      .eq("id", catalogItem.content_id)
      .maybeSingle();
    
    if (resourceError) {
      console.error("[ressources/[id]] ❌ Error fetching resource with URLs:", resourceError);
    } else if (resourceWithUrls) {
      resourceData = resourceWithUrls;
      
      // SÉCURITÉ: Utiliser la route proxy pour masquer l'URL Supabase
      // Si c'est un PDF, utiliser /api/resources/[id]/pdf au lieu de l'URL Supabase directe
      if (resourceWithUrls.file_url) {
        // Utiliser l'ID du catalog_item pour la route proxy (plus sécurisé)
        resourceUrl = `/api/resources/${catalogItem.id}/pdf`;
        console.log("[ressources/[id]] ✅ Utilisation de la route proxy pour le PDF:", resourceUrl);
      } else {
        // Pour les vidéos/audios, utiliser l'URL directe (ou créer une route proxy similaire si nécessaire)
        resourceUrl = resourceWithUrls.video_url || resourceWithUrls.audio_url;
      }
      
      console.log("[ressources/[id]] ✅ Resource data with URLs fetched (user has access):", {
        hasFileUrl: !!resourceWithUrls.file_url,
        hasVideoUrl: !!resourceWithUrls.video_url,
        hasAudioUrl: !!resourceWithUrls.audio_url,
        resourceUrl,
        usingProxy: !!resourceWithUrls.file_url,
        fileUrl: resourceWithUrls.file_url,
        videoUrl: resourceWithUrls.video_url,
        audioUrl: resourceWithUrls.audio_url,
        resourceId: resourceWithUrls.id,
        resourceTitle: resourceWithUrls.title,
      });
      
      // Si resourceUrl est toujours null, c'est qu'il n'y a pas de fichier associé
      if (!resourceUrl) {
        console.warn("[ressources/[id]] ⚠️ WARNING: User has access but no file_url, video_url, or audio_url found for resource:", {
          resourceId: resourceWithUrls.id,
          resourceTitle: resourceWithUrls.title,
          kind: resourceWithUrls.kind,
        });
      }
    } else {
      console.warn("[ressources/[id]] ⚠️ Resource not found for content_id:", catalogItem.content_id);
    }
  } else if (hasAccess && resourceData) {
    // Si on a déjà resourceData avec les URLs, utiliser directement
    // SÉCURITÉ: Utiliser la route proxy pour les PDFs
    if (resourceData.file_url) {
      resourceUrl = `/api/resources/${catalogItem.id}/pdf`;
    } else {
      resourceUrl = resourceData.video_url || resourceData.audio_url;
    }
  }
  
  console.log("[ressources/[id]] Resource URL determination:", {
    hasAccess,
    hasResourceData: !!resourceData,
    fileUrl: resourceData?.file_url,
    videoUrl: resourceData?.video_url,
    audioUrl: resourceData?.audio_url,
    resourceUrl,
    willShowDownloadButton: !!resourceUrl,
    willShowError: hasAccess && !resourceUrl,
  });

  // URL vers la page de paiement (si pas d'accès)
  // Si la ressource a une URL Stripe Checkout configurée, l'utiliser
  // Sinon, créer une session de paiement à la demande via l'API
  const stripeCheckoutUrl = (catalogItem as any).stripe_checkout_url;
  const paymentUrl = stripeCheckoutUrl 
    ? stripeCheckoutUrl
    : `/api/stripe/create-checkout-session-jessica`; // API route qui créera la session à la demande

  // Couleurs de branding Jessica Contentin
  const bgColor = "#FFFFFF"; // Blanc
  const surfaceColor = "#F8F5F0"; // Beige clair
  const textColor = "#2F2A25"; // Marron foncé
  const primaryColor = "#C6A664"; // Doré
  const accentColor = "#D4AF37"; // Doré accent

  // Déterminer l'icône selon le type de ressource
  const getResourceIcon = () => {
    if (resourceData?.kind === "video") {
      return <Video className="h-6 w-6" />;
    } else if (resourceData?.kind === "audio") {
      return <Headphones className="h-6 w-6" />;
    }
    return <FileText className="h-6 w-6" />;
  };

  // Déterminer le texte du bouton
  const getButtonText = () => {
    if (hasAccess && resourceUrl) {
      // Si déjà acheté : "Accéder"
      return "Accéder";
    }
    // Si pas payé : "Acheter"
    if (catalogItem.price && catalogItem.price > 0) {
      return `Acheter pour ${catalogItem.price}€`;
    }
    return "Acheter";
  };

  // Vérifier si c'est un test et déterminer l'URL
  const isTest = catalogItem.item_type === "test";
  let testPageUrl: string | null = null;
  if (isTest) {
    if (catalogItem.title?.toLowerCase().includes("soft skills") || catalogItem.title === "Soft Skills – Profil 360") {
      // Pour le test Soft Skills, chercher le questionnaire mental_health
      const { data: questionnaire } = await supabase
        .from("mental_health_questionnaires")
        .select("id")
        .eq("title", "Soft Skills – Profil 360")
        .maybeSingle();
      
      if (questionnaire) {
        testPageUrl = `/dashboard/apprenant/questionnaires/${questionnaire.id}`;
      } else {
        // Fallback : utiliser la route catalogue test qui gère la redirection
        testPageUrl = `/dashboard/catalogue/test/${catalogItem.id || catalogItem.content_id}`;
      }
    } else {
      // Pour les autres tests, utiliser la route dashboard
      testPageUrl = `/dashboard/catalogue/test/${catalogItem.id || catalogItem.content_id}`;
    }
  }
  
  // Pour les tests, si l'utilisateur a accès, on peut afficher le bouton "Accéder" même sans resourceUrl
  // IMPORTANT: Si l'utilisateur a accès, on doit afficher le bouton de téléchargement/accès même si resourceUrl est null
  // car on peut récupérer les URLs après
  const canAccess = hasAccess;
  
  console.log("[ressources/[id]] Can access determination:", {
    hasAccess,
    resourceUrl,
    testPageUrl,
    canAccess,
    isTest,
    itemType: catalogItem.item_type,
    hasFileUrl: !!resourceData?.file_url,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Nettoyer les paramètres de paiement Stripe de l'URL */}
      <PaymentCleanupWrapper />
      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            href="/jessica-contentin/ressources"
            className="inline-flex items-center gap-2 text-sm hover:underline transition-colors"
            style={{ color: primaryColor }}
          >
            ← Retour aux ressources
          </Link>
        </div>

        {/* Section Hero - Image à gauche, CTA à droite (au-dessus de la ligne de flottaison) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Image à gauche - Agrandie */}
          {heroImage && (
            <div className="lg:col-span-2">
              <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-xl">
                <Image
                  src={heroImage}
                  alt={catalogItem.title}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Étiquette type de ressource */}
                <div className="absolute top-4 left-4 z-10">
                  <span 
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-lg backdrop-blur-sm"
                    style={{ 
                      backgroundColor: `${primaryColor}E6`,
                      color: "#FFFFFF",
                    }}
                  >
                    {catalogItem.item_type === "test" ? "🧪 Test" :
                     resourceData?.kind === "video" ? "📹 Vidéo" :
                     resourceData?.kind === "audio" ? "🎧 Audio" :
                     "📄 Ressource PDF"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contenu principal à droite */}
          <div className={heroImage ? "lg:col-span-3 space-y-6" : "lg:col-span-5 space-y-6"}>
            <div className="flex flex-wrap items-center gap-3">
          {catalogItem.category && (
            <span 
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ 
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              {catalogItem.category}
            </span>
          )}
              {/* Étiquette type de ressource (si pas d'image) */}
              {!heroImage && (
                <span 
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ 
                    backgroundColor: `${primaryColor}20`,
                    color: primaryColor,
                  }}
                >
                  {catalogItem.item_type === "test" ? "🧪 Test" :
                   resourceData?.kind === "video" ? "📹 Vidéo" :
                   resourceData?.kind === "audio" ? "🎧 Audio" :
                   "📄 Ressource PDF"}
                </span>
              )}
            </div>
            <h1 
              className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: textColor }}
          >
            {catalogItem.title}
          </h1>
          {accroche && (
            <p 
                className="text-lg text-[#2F2A25]/80"
              style={{ color: `${textColor}CC` }}
            >
              {accroche}
            </p>
          )}

            {/* CTA et prix - Au-dessus de la ligne de flottaison */}
            <div 
              className="rounded-2xl border-2 p-6 shadow-lg"
              style={{ 
                borderColor: `${primaryColor}40`,
                backgroundColor: surfaceColor,
              }}
            >
              {canAccess ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <div className="text-xl">✅</div>
                    </div>
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: textColor }}
                    >
                      Accès activé
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: `${textColor}AA` }}
                    >
                      Vous avez accès à cette {isTest ? "test" : "ressource"}
                    </p>
                  </div>
                  {testPageUrl ? (
                    <Button 
                      asChild 
                      className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <Link href={testPageUrl}>
                        <Play className="h-5 w-5 mr-2" />
                        <span className="ml-2">Accéder au test</span>
                      </Link>
                    </Button>
                  ) : catalogItem.item_type === "module" || catalogItem.item_type === "parcours" ? (
                    <Button 
                      asChild 
                      className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <Link href={`/dashboard/catalogue/${catalogItem.item_type}/${catalogItem.id || catalogItem.content_id}`}>
                        <Play className="h-5 w-5 mr-2" />
                        <span className="ml-2">Accéder au module</span>
                      </Link>
                    </Button>
                  ) : resourceUrl ? (
                    <div className="space-y-3">
                      <Button 
                        asChild 
                        className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        style={{
                          backgroundColor: primaryColor,
                        }}
                      >
                        <a 
                          href={resourceUrl} 
                          target={resourceData?.file_url ? "_blank" : "_blank"} 
                          rel="noopener noreferrer" 
                          download={resourceData?.file_url ? `${catalogItem.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf` : undefined}
                        >
                          {getResourceIcon()}
                          <span className="ml-2">
                            {resourceData?.file_url 
                              ? "Télécharger la ressource" 
                              : resourceData?.kind === "video" || resourceData?.kind === "audio"
                              ? "Accéder à la ressource"
                              : "Accéder"}
                          </span>
                        </a>
                      </Button>
                      {resourceData?.file_url && (
                        <p className="text-xs text-center" style={{ color: `${textColor}80` }}>
                          📄 Format PDF - Téléchargement sécurisé via notre serveur
                        </p>
                      )}
                    </div>
                  ) : (
                    // Si l'utilisateur a accès mais que resourceUrl est null (ne devrait pas arriver normalement)
                    // Afficher un message d'erreur avec un lien pour recharger la page
                    <div className="space-y-3">
                      <p className="text-sm text-center" style={{ color: `${textColor}AA` }}>
                        ⚠️ Impossible de charger la ressource. Veuillez réessayer.
                      </p>
                      <Button 
                        asChild
                        className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                        style={{
                          backgroundColor: primaryColor,
                        }}
                      >
                        <a href={`/ressources/${catalogItem.id || catalogItem.content_id}`}>
                          <span className="ml-2">Réessayer</span>
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <ResourcePurchaseSection
                  user={user}
                  hasAccess={hasAccess}
                  catalogItemId={catalogItemId}
                  contentId={catalogItem.content_id || catalogItemId}
                  price={catalogItem.price || 0}
                  title={catalogItem.title}
                  contentType={catalogItem.item_type as "module" | "test" | "ressource" | "parcours" || "ressource"}
                  isFree={catalogItem.is_free || false}
                  stripeCheckoutUrl={stripeCheckoutUrl}
                  primaryColor={primaryColor}
                  textColor={textColor}
                  currentPath={`/ressources/${id}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale - Description et contenu */}
          <div className="lg:col-span-2 space-y-8">
            {/* Métadonnées */}
            <div className="flex flex-wrap items-center gap-3">
              {catalogItem.is_free && (
                <span 
                  className="rounded-full border-2 px-4 py-2 font-semibold"
                  style={{ 
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor,
                  }}
                >
                  Gratuit
                </span>
              )}
              {resourceData?.kind && (
                <span 
                  className="rounded-full border-2 px-4 py-2 font-medium"
                  style={{ 
                    borderColor: `${primaryColor}60`,
                    backgroundColor: `${primaryColor}05`,
                    color: textColor,
                  }}
                >
                  {resourceData.kind === "video" ? "📹 Vidéo" : resourceData.kind === "audio" ? "🎧 Audio" : "📄 Document"}
                </span>
              )}
            </div>

            {/* Description détaillée */}
            {catalogItem.description && (
              <section 
                className="rounded-3xl border-2 p-8 md:p-10 mb-8"
                style={{ 
                  borderColor: `${primaryColor}30`,
                  backgroundColor: surfaceColor,
                }}
              >
                <h2 
                  className="text-2xl md:text-3xl font-bold mb-6"
                  style={{ color: textColor }}
                >
                  À propos de cette ressource
                </h2>
                <div 
                  className="prose prose-lg max-w-none"
                  style={{ color: `${textColor}CC` }}
                >
                  <p 
                    className="text-base md:text-lg leading-relaxed whitespace-pre-wrap"
                    style={{ color: `${textColor}CC` }}
                  >
                    {catalogItem.description}
                  </p>
                </div>
              </section>
            )}

            {/* Section "Ce que vous allez découvrir" - Exemple de contenu */}
            <section 
              className="rounded-3xl border-2 p-8 md:p-10 mb-8"
              style={{ 
                borderColor: `${primaryColor}30`,
                backgroundColor: surfaceColor,
              }}
            >
              <h2 
                className="text-2xl md:text-3xl font-bold mb-6"
                      style={{ color: textColor }}
                    >
                Ce que vous allez découvrir
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: textColor }}>
                      Comprendre les mécanismes du sommeil
                    </h3>
                    <p className="text-base" style={{ color: `${textColor}CC` }}>
                      Découvrez les cycles de sommeil et leur importance pour le développement de l'enfant.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: textColor }}>
                      Identifier les troubles du sommeil
                    </h3>
                    <p className="text-base" style={{ color: `${textColor}CC` }}>
                      Apprenez à reconnaître les signes de troubles du sommeil et comment y remédier.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                    <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                    >
                    3
                    </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: textColor }}>
                      Mettre en place des routines efficaces
                    </h3>
                    <p className="text-base" style={{ color: `${textColor}CC` }}>
                      Des stratégies pratiques et des outils concrets pour améliorer le sommeil de votre enfant.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Colonne latérale - Informations supplémentaires (optionnel) */}
          <div className="lg:col-span-1">
            {!catalogItem.is_free && !canAccess && (
              <div 
                className="sticky top-8 rounded-2xl border-2 p-6 shadow-lg"
                      style={{
                  borderColor: `${primaryColor}30`,
                  backgroundColor: surfaceColor,
                }}
              >
                <h3 
                  className="text-lg font-bold mb-4"
                  style={{ color: textColor }}
                >
                  Avantages
                </h3>
                <ul className="space-y-3 text-sm" style={{ color: `${textColor}AA` }}>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Accès immédiat après paiement</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Accès à vie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>Support inclus</span>
                        </li>
                      </ul>
                    </div>
                  )}
          </div>
        </div>
      </div>
    </div>
  );
}

