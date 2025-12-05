import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { JessicaContentinHeader } from "@/components/jessica-contentin/header";
import { HeroImage } from "@/components/catalogue/hero-image";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { Clock, Target, Award, CheckCircle2, Brain, Users, TrendingUp, BarChart3 } from "lucide-react";
import { AddToCartButton } from "@/components/catalogue/add-to-cart-button";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogTestDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  // Récupérer l'item du catalogue AVANT de vérifier l'utilisateur pour détecter si c'est Jessica
  // On utilise le service role pour pouvoir lire sans authentification
  const serviceClient = await getServiceRoleClient();
  const tempCatalogItem = serviceClient 
    ? await getCatalogItemById(id, undefined, undefined, serviceClient)
    : null;

  // Détecter si c'est un test de Jessica Contentin AVANT la redirection
  let isJessicaContentin = false;
  let creatorEmail = null;
  if (tempCatalogItem && (tempCatalogItem as any).creator_id && serviceClient) {
    const { data: creatorProfile } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("id", (tempCatalogItem as any).creator_id)
      .maybeSingle();
    
    creatorEmail = creatorProfile?.email || null;
    isJessicaContentin = creatorEmail === "contentin.cabinet@gmail.com";
  }

  // Récupérer l'organisation de l'utilisateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Rediriger vers la bonne page de login selon le créateur
    if (isJessicaContentin) {
      redirect(`/jessica-contentin/login?next=${encodeURIComponent(`/dashboard/catalogue/test/${id}`)}`);
    } else {
      redirect(`/login?next=${encodeURIComponent(`/dashboard/catalogue/test/${id}`)}`);
    }
  }

  // Récupérer le profil pour obtenir l'organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.org_id || undefined;

  // Récupérer l'item du catalogue (peut être dans catalog_items ou directement dans tests)
  const catalogItem = await getCatalogItemById(id, organizationId, user.id);

  if (!catalogItem) {
    console.error("[catalogue/test] Catalog item not found for ID:", id);
    notFound();
  }

  if (catalogItem.item_type !== "test") {
    console.error("[catalogue/test] Item is not a test, type:", catalogItem.item_type);
    notFound();
  }

  // Récupérer le branding du Super Admin créateur du test
  let branding = null;
  if (catalogItem && (catalogItem as any).creator_id) {
    branding = await getSuperAdminBranding((catalogItem as any).creator_id);
    
    // Récupérer l'email du créateur pour détecter si c'est Jessica (si pas déjà fait)
    if (!creatorEmail) {
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", (catalogItem as any).creator_id)
        .maybeSingle();
      
      creatorEmail = creatorProfile?.email || null;
      isJessicaContentin = creatorEmail === "contentin.cabinet@gmail.com";
    }
  }

  // Récupérer les détails du test depuis la table tests
  let testData = null;
  if (catalogItem.content_id) {
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("id, title, description, duration, evaluation_type, skills, display_format, questions, slug, builder_snapshot")
      .eq("id", catalogItem.content_id)
      .maybeSingle();

    if (testError) {
      console.error("[catalogue/test] Error fetching test data:", testError);
    }

    if (test) {
      testData = test;
      console.log("[catalogue/test] Test data retrieved:", {
        id: test.id,
        title: test.title,
        hasSlug: !!test.slug,
        slug: test.slug,
        hasBuilderSnapshot: !!(test as any).builder_snapshot,
        questionnaireId: (test as any).builder_snapshot?.questionnaireId || null,
      });
    } else {
      console.warn("[catalogue/test] Test data not found for content_id:", catalogItem.content_id);
      
      // Si le test n'est pas dans la table tests, chercher le questionnaire mental_health
      // Le test "Soft Skills – Profil 360" utilise un questionnaire mental_health
      if (catalogItem.title === "Soft Skills – Profil 360" || catalogItem.title?.includes("Soft Skills")) {
        console.log("[catalogue/test] Searching for mental_health questionnaire for Soft Skills test");
        const { data: questionnaire } = await supabase
          .from("mental_health_questionnaires")
          .select("id, title")
          .eq("title", "Soft Skills – Profil 360")
          .maybeSingle();
        
        if (questionnaire) {
          console.log("[catalogue/test] Found mental_health questionnaire:", questionnaire.id);
          // Créer un objet testData factice avec le questionnaireId
          testData = {
            id: catalogItem.content_id,
            builder_snapshot: {
              questionnaireId: questionnaire.id,
            },
          } as any;
        }
      }
    }
  } else {
    console.warn("[catalogue/test] No content_id in catalogItem");
  }

  // Déterminer l'image hero
  let heroImage = catalogItem.hero_image_url || catalogItem.thumbnail_url;

  // Déterminer l'accroche
  let accroche = catalogItem.short_description || catalogItem.description || testData?.description;

  // Extraire les informations du test
  const duration = testData?.duration || catalogItem.duration;
  const evaluationType = testData?.evaluation_type;
  const skills = testData?.skills;
  const displayFormat = testData?.display_format;

  // Vérifier si l'utilisateur est le créateur du contenu
  const isCreator = (catalogItem as any).creator_id === user.id;
  
  // Déterminer le vrai catalog_item_id
  // Si catalogItem.id correspond à un content_id (test trouvé directement), 
  // il faut trouver le catalog_item_id correspondant dans catalog_items
  let catalogItemId = catalogItem.id;
  
  // Vérifier si catalogItem.id est un content_id (test trouvé directement)
  // Si oui, chercher le catalog_item_id correspondant
  if (catalogItem.content_id && catalogItem.id === catalogItem.content_id) {
    // L'ID passé est un content_id, chercher le catalog_item_id
    const { data: catalogItemFromDb } = await supabase
      .from("catalog_items")
      .select("id")
      .eq("content_id", catalogItem.content_id)
      .eq("item_type", "test")
      .maybeSingle();
    
    if (catalogItemFromDb) {
      catalogItemId = catalogItemFromDb.id;
      console.log("[catalogue/test] Found catalog_item_id:", catalogItemId, "for content_id:", catalogItem.content_id);
    } else {
      console.warn("[catalogue/test] No catalog_item found for content_id:", catalogItem.content_id);
    }
  }
  
  // Vérifier explicitement dans catalog_access si l'utilisateur a un accès
  // C'est la SEULE source de vérité pour l'accès utilisateur
  // Essayer d'abord avec le catalog_item_id
  let query = supabase
    .from("catalog_access")
    .select("access_status")
    .eq("catalog_item_id", catalogItemId);
  
  // Construire la condition OR correctement
  if (organizationId) {
    query = query.or(`user_id.eq.${user.id},organization_id.eq.${organizationId}`);
  } else {
    query = query.eq("user_id", user.id);
  }
  
  let { data: userAccess, error: accessError } = await query.maybeSingle();
  
  // Si pas trouvé et qu'on a un content_id, essayer aussi avec le content_id
  // (au cas où l'accès aurait été créé avec le content_id au lieu du catalog_item_id)
  if (!userAccess && !accessError && catalogItem.content_id && catalogItem.content_id !== catalogItemId) {
    console.log("[catalogue/test] Access not found with catalog_item_id, trying with content_id:", catalogItem.content_id);
    let queryByContentId = supabase
      .from("catalog_access")
      .select("access_status, catalog_item_id")
      .eq("catalog_item_id", catalogItem.content_id);
    
    if (organizationId) {
      queryByContentId = queryByContentId.or(`user_id.eq.${user.id},organization_id.eq.${organizationId}`);
    } else {
      queryByContentId = queryByContentId.eq("user_id", user.id);
    }
    
    const { data: accessByContentId } = await queryByContentId.maybeSingle();
    
    if (accessByContentId) {
      userAccess = accessByContentId;
      console.log("[catalogue/test] Found access with content_id:", accessByContentId);
    }
  }
  
  if (accessError) {
    console.error("[catalogue/test] Error checking access:", accessError);
  }
  
  console.log("[catalogue/test] Access check:", {
    userId: user.id,
    userEmail: user.email,
    organizationId,
    catalogItemId,
    contentId: catalogItem.content_id,
    userAccess,
    hasAccess: !!userAccess,
    accessStatus: userAccess?.access_status,
  });
  
  // L'utilisateur a accès UNIQUEMENT si :
  // 1. Il est le créateur (Jessica) - TOUJOURS accès
  // 2. Il a un accès explicite dans catalog_access (purchased, free, ou manually_granted)
  // 3. L'item est gratuit (is_free = true)
  const hasExplicitAccess = userAccess && (
    userAccess.access_status === "purchased" ||
    userAccess.access_status === "free" ||
    userAccess.access_status === "manually_granted"
  );
  
  const hasAccess = isCreator || hasExplicitAccess || catalogItem.is_free;
  
  console.log("[catalogue/test] Final access decision:", {
    isCreator,
    hasExplicitAccess,
    isFree: catalogItem.is_free,
    hasAccess,
  });

  // URL vers la page de test
  // IMPORTANT: Chercher le questionnaire même si pas d'accès, pour afficher le bon bouton
  // Vérifier si le test utilise un questionnaire mental_health
  let testUrl = null;
  
  // D'abord, vérifier si c'est le test Soft Skills et chercher le questionnaire
  const isSoftSkillsTest = catalogItem.title === "Soft Skills – Profil 360" || catalogItem.title?.toLowerCase().includes("soft skills");
  
  if (isSoftSkillsTest) {
    console.log("[catalogue/test] Detected Soft Skills test, searching for questionnaire...");
    
    // Utiliser le service role client pour contourner RLS et trouver le questionnaire
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;
    
    // D'abord, vérifier si le content_id est directement un ID de questionnaire mental_health
    if (catalogItem.content_id) {
      console.log("[catalogue/test] Checking if content_id is a questionnaire ID:", catalogItem.content_id);
      const { data: directQuestionnaire } = await clientToUse
        .from("mental_health_questionnaires")
        .select("id, title")
        .eq("id", catalogItem.content_id)
        .maybeSingle();
      
      if (directQuestionnaire) {
        testUrl = `/dashboard/apprenant/questionnaires/${directQuestionnaire.id}`;
        console.log("[catalogue/test] content_id is a questionnaire ID, testUrl:", testUrl);
      }
    }
    
    // Si pas trouvé, chercher par titre
    if (!testUrl) {
      console.log("[catalogue/test] Starting comprehensive questionnaire search...");
      
      // 1. Chercher par titre exact avec is_active
      let { data: questionnaire, error: questionnaireError } = await clientToUse
        .from("mental_health_questionnaires")
        .select("id, title, created_by, org_id, is_active")
        .eq("title", "Soft Skills – Profil 360")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (questionnaireError) {
        console.error("[catalogue/test] Error searching questionnaire (exact + is_active):", questionnaireError);
      }
      
      console.log("[catalogue/test] Search result (exact + is_active):", {
        found: !!questionnaire,
        id: questionnaire?.id,
        title: questionnaire?.title,
      });
      
      // 2. Si pas trouvé, chercher sans le filtre is_active
      if (!questionnaire) {
        console.log("[catalogue/test] Trying without is_active filter...");
        const { data: questionnaires, error: questionnairesError } = await clientToUse
          .from("mental_health_questionnaires")
          .select("id, title, created_by, org_id, is_active")
          .eq("title", "Soft Skills – Profil 360")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (questionnairesError) {
          console.error("[catalogue/test] Error searching questionnaires (exact, no filter):", questionnairesError);
        }
        
        console.log("[catalogue/test] Search result (exact, no filter):", {
          count: questionnaires?.length || 0,
          questionnaires: questionnaires?.map(q => ({ id: q.id, title: q.title, is_active: q.is_active })) || [],
        });
        
        if (questionnaires && questionnaires.length > 0) {
          // Prendre le premier actif, sinon le premier
          questionnaire = questionnaires.find(q => q.is_active) || questionnaires[0];
          console.log("[catalogue/test] Found questionnaire without is_active filter:", questionnaire.id);
        }
      }
      
      // 3. Si toujours pas trouvé, chercher avec ILIKE (insensible à la casse)
      if (!questionnaire) {
        console.log("[catalogue/test] Trying with ILIKE search...");
        const { data: ilikeResults, error: ilikeError } = await clientToUse
          .from("mental_health_questionnaires")
          .select("id, title, created_by, org_id, is_active")
          .ilike("title", "%Soft Skills%")
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (ilikeError) {
          console.error("[catalogue/test] Error searching with ILIKE:", ilikeError);
        }
        
        console.log("[catalogue/test] Search result (ILIKE):", {
          count: ilikeResults?.length || 0,
          questionnaires: ilikeResults?.map(q => ({ id: q.id, title: q.title, is_active: q.is_active })) || [],
        });
        
        if (ilikeResults && ilikeResults.length > 0) {
          // Chercher celui qui correspond le mieux
          questionnaire = ilikeResults.find(q => 
            q.title.toLowerCase().includes("profil 360") || 
            q.title.toLowerCase().includes("soft skills")
          ) || ilikeResults[0];
          console.log("[catalogue/test] Found questionnaire with ILIKE:", questionnaire.id);
        }
      }
      
      // 4. Si trouvé, créer l'URL
      if (questionnaire) {
        testUrl = `/dashboard/apprenant/questionnaires/${questionnaire.id}`;
        console.log("[catalogue/test] ✅ Found questionnaire, testUrl:", testUrl);
      } else {
        // 5. Fallback final : utiliser le content_id comme questionnaire ID directement
        if (catalogItem.content_id) {
          console.log("[catalogue/test] ⚠️ No questionnaire found via search, assuming content_id is questionnaire ID:", catalogItem.content_id);
          testUrl = `/dashboard/apprenant/questionnaires/${catalogItem.content_id}`;
          console.log("[catalogue/test] Using content_id as questionnaire ID, testUrl:", testUrl);
        }
      }
    }
  } else if (hasAccess) {
    // Pour les autres tests, chercher l'URL seulement si l'utilisateur a accès
    if (testData) {
      const builderSnapshot = (testData as any)?.builder_snapshot as any;
      const questionnaireId = builderSnapshot?.questionnaireId;

      if (questionnaireId) {
        // Rediriger vers la page du questionnaire mental_health
        testUrl = `/dashboard/apprenant/questionnaires/${questionnaireId}`;
        console.log("[catalogue/test] Using questionnaireId from builder_snapshot:", testUrl);
      } else {
        // Sinon, utiliser la page de test classique
        const testSlug = (testData as any)?.slug || null;
        testUrl = testSlug
          ? `/dashboard/tests/${testSlug}`
          : catalogItem.content_id
            ? `/dashboard/tests/${catalogItem.content_id}`
            : null;
        console.log("[catalogue/test] Using test slug/content_id:", testUrl);
      }
    } else {
      // Pour les autres tests sans testData, utiliser l'ID du test comme URL
      testUrl = catalogItem.content_id 
        ? `/dashboard/tests/${catalogItem.content_id}`
        : `/dashboard/catalogue/test/${id}`;
      console.log("[catalogue/test] Using content_id as testUrl:", testUrl);
    }
  }
  
  // Si c'est le test Soft Skills et qu'on n'a toujours pas trouvé de testUrl, utiliser le fallback
  if (isSoftSkillsTest && !testUrl) {
    if (catalogItem.content_id) {
      testUrl = `/dashboard/apprenant/questionnaires/${catalogItem.content_id}`;
    } else {
      testUrl = `/dashboard/catalogue/test/${id}`;
    }
    console.log("[catalogue/test] Soft Skills fallback testUrl:", testUrl);
  }
  
  console.log("[catalogue/test] Test URL determination:", {
    hasAccess,
    hasTestData: !!testData,
    testUrl,
    testDataId: testData?.id,
    builderSnapshot: (testData as any)?.builder_snapshot ? "exists" : "null",
    questionnaireId: (testData as any)?.builder_snapshot?.questionnaireId || null,
    testSlug: (testData as any)?.slug || null,
    contentId: catalogItem.content_id,
    catalogItemTitle: catalogItem.title,
  });

  // URL vers la page de paiement (si pas d'accès)
  const paymentUrl = `/dashboard/catalogue/test/${id}/payment`;

  // Couleurs du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const accentColor = branding?.accent_color || '#D4AF37';

  // isSoftSkillsTest est déjà défini plus haut

  return (
    <BrandingProvider initialBranding={branding}>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {/* Utiliser le header de Jessica si c'est son test, sinon le header catalogue standard */}
        {isJessicaContentin ? (
          <JessicaContentinHeader />
        ) : (
          <CatalogTopNavClient />
        )}
      
        {/* Section Hero avec image cover */}
        <div 
          className="relative h-[80vh] min-h-[700px] overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          {/* Image de fond (cover) */}
          {heroImage ? (
            <>
              <HeroImage
                src={heroImage}
                alt={catalogItem.title}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-violet-900 to-purple-900" />
          )}
          
          {/* Contenu Hero centré */}
          <div className="relative z-10 flex h-full items-center justify-center px-6 md:px-12">
            <div className="max-w-4xl text-center">
              <h1 
                className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  color: '#FFFFFF',
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                }}
              >
                {catalogItem.title}
              </h1>
              
              {/* CTA "Ajouter à ma liste" ou "Démarrer le test" */}
              <div className="flex justify-center mt-12">
                {hasAccess ? (
                  testUrl ? (
                    <a
                      href={testUrl}
                      className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-white cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      Démarrer le test
                    </a>
                  ) : (
                    // Si pas de testUrl mais accès, créer une URL de fallback
                    <a
                      href={catalogItem.content_id ? `/dashboard/tests/${catalogItem.content_id}` : `/dashboard/catalogue/test/${id}`}
                      className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-white cursor-pointer"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      ✓ Accéder au test
                    </a>
                  )
                ) : (
                  <AddToCartButton
                    contentId={catalogItem.content_id || catalogItem.id}
                    contentType="test"
                    title={catalogItem.title}
                    price={catalogItem.price || 0}
                    thumbnailUrl={heroImage}
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section de présentation du test des soft skills */}
        {isSoftSkillsTest && (
          <div className="py-16 px-6 md:px-12" style={{ backgroundColor: bgColor }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    color: textColor,
                  }}
                >
                  Découvrez votre profil de soft skills
                </h2>
                <p 
                  className="text-lg md:text-xl max-w-3xl mx-auto"
                  style={{ color: textColor, opacity: 0.8 }}
                >
                  Un diagnostic complet pour identifier vos forces et vos axes de développement
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Colonne gauche : Description */}
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <Brain className="h-6 w-6" style={{ color: primaryColor }} />
                      Qu'est-ce que ce test ?
                    </h3>
                    <p style={{ color: textColor, opacity: 0.9, lineHeight: 1.8 }}>
                      Le test "Soft Skills – Profil 360" est un outil d'évaluation complet qui vous permet 
                      de mesurer 10 dimensions clés de vos compétences comportementales. En quelques minutes, 
                      vous obtiendrez un classement personnalisé de vos soft skills et des recommandations 
                      adaptées à votre profil.
                    </p>
                  </div>

                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <Target className="h-6 w-6" style={{ color: primaryColor }} />
                      Les 10 dimensions évaluées
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Gestion des émotions & du stress",
                        "Communication & influence",
                        "Persévérance & passage à l'action",
                        "Organisation, temps & priorités",
                        "Empathie & écoute active",
                        "Résolution de problèmes & pensée critique",
                        "Collaboration & gestion des conflits",
                        "Créativité & adaptabilité",
                        "Leadership & vision",
                        "Confiance en soi & prise de décision"
                      ].map((dimension, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: primaryColor }} />
                          <span style={{ color: textColor, opacity: 0.9 }}>{dimension}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Colonne droite : Avantages et résultats */}
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-2xl font-semibold mb-4 flex items-center gap-3"
                      style={{ color: textColor }}
                    >
                      <BarChart3 className="h-6 w-6" style={{ color: primaryColor }} />
                      Ce que vous obtiendrez
                    </h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Un classement personnalisé</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Découvrez quelles sont vos soft skills les plus développées et celles à renforcer
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Une analyse détaillée</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Comprenez votre profil avec des explications claires et bienveillantes
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Des recommandations pratiques</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Recevez des pistes d'action concrètes pour développer vos compétences
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                        <div>
                          <strong style={{ color: textColor }}>Un outil pour votre orientation</strong>
                          <p style={{ color: textColor, opacity: 0.8, fontSize: '0.95rem' }}>
                            Utilisez vos résultats pour affiner vos choix de métiers ou d'études
                          </p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      backgroundColor: surfaceColor,
                      border: `2px solid ${primaryColor}20`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Users className="h-8 w-8 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: textColor }}>
                          Pour qui ?
                        </h4>
                        <p style={{ color: textColor, opacity: 0.9, fontSize: '0.95rem' }}>
                          Ce test s'adresse à tous : étudiants en réflexion sur leur orientation, 
                          professionnels souhaitant mieux se connaître, ou toute personne curieuse 
                          de découvrir ses forces naturelles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      backgroundColor: surfaceColor,
                      border: `2px solid ${primaryColor}20`,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Clock className="h-8 w-8 flex-shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <h4 className="font-semibold mb-2" style={{ color: textColor }}>
                          Durée du test
                        </h4>
                        <p style={{ color: textColor, opacity: 0.9, fontSize: '0.95rem' }}>
                          Environ 25 minutes pour répondre aux 40 questions. Vous pouvez le faire 
                          à votre rythme et reprendre où vous vous êtes arrêté si nécessaire.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA final */}
              <div className="text-center mt-12">
                {!hasAccess && (
                  <div className="inline-block">
                    <AddToCartButton
                      contentId={catalogItem.content_id || catalogItem.id}
                      contentType="test"
                      title={catalogItem.title}
                      price={catalogItem.price || 0}
                      thumbnailUrl={heroImage}
                      size="lg"
                      className="px-10 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BrandingProvider>
  );
}

