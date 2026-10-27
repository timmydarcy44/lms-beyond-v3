import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type ExpertShopFormation = {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  href: string | null;
  coverUrl: string | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  slug: string | null;
  price: number | null;
  builder_snapshot?: {
    general?: {
      title?: string;
      subtitle?: string;
      price?: number;
      publisher?: string;
      visible_surfaces?: string[];
      cover_image?: string;
      heroImage?: string;
    };
  } | null;
  cover_image?: string | null;
};

function formatPrice(value: number | null) {
  if (value == null || value <= 0) return "Prix sur demande";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export async function loadExpertShopFormations(): Promise<ExpertShopFormation[]> {
  const db = await getServiceRoleClientOrFallback();
  if (!db) return [];
  const { data } = await db
    .from("courses")
    .select("id, title, slug, price, status, cover_image, builder_snapshot")
    .eq("status", "published")
    .limit(400);
  const courses: ExpertShopFormation[] = [];
  for (const row of (data ?? []) as CourseRow[]) {
    const general = row.builder_snapshot?.general;
    if (general?.publisher !== "byound") continue;
    if (!general.visible_surfaces?.includes("expert")) continue;
    const amount = typeof general.price === "number" ? general.price : row.price;
    courses.push({
      id: row.id,
      title: general.title?.trim() || row.title || "Formation",
      subtitle: general.subtitle?.trim() || "",
      price: formatPrice(typeof amount === "number" ? amount : null),
      href: row.slug ? `/catalog/formations/${row.slug}?from=expert` : null,
      coverUrl: general.cover_image || general.heroImage || row.cover_image || null,
    });
  }
  return courses;
}
