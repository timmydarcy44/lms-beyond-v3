"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { Check, Package, Play, FileText, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

const bgColor = "#FFFFFF";
const surfaceColor = "#FAFAF8";
const textColor = "#2F2A25";
const terracotta = "#C4704B";
const terracottaHover = "#A85A38";
const borderColor = "#E8E4DF";

export function JessicaContentinAccountContent({
  userId,
  jessicaProfileId,
  firstName,
}: {
  userId: string;
  jessicaProfileId?: string;
  firstName?: string | null;
}) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const greetingName = firstName?.trim() || "à vous";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let isMountedRef = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function loadPurchases() {
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const apiUrl = `/api/jessica-contentin/account/purchases?userId=${userId}${jessicaProfileId ? `&jessicaProfileId=${jessicaProfileId}` : ""}`;
        const response = await fetch(apiUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const { data: access, error } = result;

        if (!isMountedRef) {
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }

        if (timeoutId) clearTimeout(timeoutId);

        if (error) {
          if (isMountedRef) {
            setPurchases([]);
            setLoading(false);
          }
          return;
        }

        const purchasesData: Purchase[] = (access || [])
          .filter((item: { catalog_items?: unknown }) => !!item.catalog_items)
          .map((item: {
            id: string;
            catalog_item_id: string;
            granted_at?: string;
            catalog_items: {
              id: string;
              title: string;
              item_type: string;
              thumbnail_url: string | null;
              hero_image_url: string | null;
              content_id: string;
              price?: number;
            };
          }) => ({
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

        if (isMountedRef) {
          setPurchases(purchasesData);
          setLoading(false);
        }
      } catch {
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
    }
    if (item.item_type === "ressource") {
      return `/ressources/${item.content_id}`;
    }
    if (item.item_type === "test") {
      if (item.title?.toLowerCase().includes("confiance en soi") || item.title === "Test de Confiance en soi") {
        return `/test-confiance-en-soi`;
      }
      return `/dashboard/catalogue/test/${item.content_id}`;
    }
    return "#";
  };

  const getItemIcon = (itemType: string) => {
    if (itemType === "module") return <Play className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-10 h-10 w-72 animate-pulse rounded-lg bg-neutral-100" />
          <div className="mb-4 h-6 w-96 animate-pulse rounded bg-neutral-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="mb-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">Espace personnel</p>
          <h1
            className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl"
            style={{ color: textColor }}
          >
            Bonjour {greetingName}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
            Retrouvez ici vos contenus, formations et ressources achetés.
          </p>
        </header>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: surfaceColor, borderColor }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-500">
              <Package className="h-4 w-4" style={{ color: terracotta }} />
              Contenus achetés
            </div>
            <p className="text-4xl font-semibold" style={{ color: textColor }}>
              {purchases.length}
            </p>
          </div>
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: surfaceColor, borderColor }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-500">
              <Check className="h-4 w-4" style={{ color: terracotta }} />
              Accès actifs
            </div>
            <p className="text-4xl font-semibold" style={{ color: textColor }}>
              {purchases.filter((p) => p.status === "completed").length}
            </p>
          </div>
        </div>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
              Mes contenus
            </h2>
            <Link
              href="/jessica-contentin/ressources"
              className="hidden text-sm font-medium transition-colors hover:opacity-80 sm:inline-flex sm:items-center sm:gap-1"
              style={{ color: terracotta }}
            >
              Explorer le catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {purchases.length === 0 ? (
            <div
              className="rounded-2xl border px-8 py-14 text-center"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <Package className="mx-auto mb-4 h-12 w-12 text-neutral-300" />
              <p className="text-lg font-medium" style={{ color: textColor }}>
                Aucun contenu pour le moment
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Explorez les ressources pour découvrir nos contenus.
              </p>
              <Link href="/jessica-contentin/ressources">
                <Button
                  className="mt-6 rounded-full px-8 py-6 text-white hover:opacity-95"
                  style={{ backgroundColor: terracotta }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = terracottaHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = terracotta;
                  }}
                >
                  Voir les ressources
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {purchases.map((purchase) => (
                <article
                  key={purchase.id}
                  className="group overflow-hidden rounded-2xl border transition-shadow hover:shadow-lg"
                  style={{ backgroundColor: bgColor, borderColor }}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    {purchase.catalog_item.thumbnail_url || purchase.catalog_item.hero_image_url ? (
                      <Image
                        src={purchase.catalog_item.thumbnail_url || purchase.catalog_item.hero_image_url || ""}
                        alt={purchase.catalog_item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: `${terracotta}15`, color: terracotta }}
                      >
                        {getItemIcon(purchase.catalog_item.item_type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span
                      className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase text-white"
                      style={{ backgroundColor: terracotta }}
                    >
                      {purchase.catalog_item.item_type === "module"
                        ? "Formation"
                        : purchase.catalog_item.item_type === "ressource"
                          ? "Ressource"
                          : "Test"}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-base font-semibold" style={{ color: textColor }}>
                      {purchase.catalog_item.title}
                    </h3>
                    <p className="mt-2 text-xs text-neutral-500">
                      Accès obtenu{" "}
                      {formatDistanceToNow(new Date(purchase.granted_at), { addSuffix: true, locale: fr })}
                    </p>
                    {purchase.price_paid > 0 && (
                      <p className="mt-1 text-sm font-semibold" style={{ color: terracotta }}>
                        {purchase.price_paid.toFixed(2)} €
                      </p>
                    )}
                    <div className="mt-4">
                      {purchase.catalog_item.item_type === "module" ? (
                        <a href={getItemUrl(purchase.catalog_item)}>
                          <Button
                            className="w-full rounded-full text-white"
                            style={{ backgroundColor: terracotta }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = terracottaHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = terracotta;
                            }}
                          >
                            Accéder
                          </Button>
                        </a>
                      ) : (
                        <Link href={getItemUrl(purchase.catalog_item)}>
                          <Button
                            className="w-full rounded-full text-white"
                            style={{ backgroundColor: terracotta }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = terracottaHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = terracotta;
                            }}
                          >
                            Accéder
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-semibold" style={{ color: textColor }}>
            Mon profil
          </h2>
          <ProfileSection userId={userId} />
        </section>
      </div>
    </div>
  );
}
