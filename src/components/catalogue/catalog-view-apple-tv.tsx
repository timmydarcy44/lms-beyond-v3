"use client";

import { useEffect, useState } from "react";
import { CatalogHero } from "./catalog-hero";
import { CatalogRow } from "./catalog-row";
import { CatalogTopNav } from "./catalog-top-nav";
import { CatalogThematicNav } from "./catalog-thematic-nav";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { Loader2 } from "lucide-react";

type CatalogItem = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  title: string;
  description: string;
  short_description: string;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  thematique: string | null;
  duration: string | null;
  level: string | null;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  course_slug?: string | null;
};

const TIM_SUPER_ADMIN_ID = "60c88469-3c53-417f-a81d-565a662ad2f5";
const TIM_BRANDING = {
  primary_color: "#0f0f10",
  secondary_color: "#1a1b1d",
  accent_color: "#7c7cff",
  background_color: "#000000",
  surface_color: "#111113",
  text_primary_color: "#f5f5f5",
  text_secondary_color: "#c7c7c7",
};

function applyBrandingToRoot(branding: Record<string, string>) {
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", branding.primary_color ?? "");
  root.style.setProperty("--brand-secondary", branding.secondary_color ?? "");
  root.style.setProperty("--brand-accent", branding.accent_color ?? "");
  root.style.setProperty("--brand-background", branding.background_color ?? "");
  root.style.setProperty("--brand-surface", branding.surface_color ?? "");
  root.style.setProperty("--brand-text-primary", branding.text_primary_color ?? "");
  root.style.setProperty("--brand-text-secondary", branding.text_secondary_color ?? "");
}

