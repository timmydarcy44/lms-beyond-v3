import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { Button } from "@/components/ui/button";
import { JessicaContentinLayout } from "@/app/jessica-contentin/layout";
import { getServerClient } from "@/lib/supabase/server";
import { Play, FileText, Video, Headphones, CreditCard } from "lucide-react";

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
    redirect(`/login?next=${encodeURIComponent(`/ressources/${id}`)}`);
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
    notFound();
  }

  // Vérifier que c'est bien une ressource de Jessica Contentin
  const isCreator = (catalogItem as any).creator_id === jessicaProfile.id;
  if (!isCreator) {
    notFound();
  }

  // Récupérer les détails de la ressource depuis la table resources
  let resourceData = null;
  if (catalogItem.content_id) {
    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, description, kind, file_url, video_url, audio_url")
      .eq("id", catalogItem.content_id)
      .single();

    if (resource) {
      resourceData = resource;
    }
  }

  // Déterminer l'image hero
  let heroImage = catalogItem.hero_image_url || catalogItem.thumbnail_url;

  // Déterminer l'accroche
  let accroche = catalogItem.short_description || catalogItem.description || resourceData?.description;

  // Vérifier si l'utilisateur a accès
  const hasAccess = catalogItem.access_status === "purchased" || 
                    catalogItem.access_status === "manually_granted" || 
                    catalogItem.access_status === "free" ||
                    catalogItem.is_free ||
                    user.id === jessicaProfile.id;

  // URL vers la ressource (si accès)
  const resourceUrl = hasAccess && resourceData
    ? (resourceData.file_url || resourceData.video_url || resourceData.audio_url)
    : null;

  // URL vers la page de paiement (si pas d'accès)
  const paymentUrl = `/dashboard/catalogue/ressource/${id}/payment`;

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
      if (resourceData?.kind === "video") {
        return "Regarder";
      } else if (resourceData?.kind === "audio") {
        return "Écouter";
      }
      return "Consulter";
    }
    if (catalogItem.is_free) {
      return "Accéder gratuitement";
    }
    return `Acheter pour ${catalogItem.price || 0}€`;
  };

  return (
    <JessicaContentinLayout>
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        {/* Hero Section */}
        <section 
          className="relative overflow-hidden rounded-3xl border mx-6 mt-6 mb-8 shadow-lg"
          style={{ 
            borderColor: `${primaryColor}30`,
            backgroundColor: surfaceColor,
          }}
        >
          <div className="absolute inset-0">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={catalogItem.title}
                fill
                priority
                className="object-cover opacity-20"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/95" />
          </div>

          <div className="relative z-10 flex flex-col gap-10 px-6 py-12 md:px-12 md:py-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-6" style={{ color: textColor }}>
              <span 
                className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ 
                  backgroundColor: `${primaryColor}20`,
                  color: primaryColor,
                }}
              >
                {catalogItem.category || "Ressource"}
              </span>
              <div className="space-y-3">
                <h1 
                  className="text-3xl font-semibold leading-tight md:text-5xl"
                  style={{ color: textColor }}
                >
                  {catalogItem.title}
                </h1>
                {accroche && (
                  <p className="text-sm md:text-base" style={{ color: `${textColor}CC` }}>
                    {accroche}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm" style={{ color: `${textColor}AA` }}>
                {catalogItem.is_free && (
                  <span 
                    className="rounded-full border px-3 py-1"
                    style={{ 
                      borderColor: `${primaryColor}40`,
                      backgroundColor: `${primaryColor}10`,
                    }}
                  >
                    Gratuit
                  </span>
                )}
                {!catalogItem.is_free && catalogItem.price && (
                  <span 
                    className="rounded-full border px-3 py-1"
                    style={{ 
                      borderColor: `${primaryColor}40`,
                      backgroundColor: `${primaryColor}10`,
                    }}
                  >
                    {catalogItem.price}€
                  </span>
                )}
                {resourceData?.kind && (
                  <span 
                    className="rounded-full border px-3 py-1"
                    style={{ 
                      borderColor: `${primaryColor}40`,
                      backgroundColor: `${primaryColor}10`,
                    }}
                  >
                    {resourceData.kind === "video" ? "Vidéo" : resourceData.kind === "audio" ? "Audio" : "Document"}
                  </span>
                )}
              </div>
              {catalogItem.description && (
                <p className="max-w-2xl text-sm md:text-base" style={{ color: `${textColor}CC` }}>
                  {catalogItem.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                {hasAccess && resourceUrl ? (
                  <Button 
                    asChild 
                    className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                      {getResourceIcon()}
                      <span className="ml-2">{getButtonText()}</span>
                    </a>
                  </Button>
                ) : (
                  <Button 
                    asChild 
                    className="rounded-full px-8 py-6 text-lg font-semibold text-white shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    <Link href={paymentUrl}>
                      <CreditCard className="h-5 w-5" />
                      <span className="ml-2">{getButtonText()}</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            {heroImage && (
              <div className="w-full max-w-sm lg:max-w-xs">
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
                  <Image
                    src={heroImage}
                    alt={catalogItem.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Description détaillée */}
        {catalogItem.description && (
          <section 
            className="rounded-3xl border mx-6 mb-8 px-6 py-10 md:px-10"
            style={{ 
              borderColor: `${primaryColor}30`,
              backgroundColor: surfaceColor,
            }}
          >
            <h2 className="text-2xl font-semibold mb-6" style={{ color: textColor }}>
              Description
            </h2>
            <p 
              className="text-base md:text-lg max-w-none leading-relaxed whitespace-pre-wrap"
              style={{ color: `${textColor}CC` }}
            >
              {catalogItem.description}
            </p>
          </section>
        )}
      </div>
    </JessicaContentinLayout>
  );
}

