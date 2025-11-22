"use client";

import { useState, useEffect } from "react";
import { Play, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useBranding } from "@/components/super-admin/branding-provider";

type CatalogItem = {
  id: string;
  title: string;
  short_description?: string;
  hero_image_url: string | null;
  price: number;
  is_free: boolean;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
};

type CatalogHeroProps = {
  items: CatalogItem[];
  onItemClick: (item: CatalogItem) => void;
};

export function CatalogHero({ items, onItemClick }: CatalogHeroProps) {
  const { branding } = useBranding();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Afficher plusieurs items (carrousel) - prendre les 3-5 premiers items avec images
  const featuredItems = items
    .filter(item => item.hero_image_url)
    .slice(0, 5); // Maximum 5 items dans le carrousel
  
  const currentItem = featuredItems[currentIndex] || items[0];
  
  // Couleurs - Style Netflix (rouge) ou branding personnalisé
  const isContentin = branding?.background_color === '#F5F0E8' || branding?.background_color === '#F8F9FB';
  const primaryColor = isContentin ? (branding?.primary_color || '#8B6F47') : '#e50914'; // Rouge Netflix
  const accentColor = isContentin ? (branding?.accent_color || '#D4AF37') : '#e50914'; // Rouge Netflix
  const secondaryColor = isContentin ? (branding?.secondary_color || '#D4C4A8') : '#b3b3b3'; // Gris clair

  // Auto-rotation des items en vedette
  useEffect(() => {
    if (featuredItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 6000); // Change toutes les 6 secondes

    return () => clearInterval(interval);
  }, [featuredItems.length]);

  // Si pas d'items avec images, ne pas afficher le hero
  if (!currentItem || featuredItems.length === 0) {
    return null;
  }

  const hasHeroImage = !!currentItem.hero_image_url;

  // Les formations ne sont accessibles qu'après paiement d'abonnement
  // Pas d'accès gratuit, même si is_free est true
  const hasAccess =
    currentItem.access_status === "purchased" ||
    currentItem.access_status === "manually_granted";

  // Utiliser le background_color du branding si disponible
  const bgColor = branding?.background_color || '#F5F0E8';

  return (
    <div 
      className="relative h-[85vh] w-full overflow-hidden -mt-[44px]"
      style={{ backgroundColor: bgColor }}
    >
      {/* Image de fond */}
      <div className="absolute inset-0">
               {hasHeroImage ? (
                 <>
                   {currentItem.hero_image_url && (() => {
                     const heroUrl = currentItem.hero_image_url;
                     const isGif = heroUrl.toLowerCase().endsWith('.gif') || 
                                   heroUrl.includes('data:image/gif') || 
                                   heroUrl.includes('.gif?') ||
                                   heroUrl.includes('/gif');
                     
                     if (heroUrl.startsWith('data:image/') || isGif) {
                       return (
                         <img
                           src={heroUrl}
                           alt={currentItem.title}
                           className="h-full w-full object-cover"
                         />
                       );
                     }
                     
                     return (
                       <Image
                         src={heroUrl}
                         alt={currentItem.title}
                         fill
                         className="object-cover"
                         priority
                         unoptimized={heroUrl.includes('istockphoto') || 
                                       heroUrl.includes('localhost') || 
                                       heroUrl.includes('supabase')}
                       />
                     );
                   })()}
                 </>
               ) : (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${accentColor} 100%)`,
            }}
          />
        )}
        {/* Gradient overlay pour la lisibilité - adapté au branding */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)`,
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)`,
          }}
        />
      </div>

      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col justify-end p-12">
        <div className="max-w-2xl space-y-4">
          {/* Titre */}
          <h1 className="text-5xl font-bold text-white md:text-6xl lg:text-7xl">
            {currentItem.title}
          </h1>

          {/* Description - Toujours affichée */}
          <p className="max-w-xl text-lg text-white/90 md:text-xl">
            {currentItem.short_description || "Découvrez ce module de formation complet et engageant"}
          </p>

          {/* Actions - Toujours affichées */}
          <div className="flex items-center gap-4 pt-6">
            <Button
              onClick={() => onItemClick(currentItem)}
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
              style={{
                backgroundColor: primaryColor, // Marron chaud
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor; // Marron au survol
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Commencer maintenant
            </Button>
            <Button
              onClick={() => onItemClick(currentItem)}
              variant="outline"
              size="lg"
              className="rounded-full border-2 px-8 py-6 text-lg font-semibold backdrop-blur-sm"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </div>

      {/* Indicateurs de pagination - Style Netflix */}
      {featuredItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {featuredItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-2 bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Aller à l'item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

