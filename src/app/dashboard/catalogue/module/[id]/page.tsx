import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";
import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { HeroImage } from "@/components/catalogue/hero-image";
import { BadgeImage } from "@/components/catalogue/badge-image";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { AddToCartButton } from "@/components/catalogue/add-to-cart-button";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CatalogModuleDetailPage({ params }: PageProps) {
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

  // Récupérer l'item du catalogue
  const catalogItem = await getCatalogItemById(id, organizationId);

  if (!catalogItem || catalogItem.item_type !== "module") {
    notFound();
  }

  // Récupérer le branding du Super Admin créateur du module
  let branding = null;
  if (catalogItem && (catalogItem as any).creator_id) {
    branding = await getSuperAdminBranding((catalogItem as any).creator_id);
  }

  // Déterminer l'image hero (priorité: hero_image_url du catalog_item, puis cover_image du course, puis builder_snapshot)
  let heroImage = catalogItem.hero_image_url;
  
  if (!heroImage && catalogItem.course) {
    // Essayer cover_image
    heroImage = catalogItem.course.cover_image;
    
    // Si toujours pas d'image, essayer builder_snapshot avec recherche récursive
    if (!heroImage && catalogItem.course.builder_snapshot) {
      try {
        const snapshot = typeof catalogItem.course.builder_snapshot === 'string'
          ? JSON.parse(catalogItem.course.builder_snapshot)
          : catalogItem.course.builder_snapshot;
        
        // Chercher dans general.heroImage d'abord
        if (snapshot?.general?.heroImage) {
          heroImage = snapshot.general.heroImage;
        }
        
        // Si pas trouvé, recherche récursive pour "istockphoto-1783743772-612x612" ou toute image
        if (!heroImage) {
          const findImageRecursive = (obj: any, depth = 0): string | null => {
            // Limiter la profondeur pour éviter les boucles infinies
            if (depth > 10 || !obj || typeof obj !== 'object') return null;
            
            for (const key in obj) {
              const value = obj[key];
              
              // Si c'est une string et qu'elle contient l'image recherchée
              if (typeof value === 'string') {
                if (value.includes('istockphoto-1783743772-612x612')) {
                  console.log(`[catalogue/module] Found istockphoto image at depth ${depth}, key: ${key}`);
                  return value;
                }
                
                // Chercher aussi les images base64
                if (value.startsWith('data:image/')) {
                  console.log(`[catalogue/module] Found base64 image at depth ${depth}, key: ${key}`);
                  return value;
                }
                
                // Chercher les URLs d'images (longues strings qui ressemblent à des URLs)
                if (value.length > 50 && (
                  value.includes('http') || 
                  value.includes('/images/') || 
                  value.includes('istock') ||
                  value.includes('supabase') ||
                  value.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)
                )) {
                  console.log(`[catalogue/module] Found potential image URL at depth ${depth}, key: ${key}:`, value.substring(0, 100));
                  return value;
                }
              }
              
              // Si c'est un objet ou un tableau, chercher récursivement
              if (typeof value === 'object' && value !== null && !Array.isArray(value) || Array.isArray(value)) {
                const found = findImageRecursive(value, depth + 1);
                if (found) return found;
              }
            }
            
            return null;
          };
          
          const foundImage = findImageRecursive(snapshot);
          if (foundImage) {
            heroImage = foundImage;
            console.log("[catalogue/module] ✅ Found image in builder_snapshot:", foundImage.substring(0, 150));
          } else {
            console.log("[catalogue/module] ❌ No image found in builder_snapshot after recursive search");
          }
        }
      } catch (e) {
        console.error("[catalogue/module] Error parsing builder_snapshot:", e);
      }
    }
  }

  // Déterminer l'accroche (priorité: short_description, puis description, puis builder_snapshot, puis description du course)
  let accroche = catalogItem.short_description || catalogItem.description;
  
  // Extraire la description depuis builder_snapshot
  let moduleDescription = catalogItem.description || "";
  
  // Extraire les sections/chapitres depuis builder_snapshot pour le contenu
  let sections: any[] = [];
  let badgeInfo: { title?: string; description?: string; image?: string } | null = null;
  let objectives: string[] = [];
  let skills: string[] = [];
  
  if (catalogItem.course) {
    // Essayer builder_snapshot
    if (catalogItem.course.builder_snapshot) {
      try {
        const snapshot = typeof catalogItem.course.builder_snapshot === 'string'
          ? JSON.parse(catalogItem.course.builder_snapshot)
          : catalogItem.course.builder_snapshot;
        
        if (snapshot?.general?.subtitle && !accroche) {
          accroche = snapshot.general.subtitle;
        }
        
        // Extraire la description depuis general.description
        if (snapshot?.general?.description) {
          moduleDescription = snapshot.general.description;
        }
        
        // Extraire les sections pour le contenu
        if (snapshot?.sections && Array.isArray(snapshot.sections)) {
          sections = snapshot.sections;
        }
        
        // Extraire les objectifs pédagogiques
        if (snapshot?.objectives && Array.isArray(snapshot.objectives)) {
          objectives = snapshot.objectives;
        }
        
        // Extraire les compétences développées
        if (snapshot?.skills && Array.isArray(snapshot.skills)) {
          skills = snapshot.skills;
        }
        
        // Extraire le badge numérique depuis general.badge
        if (snapshot?.general?.badge) {
          badgeInfo = {
            title: snapshot.general.badge.title || snapshot.general.badge.label,
            description: snapshot.general.badge.description,
            image: snapshot.general.badge.image || snapshot.general.badge.url,
          };
        }
        
        // Extraire aussi badgeImage depuis general.badgeImage
        if (!badgeInfo?.image && snapshot?.general?.badgeImage) {
          if (!badgeInfo) badgeInfo = {};
          badgeInfo.image = snapshot.general.badgeImage;
        }
      } catch (e) {
        console.error("[catalogue/module] Error parsing builder_snapshot:", e);
      }
    }
    
    // Fallback sur description du course
    if (!accroche && catalogItem.course.description) {
      accroche = catalogItem.course.description;
    }
    if (!moduleDescription && catalogItem.course.description) {
      moduleDescription = catalogItem.course.description;
    }
  }

  // Logs pour debug
  console.log("[catalogue/module] Debug:", {
    catalogItemId: id,
    heroImage: heroImage ? `✅ "${heroImage.substring(0, 100)}"` : "❌ Absente",
    accroche: accroche ? `✅ "${accroche.substring(0, 50)}..."` : "❌ Absente",
    hasCourse: !!catalogItem.course,
    catalogItemHero: catalogItem.hero_image_url,
    courseCoverImage: catalogItem.course?.cover_image,
    builderSnapshotExists: !!catalogItem.course?.builder_snapshot,
    title: catalogItem.title,
    sectionsCount: sections.length,
    hasBadge: !!badgeInfo,
  });

  // Déterminer le statut d'accès
  const hasAccess = catalogItem.access_status === "purchased" || 
                    catalogItem.access_status === "manually_granted" || 
                    catalogItem.access_status === "free";

  // URL vers la formation (si accès) - utiliser le slug du course ou l'ID
  const courseSlug = catalogItem.course?.slug || catalogItem.course_slug || catalogItem.course?.id;
  const formationUrl = courseSlug 
    ? `/dashboard/catalogue/formations/${courseSlug}`
    : null;

  // URL vers la page de paiement Stripe (si pas d'accès)
  const paymentUrl = `/dashboard/catalogue/module/${id}/payment`;

  // URL vers la page de présentation (détail) - reste sur cette page
  const detailUrl = `/dashboard/catalogue/module/${id}`;

  // Couleurs du branding (beige, marron, doré pour contentin.cabinet@gmail.com)
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
      
      {/* Section Hero avec image */}
      <div 
        className="relative h-[70vh] min-h-[600px] overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Image de fond */}
        {heroImage ? (
          <>
            <HeroImage
              src={heroImage}
              alt={catalogItem.title}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-violet-900 to-purple-900" />
        )}
        
        {/* Contenu Hero */}
        <div className="relative z-10 flex h-full items-end pb-16 px-6 md:px-12">
          <div className="max-w-4xl">
            <h1 
              className="text-5xl md:text-7xl font-semibold mb-4 leading-tight"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                color: heroImage ? '#FFFFFF' : textColor,
              }}
            >
              {catalogItem.title}
            </h1>
            <p 
              className="text-xl md:text-2xl mb-8 max-w-3xl"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                color: heroImage ? 'rgba(255, 255, 255, 0.9)' : textColor,
              }}
            >
              {accroche || "Découvrez ce module de formation complet et engageant"}
            </p>
            
            {/* CTAs - Toujours affichés */}
            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              {hasAccess && formationUrl ? (
                <a
                  href={formationUrl}
                  className="px-8 py-6 text-lg font-medium rounded-full shadow-lg transition-all hover:shadow-xl text-white"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                >
                  Se former maintenant
                </a>
              ) : (
                <AddToCartButton
                  contentId={catalogItem.content_id || catalogItem.id}
                  contentType="module"
                  title={catalogItem.title}
                  price={catalogItem.price || 0}
                  thumbnailUrl={heroImage}
                  size="lg"
                  className="px-8 py-6 text-lg font-medium rounded-full shadow-lg transition-all hover:shadow-xl"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Description sous l'image */}
      {moduleDescription && (
        <div 
          className="py-12 px-6 md:px-12 border-b"
          style={{ 
            backgroundColor: surfaceColor,
            borderColor: `${primaryColor}20`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <p 
              className="text-lg leading-relaxed max-w-4xl"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                color: textColor,
              }}
            >
              {moduleDescription}
            </p>
          </div>
        </div>
      )}

      {/* Section Objectifs et Compétences */}
      {(objectives.length > 0 || skills.length > 0) && (
        <div 
          className="py-12 px-6 md:px-12 border-b"
          style={{ 
            backgroundColor: bgColor,
            borderColor: `${primaryColor}20`,
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Objectifs pédagogiques */}
              {objectives.length > 0 && (
                <div className="space-y-4">
                  <h2 
                    className="text-2xl font-semibold"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      color: primaryColor,
                    }}
                  >
                    Objectifs pédagogiques
                  </h2>
                  <ul className="space-y-3">
                    {objectives.map((objective, idx) => (
                      <li key={idx} className="flex items-start gap-3" style={{ color: textColor }}>
                        <span 
                          className="mt-2 h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <span className="leading-relaxed">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Compétences développées */}
              {skills.length > 0 && (
                <div className="space-y-4">
                  <h2 
                    className="text-2xl font-semibold"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      color: primaryColor,
                    }}
                  >
                    Compétences développées
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm"
                        style={{
                          borderColor: `${primaryColor}40`,
                          backgroundColor: `${primaryColor}10`,
                          color: textColor,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section principale : Contenu (droite) */}
      <div 
        className="py-12 px-6 md:px-12"
        style={{ backgroundColor: bgColor }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Colonne gauche : Espace vide ou contenu optionnel */}
            <div className="lg:col-span-2"></div>

            {/* Colonne droite : Contenu (sections/chapitres) */}
            <div className="lg:col-span-1">
              <div 
                className="rounded-2xl border p-6 shadow-lg"
                style={{ 
                  backgroundColor: surfaceColor,
                  borderColor: `${primaryColor}30`,
                }}
              >
                <h3 
                  className="text-xl font-semibold mb-6"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    color: textColor,
                  }}
                >
                  Contenu
                </h3>
                
                {sections.length > 0 ? (
                  <div className="space-y-4">
                    {sections.map((section, sectionIdx) => (
                      <div key={section.id || sectionIdx} className="space-y-2">
                        <h4 
                          className="text-sm font-semibold"
                          style={{ color: textColor }}
                        >
                          {section.title || `Section ${sectionIdx + 1}`}
                        </h4>
                        {section.chapters && section.chapters.length > 0 && (
                          <ul className="space-y-1 ml-4">
                            {section.chapters.map((chapter: any, chapterIdx: number) => (
                              <li 
                                key={chapter.id || chapterIdx} 
                                className="text-sm"
                                style={{ color: textColor }}
                              >
                                • {chapter.title || `Chapitre ${chapterIdx + 1}`}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p 
                    className="text-sm"
                    style={{ color: `${textColor}80` }}
                  >
                    Contenu à venir
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Badge numérique en dessous */}
          {badgeInfo && (
            <div 
              className="mt-12 pt-8 border-t"
              style={{ 
                borderColor: `${primaryColor}20`,
                backgroundColor: surfaceColor,
                paddingTop: '2rem',
                paddingBottom: '2rem',
                borderRadius: '1rem',
              }}
            >
              <div className="flex items-center gap-6">
                {badgeInfo.image && (
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <BadgeImage
                      src={badgeInfo.image}
                      alt={badgeInfo.title || "Badge numérique"}
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 
                    className="text-lg font-semibold mb-2"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      color: textColor,
                    }}
                  >
                    Badge numérique
                  </h3>
                  {badgeInfo.title && (
                    <p 
                      className="text-base font-medium mb-1"
                      style={{ color: textColor }}
                    >
                      {badgeInfo.title}
                    </p>
                  )}
                  {badgeInfo.description && (
                    <p 
                      className="text-sm"
                      style={{ color: `${textColor}CC` }}
                    >
                      {badgeInfo.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </BrandingProvider>
  );
}

