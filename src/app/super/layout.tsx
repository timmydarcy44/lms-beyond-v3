import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SuperAdminEntrepriseNotice } from "@/components/super/super-admin-entreprise-notice";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { ContentinSuperShell } from "@/components/jessica-contentin/contentin-super-shell";
import { ControlShell } from "@/components/control/control-shell";
import { getControlNavCounts } from "@/lib/control/nav-counts";
import { BrandingProvider } from "@/components/super-admin/branding-provider";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";
import { getServerClient } from "@/lib/supabase/server";
import { CfaEntryNotifier } from "@/components/super-admin/cfa-entry-notifier";
import { CONTENTIN_EMAIL } from "@/lib/utils/contentin-theme";
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

  const { data: { user } } = await supabase.auth.getUser();
  const isContentin = user?.email === CONTENTIN_EMAIL;

  const displayName =
    (typeof authData?.user?.user_metadata?.full_name === "string" && authData.user.user_metadata.full_name) ||
    (typeof authData?.user?.user_metadata?.name === "string" && authData.user.user_metadata.name) ||
    "";
  // Jessica peut ouvrir Byound Control : charger les compteurs réels.
  const counts = await getControlNavCounts();

  const notice = (
    <Suspense fallback={null}>
      <SuperAdminEntrepriseNotice />
    </Suspense>
  );

  return (
    <BrandingProvider initialBranding={branding}>
      <div className={isContentin ? "min-h-screen bg-white text-black" : "super-theme min-h-screen"}>
        {!isContentin && <CfaEntryNotifier />}
        {isContentin ? (
          <ContentinSuperShell
            counts={counts}
            userName={displayName}
            userEmail={user?.email ?? ""}
            notice={notice}
          >
            {children}
          </ContentinSuperShell>
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