export function CatalogViewAppleTV() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedThematique, setSelectedThematique] = useState<string | null>(null);
  const [catalogBranding, setCatalogBranding] = useState<any>(null);
  const [initialThemeApplied, setInitialThemeApplied] = useState(false);

  // Charger le branding du catalogue
  useEffect(() => {
    async function loadBranding() {
      try {
        const hostElement = document.querySelector("[data-super-admin-id]");
        const parentSuperAdminId = hostElement?.getAttribute("data-super-admin-id");

        // Appliquer un thème noir immédiatement pour Tim afin d'éviter le flash beige
        if (!initialThemeApplied && parentSuperAdminId === TIM_SUPER_ADMIN_ID) {
          setCatalogBranding(TIM_BRANDING);
          applyBrandingToRoot(TIM_BRANDING);
          setInitialThemeApplied(true);
        }

        const response = await fetch("/api/catalogue/branding");
        const data = await response.json();
        if (data.branding) {
          setCatalogBranding(data.branding);
          // Appliquer les CSS variables
          applyBrandingToRoot(data.branding);
        } else if (parentSuperAdminId === TIM_SUPER_ADMIN_ID && !initialThemeApplied) {
          setCatalogBranding(TIM_BRANDING);
          applyBrandingToRoot(TIM_BRANDING);
          setInitialThemeApplied(true);
        }
      } catch (error) {
        console.error("[catalogue] Error loading branding:", error);
      }
    }
    loadBranding();
  }, [initialThemeApplied]);

  useEffect(() => {
    let cancelled = false;
    let abortController: AbortController | null = null;
    
    async function loadCatalog() {
      try {
        setLoading(true);
        
        // Créer un AbortController pour pouvoir annuler la requête
        abortController = new AbortController();
        
        // Timeout de 10 secondes
        const timeoutId = setTimeout(() => {
          if (!cancelled && abortController) {
            console.warn("[catalogue] Request timeout, showing empty state");
            abortController.abort();
            setCatalogItems([]);
            setFeaturedItems([]);
            setLoading(false);
          }
        }, 10000);
        
        // Récupérer l'email du Super Admin depuis l'URL, les params, ou les data attributes
        const urlParams = new URLSearchParams(window.location.search);
        let superAdminEmail = urlParams.get('superAdminEmail');
        let superAdminId = urlParams.get('superAdminId');
        
        // Si pas dans les params, chercher dans les data attributes du parent
        if (!superAdminEmail && !superAdminId) {
          const parentElement = document.querySelector('[data-super-admin-email]');
          if (parentElement) {
            superAdminEmail = parentElement.getAttribute('data-super-admin-email') || null;
            superAdminId = parentElement.getAttribute('data-super-admin-id') || null;
          }
        }
        
        // Construire l'URL avec les params si disponibles
        let apiUrl = "/api/catalogue";
        if (superAdminEmail) {
          apiUrl += `?superAdminEmail=${encodeURIComponent(superAdminEmail)}`;
        } else if (superAdminId) {
          apiUrl += `?superAdminId=${superAdminId}`;
        }
        
        const response = await fetch(apiUrl, {
          signal: abortController.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (cancelled) return;
        
        if (!response.ok) {
          console.error("[catalogue] API error:", response.status, response.statusText);
          setCatalogItems([]);
          setFeaturedItems([]);
          return;
        }
        
        const data = await response.json();
        
        if (cancelled) return;
        
        if (data.items && Array.isArray(data.items)) {
          setCatalogItems(data.items);
          // Items en vedette pour le hero
          setFeaturedItems(data.items.filter((item: CatalogItem) => item.hero_image_url));
        } else {
          setCatalogItems([]);
          setFeaturedItems([]);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          console.warn("[catalogue] Request aborted or timed out");
        } else {
          console.error("[catalogue] Error loading catalog:", error);
        }
        if (!cancelled) {
          setCatalogItems([]);
          setFeaturedItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCatalog();
    
    return () => {
      cancelled = true;
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  // Filtrer par thématique si sélectionnée
  const filteredItems = selectedThematique
    ? catalogItems.filter(
        (item) => (item.thematique || item.category) === selectedThematique
      )
    : catalogItems;

  // Grouper les items par catégorie
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  // Grouper les items par type
  const itemsByType = {
    modules: filteredItems.filter((item) => item.item_type === "module"),
    parcours: filteredItems.filter((item) => item.item_type === "parcours"),
    ressources: filteredItems.filter((item) => item.item_type === "ressource"),
    tests: filteredItems.filter((item) => item.item_type === "test"),
  };

  // Utiliser les variables CSS du branding si disponibles
  // Par défaut: noir pour timdarcypro, beige pour contentin.cabinet
  // Pour contentin.cabinet@gmail.com, utiliser le background_color du branding
  // Pour les autres, utiliser noir par défaut
  const bgColor = catalogBranding?.background_color || "#F5F0E8";
  const textColor = catalogBranding?.text_primary_color || "#5D4037";
  const primaryColor = catalogBranding?.primary_color || "#8B6F47"; // Marron
  const accentColor = catalogBranding?.accent_color || "#D4AF37"; // Doré
  const secondaryColor = catalogBranding?.secondary_color || "#D4C4A8"; // Beige
  const surfaceColor = catalogBranding?.surface_color || "#F5F0E8"; // Beige clair
  
  if (loading) {
    return (
      <div 
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }
  
  return (
    <div 
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Navigation horizontale en haut - Style Apple TV/Netflix */}
      <CatalogTopNav
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen(!isNavOpen)}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        cartButton={<CartButton />}
      />
      
      {/* Drawer du panier */}
      <CartDrawer />

      {/* Navigation par thématiques - Style Netflix */}
      <CatalogThematicNav
        items={catalogItems}
        selectedThematique={selectedThematique}
        onThematiqueSelect={setSelectedThematique}
      />

      {/* Contenu principal - Sans margin car pas de sidebar gauche */}
      <div className="flex-1">
        {/* Hero Section avec le contenu en vedette - Style Apple TV+ */}
        {filteredItems.length > 0 ? (
          <CatalogHero
            items={
              featuredItems.length > 0
                ? featuredItems.filter((item) =>
                    selectedThematique
                      ? (item.thematique || item.category) === selectedThematique
                      : true
                  )
                : [filteredItems[0]]
            }
            onItemClick={(item) => {
              // Rediriger vers la page de détail du contenu
              window.location.href = `/dashboard/catalogue/${item.item_type}/${item.id}`;
            }}
          />
        ) : null}

        {/* Carrousels horizontaux par type - Style Apple TV+ */}
        <div className="space-y-10 px-8 pb-16 pt-8">
          {/* Si pas de contenu, afficher un message */}
          {catalogItems.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-4">Aucun contenu disponible</h2>
              <p className="text-white/60">Le catalogue sera bientôt rempli de contenus passionnants.</p>
            </div>
          )}

          {/* Modules */}
          {itemsByType.modules.length > 0 && (
            <CatalogRow
              title="Modules"
              items={itemsByType.modules}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/module/${item.id}`;
              }}
            />
          )}

          {/* Parcours */}
          {itemsByType.parcours.length > 0 && (
            <CatalogRow
              title="Parcours"
              items={itemsByType.parcours}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/parcours/${item.id}`;
              }}
            />
          )}

          {/* Ressources */}
          {itemsByType.ressources.length > 0 && (
            <CatalogRow
              title="Ressources"
              items={itemsByType.ressources}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/ressource/${item.id}`;
              }}
            />
          )}

          {/* Tests */}
          {itemsByType.tests.length > 0 && (
            <CatalogRow
              title="Tests & Évaluations"
              items={itemsByType.tests}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/test/${item.id}`;
              }}
            />
          )}

          {/* Par catégorie si sélectionnée */}
          {selectedCategory && itemsByCategory[selectedCategory] && (
            <CatalogRow
              title={selectedCategory}
              items={itemsByCategory[selectedCategory]}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/${item.item_type}/${item.id}`;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

