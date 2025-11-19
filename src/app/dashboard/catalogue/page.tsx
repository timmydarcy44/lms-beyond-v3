import { CatalogViewAppleTV } from "@/components/catalogue/catalog-view-apple-tv";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoSchoolPage() {
  // Récupérer le branding pour le catalogue
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?redirect=/dashboard/catalogue");
  }
  const { data: { user } } = await supabase.auth.getUser();
  
  let branding = null;
  if (user) {
    // Pour les apprenants B2C, trouver leur Super Admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id && profile?.role === "learner") {
      const { data: access } = await supabase
        .from("catalog_access")
        .select("catalog_item_id, catalog_items!inner(creator_id)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      
      if (access && (access as any).catalog_items?.creator_id) {
        branding = await getSuperAdminBranding((access as any).catalog_items.creator_id);
      }
    }
  }

  // Interface style Apple TV/Netflix avec navigation horizontale en haut
  return (
    <BrandingProvider initialBranding={branding}>
      <CatalogViewAppleTV />
    </BrandingProvider>
  );
}

