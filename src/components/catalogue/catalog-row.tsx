"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Lock, Check, Play, Headphones, Video, FileText, BookOpen, ClipboardCheck, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogCardImage } from "./catalog-card-image";
import { useBranding } from "@/components/super-admin/branding-provider";
import { AddToCartButton } from "./add-to-cart-button";

type CatalogItem = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  title: string;
  short_description?: string;
  thumbnail_url: string | null;
  hero_image_url?: string | null;
  price: number | null;
  is_free: boolean;
  duration?: string | null;
  level?: string | null;
  category?: string | null;
  thematique?: string | null;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  course_slug?: string | null;
  kind?: string | null; // Pour les ressources : "pdf", "video", "audio"
  content_format?: "text" | "audio" | "video" | null; // Format principal pour les modules
};

type CatalogRowProps = {
  title: string;
  items: CatalogItem[];
  onItemClick: (item: CatalogItem) => void;
};

// Fonction pour obtenir l'icône selon le type et le format
function getItemIcon(item: CatalogItem) {
  // Pour les modules, utiliser le format (text, audio, video)
  if (item.item_type === "module") {
    if (item.content_format === "text") return Pencil;
    if (item.content_format === "audio") return Headphones;
    if (item.content_format === "video") return Play;
    // Par défaut, si pas de format spécifié, utiliser texte
    return Pencil;
  }
  
  // Pour les ressources, vérifier le kind précisément
  if (item.item_type === "ressource") {
    const kind = item.kind?.toLowerCase();
    if (kind === "audio" || kind === "mp3" || kind === "wav" || kind === "m4a") return Headphones;
    if (kind === "video" || kind === "mp4" || kind === "avi" || kind === "mov" || kind === "webm") return Video;
    if (kind === "pdf" || kind === "document") return FileText;
    // Par défaut pour les ressources
    return FileText;
  }
  
  if (item.item_type === "parcours") return BookOpen;
  if (item.item_type === "test") return ClipboardCheck;
  return FileText;
}

