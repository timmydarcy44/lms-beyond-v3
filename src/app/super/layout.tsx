import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminHeaderApple } from "@/components/super-admin/super-admin-header-apple";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";

export default async function SuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  // Récupérer le branding côté serveur
  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }
  const { data: authData } = await supabase.auth.getUser();
  const branding = authData?.user?.id 
    ? await getSuperAdminBranding(authData.user.id)
    : null;

  return (
    <BrandingProvider initialBranding={branding}>
      <div className="min-h-screen bg-white">
        <SuperAdminHeaderApple />
        {children}
      </div>
    </BrandingProvider>
  );
}
