import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuperAdminEntrepriseNotice } from "@/components/super/super-admin-entreprise-notice";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminHeaderApple } from "@/components/super-admin/super-admin-header-apple";
import { JessicaHeader } from "@/components/jessica-contentin/jessica-header";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { FloatingCreateButton } from "@/components/jessica-contentin/floating-create-button";
import { SuperJarvis } from "@/components/super-admin/super-jarvis";
import { CrmAreaWrapper } from "@/components/super-admin/crm-area-wrapper";

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

  // Vérifier si c'est contentin.cabinet@gmail.com
  const { data: { user } } = await supabase.auth.getUser();
  const isContentin = user?.email === "contentin.cabinet@gmail.com";

  return (
    <BrandingProvider initialBranding={branding}>
      <div className={`min-h-screen ${isContentin ? "bg-[#F5F5DC]" : "bg-white"}`}>
        {isContentin ? <JessicaHeader /> : <SuperAdminHeaderApple />}
        <CrmAreaWrapper>
          <Suspense fallback={null}>
            <SuperAdminEntrepriseNotice />
          </Suspense>
          {children}
        </CrmAreaWrapper>
        {!isContentin && <SuperJarvis />}
        {isContentin && <FloatingCreateButton />}
      </div>
    </BrandingProvider>
  );
}
