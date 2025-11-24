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

export default async function RessourceDetailPage({ params }: RessourceDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/jessica-contentin/login?next=${encodeURIComponent(`/ressources/${id}`)}`);
  }

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile) {
    notFound();
  }

  // Récupérer le profil pour obtenir l'organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  const organizationId = profile?.org_id || undefined;

  // Récupérer l'item du catalogue
  const catalogItem = await getCatalogItemById(id, organizationId, user.id);

  if (!catalogItem || catalogItem.item_type !== "ressource") {
    console.error("[ressources/[id]] Catalog item not found:", { id, catalogItem });
    notFound();
  }

  // Utiliser le catalog_item_id réel (peut être différent de l'id passé en paramètre)
  const catalogItemId = catalogItem.id;

  // Vérifier que c'est bien une ressource de Jessica Contentin
  const isResourceCreator = (catalogItem as any).creator_id === jessicaProfile.id;
  if (!isResourceCreator) {
    console.error("[ressources/[id]] Resource creator mismatch:", { 
      catalogItemCreatorId: (catalogItem as any).creator_id, 
      jessicaProfileId: jessicaProfile.id 
    });
    notFound();
  }

  // Vérifier si l'utilisateur a accès AVANT de récupérer les détails sensibles
  // IMPORTANT : Seul le créateur (Jessica) ou les utilisateurs ayant payé peuvent accéder
  // Même les ressources gratuites nécessitent un accès explicite dans catalog_access
  const isCreator = user.id === jessicaProfile.id;
  
  // Vérifier explicitement dans catalog_access si l'utilisateur a un accès
  // C'est la SEULE source de vérité pour l'accès utilisateur
  // Utiliser le catalog_item_id réel, pas l'id passé en paramètre
  // Vérifier soit par user_id (B2C) soit par organization_id (B2B)
  const { data: userAccess } = await supabase
    .from("catalog_access")
    .select("access_status")
    .eq("catalog_item_id", catalogItemId)
    .or(`user_id.eq.${user.id},organization_id.eq.${organizationId || 'null'}`)
    .maybeSingle();
  
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

  // Récupérer les détails de la ressource UNIQUEMENT si l'utilisateur a accès
  // Pour protéger les URLs de fichiers/vidéos/audios
  let resourceData = null;
  if (hasAccess && catalogItem.content_id) {
    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, description, kind, file_url, video_url, audio_url")
      .eq("id", catalogItem.content_id)
      .single();

    if (resource) {
      resourceData = resource;
    }
  } else if (catalogItem.content_id) {
    // Si pas d'accès, récupérer seulement les métadonnées publiques (pas les URLs)
    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, description, kind")
      .eq("id", catalogItem.content_id)
      .single();

    if (resource) {
      resourceData = {
        ...resource,
        file_url: null,
        video_url: null,
        audio_url: null,
      };
    }
  }

  // Déterminer l'image hero
  let heroImage = catalogItem.hero_image_url || catalogItem.thumbnail_url;

  // Déterminer l'accroche
  let accroche = catalogItem.short_description || catalogItem.description || resourceData?.description;

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/jessica-contentin/ressources"
            className="inline-flex items-center gap-2 text-sm mb-6 hover:underline transition-colors"
            style={{ color: primaryColor }}
          >
            ← Retour aux ressources
          </Link>
        </div>

        {/* En-tête */}
        <div className="mb-12">
          {catalogItem.category && (
            <span 
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] mb-4"
              style={{ 
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              {catalogItem.category}
            </span>
          )}
          <h1 
            className="text-4xl md:text-5xl font-bold leading-tight mb-6"
            style={{ color: textColor }}
          >
            {catalogItem.title}
          </h1>
          {accroche && (
            <p 
              className="text-xl text-[#2F2A25]/80 mb-6"
              style={{ color: `${textColor}CC` }}
            >
              {accroche}
            </p>
          )}
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
              {!catalogItem.is_free && catalogItem.price && (
                <span 
                  className="rounded-full border-2 px-4 py-2 font-bold text-lg"
                  style={{ 
                    borderColor: primaryColor,
                    backgroundColor: `${primaryColor}10`,
                    color: primaryColor,
                  }}
                >
                  {catalogItem.price}€
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
                className="rounded-3xl border-2 p-8 md:p-10"
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
          </div>

          {/* Colonne latérale - CTA et informations */}
          <div className="lg:col-span-1">
            <div 
              className="sticky top-8 rounded-3xl border-2 p-8 shadow-xl"
              style={{ 
                borderColor: `${primaryColor}40`,
                backgroundColor: surfaceColor,
              }}
            >
              {hasAccess && resourceUrl ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <div className="text-2xl">✅</div>
                    </div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: textColor }}
                    >
                      Accès activé
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: `${textColor}AA` }}
                    >
                      Vous avez accès à cette ressource
                    </p>
                  </div>
                  <Button 
                    asChild 
                    className="w-full rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                      {getResourceIcon()}
                      <span className="ml-2">{getButtonText()}</span>
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <div className="text-2xl">🔒</div>
                    </div>
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ color: textColor }}
                    >
                      {catalogItem.is_free ? "Accès gratuit" : "Accès payant"}
                    </h3>
                    <p 
                      className="text-sm mb-4"
                      style={{ color: `${textColor}AA` }}
                    >
                      {catalogItem.is_free 
                        ? "Connectez-vous pour accéder gratuitement à cette ressource"
                        : "Achetez cette ressource pour y accéder immédiatement"}
                    </p>
                    {!catalogItem.is_free && catalogItem.price && (
                      <div className="mb-4">
                        <div 
                          className="text-4xl font-bold"
                          style={{ color: primaryColor }}
                        >
                          {catalogItem.price}€
                        </div>
                        <p 
                          className="text-xs mt-1"
                          style={{ color: `${textColor}80` }}
                        >
                          Paiement unique
                        </p>
                      </div>
                    )}
                  </div>
                  {stripeCheckoutUrl ? (
                    <Button 
                      asChild 
                      className="w-full rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
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
                      contentId={catalogItem.content_id}
                      price={catalogItem.price || 0}
                      title={catalogItem.title}
                      className="w-full rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      style={{
                        backgroundColor: primaryColor,
                      }}
                    />
                  )}
                  {!catalogItem.is_free && (
                    <div className="pt-4 border-t" style={{ borderColor: `${primaryColor}30` }}>
                      <ul className="space-y-2 text-sm" style={{ color: `${textColor}AA` }}>
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

