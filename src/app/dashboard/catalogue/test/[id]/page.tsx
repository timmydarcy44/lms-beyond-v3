import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { HeroImage } from "@/components/catalogue/hero-image";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { Clock, Target, Award } from "lucide-react";
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

  // Récupérer l'organisation de l'utilisateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }

  // Récupérer le profil pour obtenir l'organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.org_id || undefined;

  // Récupérer l'item du catalogue (peut être dans catalog_items ou directement dans tests)
  const catalogItem = await getCatalogItemById(id, organizationId);

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
  }

  // Récupérer les détails du test depuis la table tests
  let testData = null;
  if (catalogItem.content_id) {
    const { data: test } = await supabase
      .from("tests")
      .select("id, title, description, duration, evaluation_type, skills, display_format, questions, slug")
      .eq("id", catalogItem.content_id)
      .single();

    if (test) {
      testData = test;
    }
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

  // Déterminer le statut d'accès
  const hasAccess = catalogItem.access_status === "purchased" || 
                    catalogItem.access_status === "manually_granted" || 
                    catalogItem.access_status === "free" ||
                    catalogItem.is_free;

  // URL vers la page de test (si accès)
  const testSlug = (testData as any)?.slug || null;
  const testUrl = hasAccess
    ? testSlug
      ? `/dashboard/tests/${testSlug}`
      : catalogItem.content_id
        ? `/dashboard/tests/${catalogItem.content_id}`
        : null
    : null;

  // URL vers la page de paiement (si pas d'accès)
  const paymentUrl = `/dashboard/catalogue/test/${id}/payment`;

  // Couleurs du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const accentColor = branding?.accent_color || '#D4AF37';

  return (
    <BrandingProvider initialBranding={branding}>
      <div 
        className="min-h-screen"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <CatalogTopNavClient />
      
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
                {hasAccess && testUrl ? (
                  <a
                    href={testUrl}
                    className="px-8 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-white"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  >
                    Démarrer le test
                  </a>
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
      </div>
    </BrandingProvider>
  );
}