export function CatalogRow({ title, items, onItemClick }: CatalogRowProps) {
  const { branding } = useBranding();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Couleurs chaudes du branding
  const textColor = branding?.text_primary_color || '#5D4037';
  const textSecondaryColor = branding?.text_secondary_color || '#8B6F47';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const primaryColor = branding?.primary_color || '#8B6F47';
  
  // Détecter si c'est contentin.cabinet@gmail.com via le branding
  const isContentinCabinet = branding?.platform_name === "Cabinet Contentin" || 
                             branding?.background_color === '#F5F0E8';

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Titre de la section */}
      <div className="flex items-center justify-between">
        <h2 
          className="text-2xl font-bold"
          style={{ color: textColor }}
        >
          {title}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="h-10 w-10 rounded-full border transition-all hover:scale-110"
            style={{
              borderColor: `${primaryColor}40`,
              backgroundColor: `${primaryColor}10`,
              color: textColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}20`;
              e.currentTarget.style.borderColor = `${primaryColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}10`;
              e.currentTarget.style.borderColor = `${primaryColor}40`;
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="h-10 w-10 rounded-full border transition-all hover:scale-110"
            style={{
              borderColor: `${primaryColor}40`,
              backgroundColor: `${primaryColor}10`,
              color: textColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}20`;
              e.currentTarget.style.borderColor = `${primaryColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}10`;
              e.currentTarget.style.borderColor = `${primaryColor}40`;
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Carrousel horizontal - Style Apple TV pour contentin.cabinet@gmail.com */}
      <div className="relative">
        <div
          ref={scrollRef}
          className={cn(
            "flex overflow-x-auto [&::-webkit-scrollbar]:hidden",
            isContentinCabinet 
              ? "gap-6 px-2 py-4" // Style Apple TV avec plus d'espace
              : "gap-4" // Style normal
          )}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {items.map((item) => {
            // Les formations ne sont accessibles qu'après paiement d'abonnement
            // Pas d'accès gratuit, même si is_free est true
            const hasAccess =
              item.access_status === "purchased" ||
              item.access_status === "manually_granted";

            const ItemIcon = getItemIcon(item);
            // Utiliser le prix réel de l'item, pas is_free qui peut être incorrect
            const displayPrice = item.price ?? 0;
            // is_free doit être basé uniquement sur le prix réel
            const isFree = displayPrice === 0 || displayPrice === null;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex-shrink-0 cursor-pointer transition-all duration-300",
                  isContentinCabinet
                    ? "min-w-[280px] md:min-w-[320px] hover:scale-110 hover:z-10" // Style Apple TV avec zoom au survol
                    : "min-w-[400px] md:min-w-[450px]"
                )}
                onClick={() => onItemClick(item)}
              >
                {/* Card - Style Apple TV pour contentin.cabinet@gmail.com */}
                <div className={cn(
                  "relative w-full overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-lg transition-all duration-300",
                  isContentinCabinet
                    ? "h-[200px] rounded-2xl hover:shadow-2xl" // Hauteur fixe pour cohérence visuelle
                    : "h-[250px] rounded-xl" // Hauteur fixe pour cohérence visuelle
                )}>
                  <CatalogCardImage
                    src={item.thumbnail_url || item.hero_image_url}
                    alt={item.title}
                    title={item.title}
                  />

                  {/* Overlay avec gradient - Style Apple TV */}
                  <div className={cn(
                    "absolute inset-0 transition-opacity",
                    isContentinCabinet
                      ? "bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100"
                      : "bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100"
                  )} />

                  {/* Badge de prix en haut à droite - Retiré selon demande */}


                  {/* Contenu au survol - Style Apple TV */}
                  <div className={cn(
                    "absolute inset-0 flex flex-col justify-end transition-opacity",
                    isContentinCabinet
                      ? "p-6 opacity-0 group-hover:opacity-100"
                      : "p-4 opacity-0 group-hover:opacity-100"
                  )}>
                    <h3 className={cn(
                      "font-bold text-white mb-2",
                      isContentinCabinet ? "text-xl" : "text-lg"
                    )}>
                      {item.title}
                    </h3>
                    {item.short_description && (
                      <p className={cn(
                        "text-white/90 line-clamp-2",
                        isContentinCabinet ? "text-base" : "text-sm"
                      )}>
                        {item.short_description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                      {item.duration && <span>{item.duration}</span>}
                      {item.level && <span>• {item.level}</span>}
                    </div>
                  </div>

                  {/* Badge de format avec icône en bas à gauche - Seulement l'icône, pas de texte */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <span 
                      className="flex items-center justify-center rounded-full w-8 h-8 text-white backdrop-blur-md shadow-lg"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <ItemIcon className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {/* Info au-dessous de la card (visible toujours) */}
                <div className="mt-3 px-1">
                  {/* Titre toujours visible */}
                  <h3 
                    className="text-base font-semibold line-clamp-2 mb-2"
                    style={{ color: textColor }}
                  >
                    {item.title}
                  </h3>
                  
                  {/* Thématique/Catégorie toujours visible - En blanc */}
                  {(item.thematique || item.category) && (
                    <div className="mb-2">
                      <span 
                        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {item.thematique || item.category}
                      </span>
                    </div>
                  )}
                  
                  {/* CTA uniquement */}
                  <div className="flex items-center justify-end gap-2">
                    {/* CTA "Accéder" - Contour blanc, fond transparent, texte blanc */}
                    {hasAccess ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#ffffff',
                          color: '#ffffff',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Accéder
                      </Button>
                    ) : (
                      <div onClick={(e) => e.stopPropagation()}>
                        <AddToCartButton
                          contentId={item.id}
                          contentType={item.item_type}
                          title={item.title}
                          price={displayPrice}
                          thumbnailUrl={item.thumbnail_url || item.hero_image_url}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

