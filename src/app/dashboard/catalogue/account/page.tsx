import { CatalogTopNavClient } from "@/components/catalogue/catalog-top-nav-client";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CatalogAccountContent } from "@/components/catalogue/catalog-account-content";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoSchoolAccountPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?redirect=/dashboard/catalogue/account");
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/catalogue/account");
  }

  // Récupérer le branding pour le catalogue
  let branding = null;
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

  return (
    <BrandingProvider initialBranding={branding}>
      <div className="min-h-screen" style={{ backgroundColor: branding?.background_color || '#F5F0E8' }}>
        <CatalogTopNavClient />
        <CatalogAccountContent userId={user.id} />
      </div>
    </BrandingProvider>
  );
}



