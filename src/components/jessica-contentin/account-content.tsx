"use client";

import { useEffect, useState } from "react";
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
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté avant de faire des requêtes (évite les problèmes d'hydratation)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ne pas faire de requête si le composant n'est pas monté
    if (!isMounted) return;

    let isMountedRef = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    async function loadPurchases() {
      try {
        // Utiliser AbortController pour gérer le timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 10 secondes de timeout
        
        // Utiliser une API route pour les requêtes lourdes (plus rapide et plus fiable)
        const apiUrl = `/api/jessica-contentin/account/purchases?userId=${userId}${jessicaProfileId ? `&jessicaProfileId=${jessicaProfileId}` : ''}`;
        console.log("[jessica-contentin/account] Fetching purchases from:", apiUrl);
        console.log("[jessica-contentin/account] Parameters:", { userId, jessicaProfileId });
        
        const response = await fetch(apiUrl, { signal: controller.signal });

        console.log("[jessica-contentin/account] Response status:", response.status, response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[jessica-contentin/account] API error response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        console.log("[jessica-contentin/account] API result:", result);
        
        const { data: access, error } = result;

        console.log("[jessica-contentin/account] API response:", {
          userId,
          jessicaProfileId,
          accessCount: access?.length || 0,
          access: access?.map((a: any) => ({
            id: a.id,
            catalog_item_id: a.catalog_item_id,
            access_status: a.access_status,
            catalog_item: a.catalog_items ? {
              id: a.catalog_items.id,
              title: a.catalog_items.title,
              creator_id: a.catalog_items.creator_id,
            } : null,
          })) || [],
          error,
        });

        if (!isMountedRef) {
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          console.error("[jessica-contentin/account] Error fetching purchases:", error);
          if (isMountedRef) {
            setPurchases([]);
            setLoading(false);
          }
          return;
        }

        // Transformer les données en format Purchase
        // Le filtre access_status est déjà fait dans la requête, donc on peut simplifier
        const purchasesData: Purchase[] = (access || [])
          .filter((item: any) => {
            // Filtrer les items valides
            const isValid = !!item.catalog_items;
            if (!isValid) {
              console.warn("[jessica-contentin/account] Item without catalog_items:", item);
            }
            return isValid;
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

        console.log("[jessica-contentin/account] Transformed purchases:", {
          count: purchasesData.length,
          purchases: purchasesData.map(p => ({
            id: p.id,
            title: p.catalog_item.title,
            item_type: p.catalog_item.item_type,
          })),
        });

        if (isMountedRef) {
          setPurchases(purchasesData);
          setLoading(false);
        }
      } catch (error) {
        console.error("[jessica-contentin/account] Error:", error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error);
        if (isMountedRef) {
          setPurchases([]);
          setLoading(false);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    loadPurchases();
    
    return () => {
      isMountedRef = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId, jessicaProfileId, isMounted]);

  const getItemUrl = (item: Purchase["catalog_item"]) => {
    if (item.item_type === "module") {
      return `/formations/${item.content_id}`;
    } else if (item.item_type === "ressource") {
      // Utiliser le slug si disponible, sinon l'ID
      return `/ressources/${item.content_id}`;
    } else if (item.item_type === "test") {
      // Pour le test de confiance en soi, utiliser l'URL spéciale
      // Vérifier si c'est le test de confiance en soi par le titre ou le content_id
      if (item.title?.toLowerCase().includes("confiance en soi") || item.title === "Test de Confiance en soi") {
        return `/test-confiance-en-soi`;
      }
      // Pour les autres tests, utiliser la route dashboard
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

  // Ne rien afficher tant que le composant n'est pas monté (évite les problèmes d'hydratation)
  if (!isMounted) {
    return null; // Retourner null pendant l'hydratation
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        {/* Hero Section Skeleton */}
        <section className="py-20 mx-4 mb-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <div className="h-12 bg-gray-200 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse" />
            </div>
          </div>
        </section>

        {/* Contenu principal Skeleton */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          {/* Statistiques Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>

          {/* Liste Skeleton */}
          <div className="mb-12">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-gray-100 animate-pulse">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
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

