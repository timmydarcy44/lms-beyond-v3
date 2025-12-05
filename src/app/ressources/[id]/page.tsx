import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { Button } from "@/components/ui/button";
import { getServerClient } from "@/lib/supabase/server";
import { Play, FileText, Video, Headphones, CreditCard } from "lucide-react";
import { BuyButton } from "@/components/jessica-contentin/buy-button";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

interface RessourceDetailPageProps {
  params: Promise<{ id: string }>;
}

// Fonction pour détecter si c'est un UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default async function RessourceDetailPage({ params }: RessourceDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  // Vérifier l'authentification (optionnel pour voir la page, mais requis pour accéder au contenu)
  const { data: { user } } = await supabase.auth.getUser();
  // Ne pas rediriger si l'utilisateur n'est pas connecté - permettre la visualisation de la page

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile) {
    notFound();
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

  if (isIdUUID) {
    // C'est un UUID, chercher directement par ID
    catalogItem = await getCatalogItemById(id, organizationId, user?.id);
  } else {
      // C'est un slug, chercher d'abord dans catalog_items par slug ou titre
      const { data: catalogItemBySlug } = await supabase
        .from("catalog_items")
        .select("id, content_id, item_type")
        .or(`slug.eq.${id},title.ilike.%${id}%`)
        .eq("created_by", jessicaProfile.id)
        .maybeSingle();

    if (catalogItemBySlug) {
      catalogItem = await getCatalogItemById(catalogItemBySlug.id, organizationId, user?.id);
    } else {
      // Si pas trouvé dans catalog_items, chercher dans resources par slug ou titre
      const { data: resource } = await supabase
        .from("resources")
        .select("id")
        .or(`slug.eq.${id},title.ilike.%${id}%`)
        .maybeSingle();

      if (resource) {
        resourceId = resource.id;
        catalogItem = await getCatalogItemById(resourceId, organizationId, user?.id);
      } else {
        // Si pas trouvé dans resources, chercher dans tests
        const { data: test } = await supabase
          .from("tests")
          .select("id, title")
          .or(`slug.eq.${id},title.ilike.%${id}%`)
          .maybeSingle();

        if (test) {
          // Si c'est le test de confiance en soi, rediriger vers la page dédiée
          const testTitle = (test as any).title;
          if (id === "test-confiance-en-soi" || (testTitle && testTitle.toLowerCase().includes("confiance en soi"))) {
            redirect("/test-confiance-en-soi");
          }
          resourceId = test.id;
          catalogItem = await getCatalogItemById(resourceId, organizationId, user?.id);
        } else {
          // Dernière tentative : chercher dans catalog_items par titre partiel
          const { data: catalogItemByTitle } = await supabase
            .from("catalog_items")
            .select("id, content_id, item_type")
            .ilike("title", `%${id.replace(/-/g, " ")}%`)
            .eq("created_by", jessicaProfile.id)
            .maybeSingle();

          if (catalogItemByTitle) {
            catalogItem = await getCatalogItemById(catalogItemByTitle.id, organizationId, user?.id);
          } else {
            notFound();
          }
        }
      }
    }
  }

  // Si toujours pas trouvé, essayer avec l'ID original
  if (!catalogItem) {
    catalogItem = await getCatalogItemById(id, organizationId, user?.id);
  }

  if (!catalogItem) {
    console.error("[ressources/[id]] Catalog item not found:", { id });
    notFound();
  }

  // Si c'est un test de confiance en soi, rediriger vers la page dédiée
  if (catalogItem.item_type === "test" && catalogItem.slug === "test-confiance-en-soi") {
    redirect("/test-confiance-en-soi");
  }

  // Accepter les ressources et les tests
  if (catalogItem.item_type !== "ressource" && catalogItem.item_type !== "test") {
    console.error("[ressources/[id]] Unsupported item type:", { id, item_type: catalogItem.item_type });
    notFound();
  }

  // Utiliser le catalog_item_id réel (peut être différent de l'id passé en paramètre)
  const catalogItemId = catalogItem.id;

  // Vérifier que c'est bien une ressource de Jessica Contentin
  // Vérifier created_by (colonne principale) ou creator_id (si existe)
  const catalogItemCreatorId = (catalogItem as any).created_by || (catalogItem as any).creator_id;
  const isResourceCreator = catalogItemCreatorId === jessicaProfile.id;
  if (!isResourceCreator) {
    console.error("[ressources/[id]] Resource creator mismatch:", { 
      catalogItemCreatorId: catalogItemCreatorId,
      created_by: (catalogItem as any).created_by,
      creator_id: (catalogItem as any).creator_id,
      jessicaProfileId: jessicaProfile.id 
    });
    notFound();
  }

  // Vérifier si l'utilisateur a accès AVANT de récupérer les détails sensibles
  // IMPORTANT : Seul le créateur (Jessica) ou les utilisateurs ayant payé peuvent accéder
  // Même les ressources gratuites nécessitent un accès explicite dans catalog_access
  const isCreator = user?.id === jessicaProfile.id;
  
  // Vérifier explicitement dans catalog_access si l'utilisateur a un accès
  // C'est la SEULE source de vérité pour l'accès utilisateur
  // Utiliser le catalog_item_id réel, pas l'id passé en paramètre
  // Vérifier soit par user_id (B2C) soit par organization_id (B2B)
  let userAccess = null;
  if (user?.id || organizationId) {
    const { data: access } = await supabase
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItemId)
      .or(`user_id.eq.${user?.id || 'null'},organization_id.eq.${organizationId || 'null'}`)
      .maybeSingle();
    userAccess = access;
  }
  
  // L'utilisateur a accès UNIQUEMENT si :
  // 1. Il est le créateur (Jessica) - TOUJOURS accès
  // 2. Il a un accès explicite dans catalog_access (purchased, free, ou manually_granted)
  // Le access_status du catalogItem n'est pas suffisant, il faut vérifier catalog_access
  const hasExplicitAccess = userAccess && (
    userAccess.access_status === "purchased" ||
    userAccess.access_status === "free" ||
    userAccess.access_status === "manually_granted"
  );
  
  const hasAccess = isCreator || hasExplicitAccess;

  // Récupérer les détails de la ressource ou du test UNIQUEMENT si l'utilisateur a accès
  // Pour protéger les URLs de fichiers/vidéos/audios
  let resourceData = null;
  let testData = null;
  let contentSlug: string | null = null;
  
  if (catalogItem.item_type === "ressource" && catalogItem.content_id) {
    if (hasAccess) {
      const { data: resource } = await supabase
        .from("resources")
        .select("id, title, description, kind, file_url, video_url, audio_url, slug")
        .eq("id", catalogItem.content_id)
        .maybeSingle();

      if (resource) {
        resourceData = resource;
        contentSlug = resource.slug || null;
      }
    } else {
      // Si pas d'accès, récupérer seulement les métadonnées publiques (pas les URLs)
      const { data: resource } = await supabase
        .from("resources")
        .select("id, title, description, kind, slug")
        .eq("id", catalogItem.content_id)
        .maybeSingle();

      if (resource) {
        resourceData = {
          ...resource,
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
  const resourceUrl = hasAccess && resourceData
    ? (resourceData.file_url || resourceData.video_url || resourceData.audio_url)
    : null;

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
  if (isTest && testData) {
    // Pour le test de confiance en soi, utiliser l'URL spéciale
    if (contentSlug === "test-confiance-en-soi") {
      testPageUrl = `/test-confiance-en-soi`;
    } else {
      // Pour les autres tests, utiliser la route dashboard
      testPageUrl = `/dashboard/catalogue/test/${catalogItem.content_id}`;
    }
  }
  
  // Pour les tests, si l'utilisateur a accès, on peut afficher le bouton "Accéder" même sans resourceUrl
  const canAccess = hasAccess && (resourceUrl || testPageUrl);

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
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
                  ) : resourceUrl ? (
                    <Button 
                      asChild 
                      className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                        {getResourceIcon()}
                        <span className="ml-2">{getButtonText()}</span>
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <div className="text-xl">🔒</div>
                    </div>
                    <h3 
                      className="text-lg font-bold mb-2"
                      style={{ color: textColor }}
                    >
                      {catalogItem.is_free ? "Accès gratuit" : "Acheter cette ressource"}
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: `${textColor}AA` }}
                    >
                      {catalogItem.is_free 
                        ? "Connectez-vous pour accéder gratuitement à cette ressource"
                        : "Achetez cette ressource pour y accéder immédiatement"}
                    </p>
                  </div>
                  {stripeCheckoutUrl ? (
                    <Button 
                      asChild 
                      className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    >
                      <a href={stripeCheckoutUrl} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="h-5 w-5" />
                        <span className="ml-2">{getButtonText()}</span>
                      </a>
                    </Button>
                  ) : (
                    <BuyButton
                      catalogItemId={catalogItemId}
                      contentId={catalogItem.content_id || catalogItemId}
                      price={catalogItem.price || 0}
                      title={catalogItem.title}
                      contentType={catalogItem.item_type as "module" | "test" | "ressource" | "parcours" || "ressource"}
                      thumbnailUrl={catalogItem.thumbnail_url}
                      className="w-full rounded-full px-6 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    />
                  )}
                </div>
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

