"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CatalogHero } from "./catalog-hero";
import { CatalogRow } from "./catalog-row";
import { CatalogTopNav } from "./catalog-top-nav";
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
  created_at?: string;
  updated_at?: string;
  content_format?: "text" | "audio" | "video" | null;
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
  const pathname = usePathname();
  const isSuperAdminPreview = pathname?.includes('/super/catalogue/preview');
  console.log("[catalogue] pathname:", pathname, "isSuperAdminPreview:", isSuperAdminPreview);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
        
        // Timeout de 30 secondes (augmenté pour permettre le chargement)
        const timeoutId = setTimeout(() => {
          if (!cancelled && abortController) {
            console.warn("[catalogue] Request timeout, showing empty state");
            abortController.abort();
            setCatalogItems([]);
            setFeaturedItems([]);
            setLoading(false);
          }
        }, 30000);
        
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
        
        // Si on est dans le preview Super Admin, utiliser l'API qui affiche tous les contenus
        let apiUrl = isSuperAdminPreview 
          ? "/api/super-admin/catalogue/all-content"
          : "/api/catalogue";
        
        // Pour l'API publique, ajouter les params si disponibles
        if (!isSuperAdminPreview) {
          if (superAdminEmail) {
            apiUrl += `?superAdminEmail=${encodeURIComponent(superAdminEmail)}`;
          } else if (superAdminId) {
            apiUrl += `?superAdminId=${superAdminId}`;
          }
        }
        
        console.log("[catalogue] Fetching from:", apiUrl, "isSuperAdminPreview:", isSuperAdminPreview);
        const response = await fetch(apiUrl, {
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log("[catalogue] Response status:", response.status, response.statusText);
        
        clearTimeout(timeoutId);
        
        if (cancelled) return;
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[catalogue] API error:", response.status, response.statusText, errorText);
          setCatalogItems([]);
          setFeaturedItems([]);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log("[catalogue] Received data:", { itemsCount: data.items?.length || 0, hasItems: !!data.items });
        
        if (cancelled) return;
        
        if (data.items && Array.isArray(data.items)) {
          console.log("[catalogue] Setting catalog items:", data.items.length);
          setCatalogItems(data.items);
          // Items en vedette pour le hero
          setFeaturedItems(data.items.filter((item: CatalogItem) => item.hero_image_url));
        } else {
          console.warn("[catalogue] No items in response or invalid format:", data);
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
  }, [isSuperAdminPreview]);

  // Pas de filtre par thématique (supprimé)
  const filteredItems = catalogItems;

  // Grouper les items par catégorie et trier par date de création (plus récent en premier)
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);
  
  // Trier les items dans chaque catégorie par date de création (plus récent en premier)
  Object.keys(itemsByCategory).forEach(category => {
    itemsByCategory[category].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Plus récent en premier
    });
  });

  // Trier les catégories par ordre de priorité (catégories populaires en premier)
  const categoryPriority: Record<string, number> = {
    "Business": 1,
    "Intelligence Artificielle": 2,
    "Soft Skills": 3,
    "Bac+2": 4,
    "Leadership": 5,
    "Neurosciences": 6,
    "Management": 7,
    "Vente": 8,
    "Communication": 9,
    "Développement personnel": 10,
    "Autres": 50, // Changé de 999 à 50 pour que "Autres" apparaisse avant les catégories non définies
  };

  // Obtenir les catégories triées
  const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
    const priorityA = categoryPriority[a] || 100;
    const priorityB = categoryPriority[b] || 100;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Si même priorité, trier par date de création (plus récent en premier)
    const itemsA = itemsByCategory[a];
    const itemsB = itemsByCategory[b];
    if (itemsA.length > 0 && itemsB.length > 0) {
      const latestA = new Date(Math.max(...itemsA.map(item => new Date(item.created_at || 0).getTime())));
      const latestB = new Date(Math.max(...itemsB.map(item => new Date(item.created_at || 0).getTime())));
      return latestB.getTime() - latestA.getTime();
    }
    // Si même priorité, trier alphabétiquement
    return a.localeCompare(b, 'fr');
  });

  // Grouper les items par type
  const itemsByType = {
    modules: filteredItems.filter((item) => item.item_type === "module"),
    parcours: filteredItems.filter((item) => item.item_type === "parcours"),
    ressources: filteredItems.filter((item) => item.item_type === "ressource"),
    tests: filteredItems.filter((item) => item.item_type === "test"),
  };

  // Style Netflix: TOUT EN NOIR pour Beyond No School
  // Pour contentin.cabinet@gmail.com, utiliser le background_color du branding (beige)
  const isContentin = catalogBranding?.background_color === '#F5F0E8' || catalogBranding?.background_color === '#F8F9FB';
  const bgColor = isContentin ? (catalogBranding?.background_color || "#F5F0E8") : "#000000"; // TOUJOURS noir pour No School
  const textColor = isContentin ? (catalogBranding?.text_primary_color || "#5D4037") : "#ffffff"; // TOUJOURS blanc pour No School
  const primaryColor = isContentin ? (catalogBranding?.primary_color || "#8B6F47") : "#e50914"; // Rouge Netflix
  const accentColor = isContentin ? (catalogBranding?.accent_color || "#D4AF37") : "#e50914"; // Rouge Netflix
  const secondaryColor = isContentin ? (catalogBranding?.secondary_color || "#D4C4A8") : "#b3b3b3"; // Gris clair
  const surfaceColor = isContentin ? (catalogBranding?.surface_color || "#F5F0E8") : "#111111"; // Noir foncé
  
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
      className="flex min-h-screen flex-col fixed inset-0 overflow-y-auto"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Navigation horizontale en haut - Style Netflix (transparent, au-dessus du hero) */}
      <CatalogTopNav
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen(!isNavOpen)}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
        cartButton={<CartButton />}
      />
      
      {/* Drawer du panier */}
      <CartDrawer />


      {/* Contenu principal - Sans margin car pas de sidebar gauche */}
      <div className="flex-1">
        {/* Hero Section avec le contenu en vedette - Style Netflix (carrousel, sous le header) */}
        {filteredItems.length > 0 ? (
          <CatalogHero
            items={filteredItems}
            onItemClick={(item) => {
              // Rediriger vers la page de détail du contenu
              window.location.href = `/dashboard/catalogue/${(item as any).item_type}/${item.id}`;
            }}
          />
        ) : (
          <div className="h-[85vh] -mt-[44px]" style={{ backgroundColor: bgColor }} />
        )}

        {/* Carrousels horizontaux par catégorie - Style Netflix */}
        <div className="space-y-10 px-8 pb-16 pt-8">
          {/* Si pas de contenu, afficher un message */}
          {catalogItems.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-4">Aucun contenu disponible</h2>
              <p className="text-white/60">Le catalogue sera bientôt rempli de contenus passionnants.</p>
            </div>
          )}

          {/* Afficher une ligne par catégorie (Business, IA, Soft Skills, etc.) */}
          {sortedCategories.length > 0 ? (
            sortedCategories.map((category) => {
              const categoryItems = itemsByCategory[category];
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <CatalogRow
                  key={category}
                  title={category}
                  items={categoryItems}
                  onItemClick={(item) => {
                    if (item.item_type === "module") {
                      window.location.href = `/dashboard/catalogue/module/${item.id}`;
                    } else if (item.item_type === "ressource") {
                      window.location.href = `/dashboard/catalogue/ressource/${item.id}`;
                    } else if (item.item_type === "test") {
                      window.location.href = `/dashboard/catalogue/test/${item.id}`;
                    } else if (item.item_type === "parcours") {
                      window.location.href = `/dashboard/catalogue/parcours/${item.id}`;
                    } else {
                      window.location.href = `/dashboard/catalogue/module/${item.id}`;
                    }
                  }}
                />
              );
            })
          ) : (
            /* Fallback : afficher par type si aucune catégorie n'est définie */
            <>
              {/* Modules */}
              {itemsByType.modules.length > 0 && (
                <CatalogRow
                  title="Formations"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

