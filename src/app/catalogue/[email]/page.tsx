import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CatalogViewWithParams } from "@/components/catalogue/catalog-view-with-params";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PublicCatalogPageProps {
  params: Promise<{ email: string }>;
}

export default async function PublicCatalogPage({ params }: PublicCatalogPageProps) {
  const { email } = await params;
  
  // Décoder l'email (remplacer @ par %40 dans l'URL)
  const decodedEmail = decodeURIComponent(email.replace('%40', '@'));
  
  // Récupérer le Super Admin par email
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", decodedEmail)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  // Vérifier que c'est un Super Admin
  const { data: superAdmin } = await supabase
    .from("super_admins")
    .select("user_id")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!superAdmin) {
    notFound();
  }

  // Récupérer le branding
  const branding = await getSuperAdminBranding(profile.id);

  return (
    <div 
      className="min-h-screen" 
      style={{ backgroundColor: branding?.background_color || '#F5F0E8' }}
    >
      <BrandingProvider initialBranding={branding}>
        <CatalogViewWithParams superAdminEmail={decodedEmail} superAdminId={profile.id} />
      </BrandingProvider>
    </div>
  );
}

