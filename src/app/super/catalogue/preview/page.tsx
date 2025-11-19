import { CatalogViewAppleTV } from "@/components/catalogue/catalog-view-apple-tv";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminCatalogPreviewPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Récupérer le branding du Super Admin connecté
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/dashboard");
  }
  const { data: { user } } = await supabase.auth.getUser();
  
  let branding = null;
  if (user?.id) {
    branding = await getSuperAdminBranding(user.id);
  }

  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: branding?.background_color || '#FFFFFF' }}
      data-super-admin-id={user?.id}
    >
      <BrandingProvider initialBranding={branding}>
        <CatalogViewAppleTV />
      </BrandingProvider>
    </div>
  );
}

