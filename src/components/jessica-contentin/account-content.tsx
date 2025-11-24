"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Check, Clock, Package, Play, FileText, Video, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestResultsViewer } from "@/components/catalogue/test-results-viewer";
import { ProfileSection } from "@/components/jessica-contentin/profile-section";

type Purchase = {
  id: string;
  catalog_item_id: string;
  granted_at: string;
  price_paid: number;
  status: "completed";
  catalog_item: {
    id: string;
    title: string;
    item_type: string;
    thumbnail_url: string | null;
    hero_image_url: string | null;
    content_id: string;
  };
};

// Couleurs de branding Jessica Contentin
const bgColor = "#FFFFFF";
const surfaceColor = "#F8F5F0";
const textColor = "#2F2A25";
const primaryColor = "#C6A664";
const accentColor = "#D4AF37";

export function JessicaContentinAccountContent({ 
  userId, 
  jessicaProfileId 
}: { 
  userId: string;
  jessicaProfileId?: string;
}) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function loadPurchases() {
      try {
        const supabase = createSupabaseBrowserClient();
        
        if (!supabase) {
          console.error("[jessica-contentin/account] Supabase client not available");
          if (isMounted) {
            setPurchases([]);
            setLoading(false);
          }
          return;
        }
        
        // Récupérer les achats depuis catalog_item_access (table correcte pour les accès B2C)
        let query = supabase
          .from("catalog_item_access")
          .select(`
            id,
            catalog_item_id,
            granted_at,
            access_status,
            access_type,
            catalog_items!inner (
              id,
              title,
              item_type,
              thumbnail_url,
              hero_image_url,
              content_id,
              price,
              creator_id
            )
          `)
          .eq("user_id", userId)
          .order("granted_at", { ascending: false });

        // Filtrer uniquement les contenus de Jessica Contentin si on a son ID
        if (jessicaProfileId) {
          query = query.eq("catalog_items.creator_id", jessicaProfileId);
        }

        const { data: access, error } = await query;

        if (!isMounted) return;

        if (error) {
          console.error("[jessica-contentin/account] Error fetching purchases:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            error: error,
            fullError: JSON.stringify(error, null, 2),
          });
          // Ne pas bloquer si c'est juste une erreur de permissions ou de table inexistante
          if (error.code !== '42P01' && error.code !== '42501') {
            if (isMounted) {
              setPurchases([]);
              setLoading(false);
            }
            return;
          }
          // Si c'est une erreur de permissions, continuer avec un tableau vide
          if (isMounted) {
            setPurchases([]);
          }
        }

        // Transformer les données en format Purchase
        // Filtrer par access_status ou access_type (les deux peuvent exister)
        const purchasesData: Purchase[] = (access || [])
          .filter((item: any) => {
            // Filtrer les items valides
            if (!item.catalog_items) return false;
            
            // Vérifier l'accès : purchased, manually_granted, ou free
            const hasAccess = 
              item.access_status === "purchased" || 
              item.access_status === "manually_granted" || 
              item.access_status === "free" ||
              item.access_type === "purchased" ||
              item.access_type === "manually_granted" ||
              item.access_type === "free";
            
            return hasAccess;
          })
          .map((item: any) => ({
            id: item.id,
            catalog_item_id: item.catalog_item_id,
            granted_at: item.granted_at || new Date().toISOString(),
            price_paid: item.catalog_items?.price || 0,
            status: "completed" as const,
            catalog_item: {
              id: item.catalog_items.id,
              title: item.catalog_items.title,
              item_type: item.catalog_items.item_type,
              thumbnail_url: item.catalog_items.thumbnail_url,
              hero_image_url: item.catalog_items.hero_image_url,
              content_id: item.catalog_items.content_id,
            },
          }));

        if (isMounted) {
          setPurchases(purchasesData);
          setLoading(false);
        }
      } catch (error) {
        console.error("[jessica-contentin/account] Error:", error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error);
        if (isMounted) {
          setPurchases([]);
          setLoading(false);
        }
      }
    }

    loadPurchases();
    
    return () => {
      isMounted = false;
    };
  }, [userId, jessicaProfileId]);

  const getItemUrl = (item: Purchase["catalog_item"]) => {
    if (item.item_type === "module") {
      return `/formations/${item.content_id}`;
    } else if (item.item_type === "ressource") {
      return `/ressources/${item.content_id}`;
    } else if (item.item_type === "test") {
      return `/dashboard/catalogue/test/${item.content_id}`;
    }
    return "#";
  };

  const getItemIcon = (itemType: string) => {
    if (itemType === "module") {
      return <Play className="h-4 w-4" />;
    } else if (itemType === "ressource") {
      return <FileText className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div 
          className="text-lg"
          style={{ color: `${textColor}80` }}
        >
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section - comme les autres pages internes */}
      <section className="py-20 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h1 
              className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Mon compte
            </h1>
            <p 
              className="text-lg text-[#2F2A25]/80 leading-relaxed max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Gérez vos achats et accès aux contenus
            </p>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 pb-12">

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div 
          className="p-6 rounded-xl"
          style={{ 
            backgroundColor: surfaceColor,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Package 
              className="h-5 w-5"
              style={{ color: primaryColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: `${textColor}80` }}
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
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Check 
              className="h-5 w-5"
              style={{ color: primaryColor }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: `${textColor}80` }}
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
      </div>

      {/* Liste des achats */}
      <div>
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Mes contenus
        </h2>

        {purchases.length === 0 ? (
          <div 
            className="p-12 rounded-xl text-center"
            style={{ 
              backgroundColor: surfaceColor,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            <Package 
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: `${textColor}80`, opacity: 0.5 }}
            />
            <p 
              className="text-lg font-medium mb-2"
              style={{ color: textColor }}
            >
              Aucun contenu pour le moment
            </p>
            <p 
              className="text-sm"
              style={{ color: `${textColor}80` }}
            >
              Explorez les ressources pour découvrir nos contenus
            </p>
            <Link href="/jessica-contentin/ressources">
              <Button
                className="mt-4 rounded-full px-6"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                }}
              >
                Voir les ressources
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="group relative overflow-hidden rounded-xl"
                style={{ 
                  backgroundColor: surfaceColor,
                  border: `1px solid ${primaryColor}30`,
                }}
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {(purchase.catalog_item.thumbnail_url || purchase.catalog_item.hero_image_url) ? (
                    <Image
                      src={purchase.catalog_item.thumbnail_url || purchase.catalog_item.hero_image_url || ""}
                      alt={purchase.catalog_item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      {getItemIcon(purchase.catalog_item.item_type)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Badge de type */}
                  <div className="absolute top-2 right-2">
                    <span 
                      className="px-2 py-1 text-[10px] font-semibold uppercase rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {purchase.catalog_item.item_type === "module" ? "Formation" : 
                       purchase.catalog_item.item_type === "ressource" ? "Ressource" : 
                       "Test"}
                    </span>
                  </div>

                  {/* Badge de statut */}
                  <div className="absolute top-2 left-2">
                    <span 
                      className="px-2 py-1 text-[10px] font-semibold rounded-full flex items-center gap-1"
                      style={{ 
                        backgroundColor: "#10B981",
                        color: '#FFFFFF',
                      }}
                    >
                      <Check className="h-3 w-3" />
                      Actif
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
                        style={{ color: `${textColor}80` }}
                      >
                        Accès obtenu {formatDistanceToNow(new Date(purchase.granted_at), { addSuffix: true, locale: fr })}
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
                    <Link href={getItemUrl(purchase.catalog_item)}>
                      <Button
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
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section Mes résultats */}
      <div className="mt-12">
        <TestResultsViewer 
          userId={userId} 
          colors={{
            primary: primaryColor,
            secondary: `${textColor}80`,
            accent: accentColor,
            text: textColor,
            textSecondary: `${textColor}80`,
            surface: surfaceColor,
            background: bgColor,
          }}
          showHeader={true}
        />
      </div>

      {/* Section Profil */}
      <div className="mt-12">
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Mon profil
        </h2>
        <ProfileSection userId={userId} />
      </div>
      </div>
    </>
  );
}

