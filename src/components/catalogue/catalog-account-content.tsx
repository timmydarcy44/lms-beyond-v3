"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/components/super-admin/branding-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Check, Clock, Download, Package } from "lucide-react";
import { CatalogCardImage } from "./catalog-card-image";
import { TestResultsViewer } from "./test-results-viewer";

type Purchase = {
  id: string;
  catalog_item_id: string;
  purchased_at: string;
  price_paid: number;
  status: "pending" | "completed" | "cancelled";
  catalog_item: {
    id: string;
    title: string;
    item_type: string;
    thumbnail_url: string | null;
    hero_image_url: string | null;
  };
};

export function CatalogAccountContent({ userId }: { userId: string }) {
  const { branding } = useBranding();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Couleurs du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const textSecondaryColor = branding?.text_secondary_color || '#8B6F47';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const accentColor = branding?.accent_color || '#D4AF37';

  useEffect(() => {
    async function loadPurchases() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase) {
          console.error("[catalogue/account] Supabase client not available");
          setPurchases([]);
          return;
        }
        
        // Récupérer les achats depuis catalog_access (achats à l'unité)
        const { data: access, error } = await supabase
          .from("catalog_access")
          .select(`
            id,
            catalog_item_id,
            granted_at,
            catalog_items (
              id,
              title,
              item_type,
              thumbnail_url,
              hero_image_url,
              price
            )
          `)
          .eq("user_id", userId)
          .order("granted_at", { ascending: false });

        if (error) {
          console.error("[catalogue/account] Error fetching purchases:", error);
          setPurchases([]);
          return;
        }

        // Transformer les données en format Purchase
        const purchasesData: Purchase[] = (access || []).map((item: any) => ({
          id: item.id,
          catalog_item_id: item.catalog_item_id,
          purchased_at: item.granted_at,
          price_paid: item.catalog_items?.price || 0,
          status: "completed" as const,
          catalog_item: {
            id: item.catalog_items.id,
            title: item.catalog_items.title,
            item_type: item.catalog_items.item_type,
            thumbnail_url: item.catalog_items.thumbnail_url,
            hero_image_url: item.catalog_items.hero_image_url,
          },
        }));

        setPurchases(purchasesData);
      } catch (error) {
        console.error("[catalogue/account] Error:", error);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    }

    loadPurchases();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div 
          className="text-lg"
          style={{ color: textSecondaryColor }}
        >
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* En-tête */}
      <div className="mb-8">
        <h1 
          className="text-4xl font-bold mb-2"
          style={{ color: textColor }}
        >
          Mon compte
        </h1>
        <p 
          className="text-base"
          style={{ color: textSecondaryColor }}
        >
          Gérez vos achats et accès aux contenus
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div 
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: surfaceColor,
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Package 
              className="h-5 w-5"
              style={{ color: primaryColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: textSecondaryColor }}
            >
              Contenus achetés
            </span>
          </div>
          <p 
            className="text-3xl font-bold"
            style={{ color: textColor }}
          >
            {purchases.length}
          </p>
        </div>

        <div 
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: surfaceColor,
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Check 
              className="h-5 w-5"
              style={{ color: primaryColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: textSecondaryColor }}
            >
              Accès actifs
            </span>
          </div>
          <p 
            className="text-3xl font-bold"
            style={{ color: textColor }}
          >
            {purchases.filter(p => p.status === "completed").length}
          </p>
        </div>

        <div 
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: surfaceColor,
            border: `1px solid ${primaryColor}20`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Download 
              className="h-5 w-5"
              style={{ color: primaryColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: textSecondaryColor }}
            >
              Téléchargements
            </span>
          </div>
          <p 
            className="text-3xl font-bold"
            style={{ color: textColor }}
          >
            0
          </p>
        </div>
      </div>

      {/* Liste des achats */}
      <div>
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Mes achats
        </h2>

        {purchases.length === 0 ? (
          <div 
            className="p-12 rounded-xl text-center"
            style={{ 
              backgroundColor: surfaceColor,
              border: `1px solid ${primaryColor}20`,
            }}
          >
            <Package 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: textSecondaryColor, opacity: 0.5 }}
            />
            <p 
              className="text-lg font-medium mb-2"
              style={{ color: textColor }}
            >
              Aucun achat pour le moment
            </p>
            <p 
              className="text-sm"
              style={{ color: textSecondaryColor }}
            >
              Explorez le catalogue pour découvrir nos contenus
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="group relative overflow-hidden rounded-xl"
                style={{ 
                  backgroundColor: surfaceColor,
                  border: `1px solid ${primaryColor}20`,
                }}
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <CatalogCardImage
                    src={purchase.catalog_item.thumbnail_url || purchase.catalog_item.hero_image_url}
                    alt={purchase.catalog_item.title}
                    title={purchase.catalog_item.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Badge de type */}
                  <div className="absolute top-2 right-2">
                    <span 
                      className="px-2 py-1 text-[10px] font-semibold uppercase rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {purchase.catalog_item.item_type}
                    </span>
                  </div>

                  {/* Badge de statut */}
                  <div className="absolute top-2 left-2">
                    <span 
                      className="px-2 py-1 text-[10px] font-semibold rounded-full flex items-center gap-1"
                      style={{ 
                        backgroundColor: purchase.status === "completed" ? "#10B981" : "#F59E0B",
                        color: '#FFFFFF',
                      }}
                    >
                      {purchase.status === "completed" ? (
                        <>
                          <Check className="h-3 w-3" />
                          Actif
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          En attente
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 
                    className="text-base font-semibold mb-2 line-clamp-2"
                    style={{ color: textColor }}
                  >
                    {purchase.catalog_item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p 
                        className="text-xs"
                        style={{ color: textSecondaryColor }}
                      >
                        Acheté {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true, locale: fr })}
                      </p>
                      {purchase.price_paid > 0 && (
                        <p 
                          className="text-sm font-semibold mt-1"
                          style={{ color: primaryColor }}
                        >
                          {purchase.price_paid.toFixed(2)} €
                        </p>
                      )}
                    </div>
                    <a
                      href={`/dashboard/catalogue/${purchase.catalog_item.item_type}/${purchase.catalog_item.id}`}
                      className="px-4 py-2 text-xs font-medium rounded-full transition-all"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Accéder
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Résultats de mes tests */}
      <TestResultsViewer userId={userId} colors={{
        primary: primaryColor,
        secondary: textSecondaryColor,
        accent: accentColor,
        text: textColor,
        textSecondary: textSecondaryColor,
        surface: surfaceColor,
        background: bgColor,
      }} />
    </div>
  );
}

