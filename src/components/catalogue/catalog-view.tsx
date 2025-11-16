"use client";

import { useEffect, useState } from "react";
import { CatalogHero } from "./catalog-hero";
import { CatalogRow } from "./catalog-row";
import { CatalogSidebar } from "./catalog-sidebar";
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
  duration: string | null;
  level: string | null;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  course_slug?: string | null;
};

export function CatalogView() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [featuredItems, setFeaturedItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalogue");
        const data = await response.json();
        
        if (data.items) {
          setCatalogItems(data.items);
          // Items en vedette pour le hero
          setFeaturedItems(data.items.filter((item: CatalogItem) => item.hero_image_url));
        }
      } catch (error) {
        console.error("[catalogue] Error loading catalog:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Grouper les items par catégorie
  const itemsByCategory = catalogItems.reduce((acc, item) => {
    const category = item.category || "Autres";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  // Grouper les items par type
  const itemsByType = {
    modules: catalogItems.filter((item) => item.item_type === "module"),
    parcours: catalogItems.filter((item) => item.item_type === "parcours"),
    ressources: catalogItems.filter((item) => item.item_type === "ressource"),
    tests: catalogItems.filter((item) => item.item_type === "test"),
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar gauche */}
      <CatalogSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Contenu principal */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Hero Section avec le contenu en vedette - Style Apple TV+ */}
        {featuredItems.length > 0 ? (
          <CatalogHero
            items={featuredItems}
            onItemClick={(item) => {
              window.location.href = `/dashboard/catalogue/${item.item_type}/${item.id}`;
            }}
          />
        ) : catalogItems.length > 0 ? (
          // Si pas d'hero image mais des items, créer un hero avec le premier item
          <div className="relative h-[70vh] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black" />
            <div className="relative z-10 flex h-full flex-col justify-end p-12">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                  {catalogItems[0].title}
                </h1>
                {catalogItems[0].short_description && (
                  <p className="max-w-xl text-lg text-white/90 md:text-xl">
                    {catalogItems[0].short_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Carrousels horizontaux par type - Style Apple TV+ */}
        <div className="space-y-10 px-8 pb-16 pt-8">
          {/* Si pas de contenu, afficher un message ou des placeholders */}
          {catalogItems.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-4">Aucun contenu disponible</h2>
              <p className="text-white/60">Le catalogue sera bientôt rempli de contenus passionnants.</p>
            </div>
          )}

          {/* Toujours afficher les sections, même si vides, pour le design */}
          {itemsByType.modules.length > 0 && (
            <CatalogRow
              title="Modules"
              items={itemsByType.modules}
            onItemClick={(item) => {
              // Utiliser course_slug si disponible, sinon l'ID
              const identifier = item.course_slug || item.id;
              window.location.href = `/catalog/formations/${identifier}`;
            }}
            />
          )}

          {itemsByType.parcours.length > 0 && (
            <CatalogRow
              title="Parcours"
              items={itemsByType.parcours}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/parcours/${item.id}`;
              }}
            />
          )}

          {itemsByType.ressources.length > 0 && (
            <CatalogRow
              title="Ressources"
              items={itemsByType.ressources}
              onItemClick={(item) => {
                window.location.href = `/dashboard/catalogue/ressource/${item.id}`;
              }}
            />
          )}

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

