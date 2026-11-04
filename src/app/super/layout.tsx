import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuperAdminEntrepriseNotice } from "@/components/super/super-admin-entreprise-notice";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { JessicaHeader } from "@/components/jessica-contentin/jessica-header";
import { ControlShell } from "@/components/control/control-shell";
import { getControlNavCounts } from "@/lib/control/nav-counts";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { FloatingCreateButton } from "@/components/jessica-contentin/floating-create-button";
import { CrmAreaWrapper } from "@/components/super-admin/crm-area-wrapper";
import { CfaEntryNotifier } from "@/components/super-admin/cfa-entry-notifier";
import "./super-theme.css";

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

  const displayName =
    (typeof authData?.user?.user_metadata?.full_name === "string" && authData.user.user_metadata.full_name) ||
    (typeof authData?.user?.user_metadata?.name === "string" && authData.user.user_metadata.name) ||
    "";
  const counts = isContentin
    ? { pipelineLate: 0, admissionsReview: 0, expertsPending: 0, opcoToFile: 0 }
    : await getControlNavCounts();

  return (
    <BrandingProvider initialBranding={branding}>
      <div className={isContentin ? "min-h-screen bg-white text-black" : "super-theme min-h-screen"}>
        {!isContentin && <CfaEntryNotifier />}
        {isContentin ? (
          <>
            <JessicaHeader />
            <CrmAreaWrapper>
              <Suspense fallback={null}>
                <SuperAdminEntrepriseNotice />
              </Suspense>
              {children}
            </CrmAreaWrapper>
            <FloatingCreateButton />
          </>
        ) : (
          <Suspense fallback={null}>
            <ControlShell counts={counts} userName={displayName} userEmail={user?.email ?? ""}>
              <SuperAdminEntrepriseNotice />
              {children}
            </ControlShell>
          </Suspense>
        )}
      </div>
    </BrandingProvider>
  );
}
