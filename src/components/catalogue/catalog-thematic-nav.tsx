"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBranding } from "@/components/super-admin/branding-provider";

type CatalogItem = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  title: string;
  thematique: string | null;
  category: string | null;
};

type CatalogThematicNavProps = {
  items: CatalogItem[];
  selectedThematique: string | null;
  onThematiqueSelect: (thematique: string | null) => void;
};

export function CatalogThematicNav({
  items,
  selectedThematique,
  onThematiqueSelect,
}: CatalogThematicNavProps) {
  const { branding } = useBranding();
  
  // Couleurs chaudes du branding
  const primaryColor = branding?.primary_color || '#8B6F47';
  const textColor = branding?.text_primary_color || '#5D4037';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  
  // Extraire toutes les thématiques uniques avec du contenu
  const thematiques = Array.from(
    new Set(
      items
        .map((item) => item.thematique || item.category)
        .filter((t): t is string => !!t)
    )
  ).sort();

  if (thematiques.length === 0) {
    return null;
  }

  return (
    <div 
      className="sticky top-0 z-50 backdrop-blur-sm border-b mb-8 shadow-sm"
      style={{
        backgroundColor: `${surfaceColor}E6`,
        borderColor: `${primaryColor}20`,
      }}
    >
      <div className="flex items-center gap-2 px-6 py-4 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {/* Bouton "Tout" */}
        <button
          onClick={() => onThematiqueSelect(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
          )}
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            backgroundColor: selectedThematique === null ? primaryColor : `${primaryColor}15`,
            color: selectedThematique === null ? '#FFFFFF' : textColor,
          }}
          onMouseEnter={(e) => {
            if (selectedThematique !== null) {
              e.currentTarget.style.backgroundColor = `${primaryColor}25`;
            }
          }}
          onMouseLeave={(e) => {
            if (selectedThematique !== null) {
              e.currentTarget.style.backgroundColor = `${primaryColor}15`;
            }
          }}
        >
          Tout
        </button>

        {/* Boutons de thématiques */}
        {thematiques.map((thematique) => (
          <button
            key={thematique}
            onClick={() => onThematiqueSelect(thematique)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            )}
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              backgroundColor: selectedThematique === thematique ? primaryColor : `${primaryColor}15`,
              color: selectedThematique === thematique ? '#FFFFFF' : textColor,
            }}
            onMouseEnter={(e) => {
              if (selectedThematique !== thematique) {
                e.currentTarget.style.backgroundColor = `${primaryColor}25`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedThematique !== thematique) {
                e.currentTarget.style.backgroundColor = `${primaryColor}15`;
              }
            }}
          >
            {thematique}
          </button>
        ))}
      </div>
    </div>
  );
}

