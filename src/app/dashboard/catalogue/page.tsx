import { CatalogViewAppleTV } from "@/components/catalogue/catalog-view-apple-tv";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoSchoolPage() {
  let branding = null;
  
  try {
    // Récupérer le branding pour le catalogue
    const supabase = await getServerClient();
    
    if (supabase) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && user) {
          try {
            // Pour les apprenants B2C, trouver leur Super Admin
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, org_id")
              .eq("id", user.id)
              .maybeSingle();

            if (!profile?.org_id && profile?.role === "learner") {
              try {
                const { data: access } = await supabase
                  .from("catalog_access")
                  .select("catalog_item_id, catalog_items!inner(creator_id)")
                  .eq("user_id", user.id)
                  .limit(1)
                  .maybeSingle();
                
                if (access && (access as any).catalog_items?.creator_id) {
                  try {
                    branding = await getSuperAdminBranding((access as any).catalog_items.creator_id);
                  } catch (brandingErr) {
                    console.warn("[catalogue/page] Failed to get branding:", brandingErr);
                  }
                }
              } catch (accessErr) {
                console.warn("[catalogue/page] Failed to get catalog access:", accessErr);
              }
            }
          } catch (profileErr) {
            console.warn("[catalogue/page] Failed to get profile:", profileErr);
          }
        }
      } catch (authErr) {
        console.warn("[catalogue/page] Failed to get user:", authErr);
      }
    } else {
      console.warn("[catalogue/page] Supabase client unavailable - page will still render");
    }
  } catch (error) {
    // Log l'erreur mais continue quand même - la page doit toujours s'afficher
    console.error("[catalogue/page] Error during initialization:", error);
  }

  // Interface style Apple TV/Netflix avec navigation horizontale en haut
  // La page fonctionne toujours, même sans branding (utilisera les valeurs par défaut)
  return (
    <BrandingProvider initialBranding={branding}>
      <CatalogViewAppleTV />
    </BrandingProvider>
  );
}

