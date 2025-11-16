"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type BrandingConfig = {
  platform_name: string;
  platform_logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_primary_color: string;
  text_secondary_color: string;
  font_family: string;
  border_radius: string;
  is_b2c_only?: boolean;
  show_organization_features?: boolean;
};

type BrandingContextType = {
  branding: BrandingConfig | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const BrandingContext = createContext<BrandingContextType>({
  branding: null,
  isLoading: true,
  refresh: async () => {},
});

export function useBranding() {
  return useContext(BrandingContext);
}

// Valeurs par défaut de branding (synchrones pour le client)
const DEFAULT_BRANDING: BrandingConfig = {
  platform_name: "Beyond",
  platform_logo_url: null,
  primary_color: "#0066FF",
  secondary_color: "#6366F1",
  accent_color: "#8B5CF6",
  background_color: "#FFFFFF",
  surface_color: "#F9FAFB",
  text_primary_color: "#1F2937",
  text_secondary_color: "#6B7280",
  font_family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  border_radius: "8px",
};

export function BrandingProvider({ 
  children, 
  initialBranding 
}: { 
  children: React.ReactNode;
  initialBranding?: BrandingConfig | null;
}) {
  const [branding, setBranding] = useState<BrandingConfig | null>(
    initialBranding || DEFAULT_BRANDING
  );
  const [isLoading, setIsLoading] = useState(!initialBranding);

  const loadBranding = async () => {
    setIsLoading(true);
    try {
      // Appeler l'API route pour récupérer le branding
      const response = await fetch('/api/super-admin/branding');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setBranding({
            ...DEFAULT_BRANDING,
            ...data,
          });
        } else {
          setBranding(DEFAULT_BRANDING);
        }
      } else {
        setBranding(DEFAULT_BRANDING);
      }
    } catch (error) {
      console.error("[BrandingProvider] Error loading branding:", error);
      setBranding(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialBranding) {
      loadBranding();
    }
  }, [initialBranding]);

  // Appliquer les styles CSS variables
  useEffect(() => {
    if (branding) {
      const root = document.documentElement;
      root.style.setProperty("--brand-primary", branding.primary_color);
      root.style.setProperty("--brand-secondary", branding.secondary_color);
      root.style.setProperty("--brand-accent", branding.accent_color);
      root.style.setProperty("--brand-bg", branding.background_color);
      root.style.setProperty("--brand-surface", branding.surface_color);
      root.style.setProperty("--brand-text-primary", branding.text_primary_color);
      root.style.setProperty("--brand-text-secondary", branding.text_secondary_color);
      root.style.setProperty("--brand-font", branding.font_family);
      root.style.setProperty("--brand-radius", branding.border_radius);
    }
  }, [branding]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isLoading,
        refresh: loadBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

