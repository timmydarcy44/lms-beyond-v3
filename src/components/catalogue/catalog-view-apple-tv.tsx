"use client";

import { useEffect, useMemo, useState } from "react";
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
  category_name?: string | null;
  thematique: string | null;
  duration: string | null;
  level: string | null;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  course_slug?: string | null;
  created_at?: string;
  updated_at?: string;
  content_format?: "text" | "audio" | "video" | null;
  /** Renseigné pour les modules enrichis depuis `courses` */
  category_id?: string | null;
};

const AUTRES_ROW_KEY = "__autres__";

export type CatalogViewAppleTVProps = {
  /** Permet d'utiliser la vue Apple TV avec des données déjà chargées (ex: dashboard apprenant). */
  initialItems?: CatalogItem[];
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

export function CatalogViewAppleTV({ initialItems }: CatalogViewAppleTVProps) {
  const pathname = usePathname();
  const isSuperAdminPreview = pathname?.includes('/super/catalogue/preview');
  const currentOrgSlug = useMemo(() => {
    const p = String(pathname ?? "");
    const m = p.match(/^\/g\/([^/]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, [pathname]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [catalogBranding, setCatalogBranding] = useState<any>(null);
  const [initialThemeApplied, setInitialThemeApplied] = useState(false);
  const [orgCategoryList, setOrgCategoryList] = useState<Array<{ id: string; name: string }> | null>(null);

  useEffect(() => {
    if (!initialItems) return;
    setCatalogItems(initialItems);
    setFeaturedItems(initialItems.filter((item) => item.hero_image_url));
    setLoading(false);
  }, [initialItems]);

  useEffect(() => {
    let cancelled = false;
    // Netflix-style rows: thématiques de la galaxie courante uniquement.
    setOrgCategoryList(null);
    if (!currentOrgSlug) return () => { cancelled = true; };
    (async () => {
      try {
        const res = await fetch(`/api/course-categories?orgSlug=${encodeURIComponent(currentOrgSlug)}`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        const list = Array.isArray((json as any)?.categories) ? (json as any).categories : [];
        const cleaned = (list as unknown[])
          .map((x) => {
            if (x && typeof x === "object" && "id" in (x as object) && "name" in (x as object)) {
              const o = x as { id: unknown; name: unknown };
              return { id: String(o.id ?? "").trim(), name: String(o.name ?? "").trim() };
            }
            return null;
          })
          .filter((c): c is { id: string; name: string } => Boolean(c?.id && c?.name));
        if (!cancelled) setOrgCategoryList(cleaned);
      } catch {
        if (!cancelled) setOrgCategoryList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentOrgSlug]);

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
        if (initialItems) return;
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

  // Debug demandé : vérifier que les données arrivent bien jusqu'au composant.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("Cours reçus par le composant:", catalogItems);
  }, [catalogItems]);

  const { filteredItems, itemsByRowKey, sortedRows } = useMemo(() => {
    // Contexte /g/:orgSlug : ne pas filtrer sur organization_id (colonne problématique).
    // On se base uniquement sur les IDs de thématiques de l'API.
    const allowedCategoryIds = new Set((orgCategoryList ?? []).map((c) => c.id));

    const scoped = currentOrgSlug
      ? catalogItems.map((item) => {
          const id = String(item.category_id ?? "").trim();
          // Si l'item a un category_id qui ne fait pas partie de la galaxie,
          // on le garde mais on le basculera en "Autres" via la clé de grouping.
          if (id && allowedCategoryIds.size > 0 && !allowedCategoryIds.has(id)) {
            return { ...item, category_id: null };
          }
          return item;
        })
      : catalogItems;

    const byKey = scoped.reduce((acc, item) => {
      const id = String(item.category_id ?? "").trim();
      const name =
        String(item.category_name ?? "").trim() ||
        String(item.category ?? "").trim() ||
        String(item.thematique ?? "").trim();

      // Fallback : category_id → sinon category_name/category → sinon "Autres".
      const key = id || name || AUTRES_ROW_KEY;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, CatalogItem[]>);

    Object.keys(byKey).forEach((k) => {
      byKey[k].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    });

    const titleForKey = (key: string) => {
      if (key === AUTRES_ROW_KEY) return "Autres";
      // UUID -> titre depuis l'API (category_name), sinon fallback item.category_name/category.
      const api = (orgCategoryList ?? []).find((c) => c.id === key);
      if (api?.name) return api.name;
      const first = byKey[key]?.[0];
      return (
        String(first?.category_name ?? "").trim() ||
        String(first?.category ?? "").trim() ||
        String(first?.thematique ?? "").trim() ||
        key
      );
    };

    const rows: Array<{ key: string; title: string }> = [];

    // Rangées API (tri alphabétique) en premier si galaxie
    if (currentOrgSlug && orgCategoryList) {
      const apiSorted = [...orgCategoryList].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
      );
      for (const c of apiSorted) {
        if ((byKey[c.id]?.length ?? 0) > 0) rows.push({ key: c.id, title: c.name });
      }
    }

    const used = new Set(rows.map((r) => r.key));
    const orphanKeys = Object.keys(byKey)
      .filter((k) => (byKey[k]?.length ?? 0) > 0)
      .filter((k) => k !== AUTRES_ROW_KEY)
      .filter((k) => !used.has(k));
    orphanKeys.sort((a, b) => titleForKey(a).localeCompare(titleForKey(b), "fr", { sensitivity: "base" }));
    for (const k of orphanKeys) rows.push({ key: k, title: titleForKey(k) });

    if ((byKey[AUTRES_ROW_KEY]?.length ?? 0) > 0) rows.push({ key: AUTRES_ROW_KEY, title: "Autres" });

    return { filteredItems: scoped, itemsByRowKey: byKey, sortedRows: rows };
  }, [catalogItems, currentOrgSlug, orgCategoryList]);

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

        {/* Carrousels horizontaux par thématique - Style Netflix */}
        <div className="w-full max-w-none space-y-10 px-0 pb-16 pt-8">
          {/* Si pas de contenu, afficher un message */}
          {catalogItems.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-4">Aucun contenu disponible</h2>
              <p className="text-white/60">Le catalogue sera bientôt rempli de contenus passionnants.</p>
            </div>
          )}

          {/* Afficher une ligne par catégorie (Business, IA, Soft Skills, etc.) */}
          {sortedRows.length > 0 ? (
            sortedRows.map(({ key, title }) => {
              const categoryItems = itemsByRowKey[key];
              if (!categoryItems || categoryItems.length === 0) return null;

              return (
                <div key={key} className="w-full max-w-none">
                  <CatalogRow
                    title={title}
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
                </div>
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

