import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import "@/styles/edge-connect.css";
import "@/styles/jessica-connect.css";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import { ApprenantConnectShell } from "@/components/apprenant/apprenant-connect-shell";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { getSession } from "@/lib/auth/session";
import type { ApprenantConnectVariant } from "@/lib/apprenant/connect-theme";
import {
  isJessicaLmsHostname,
  isJessicaStudioProfile,
} from "@/lib/jessica-contentin/studio-config";

function resolveApprenantVariant(
  hostname: string | null,
  profile: { email?: string | null; school_id?: string | null; company_id?: string | null } | null,
): ApprenantConnectVariant {
  if (isJessicaLmsHostname(hostname)) return "jessica";
  if (isJessicaStudioProfile(profile)) return "jessica";
  return "edge";
}

function ApprenantShellWithSuspense({
  variant,
  children,
}: {
  variant: ApprenantConnectVariant;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ApprenantConnectShell variant={variant}>{children}</ApprenantConnectShell>
    </Suspense>
  );
}

export default async function ApprenantSuiteLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const hostname = headerStore.get("host");

  const session = await getSession();
  if (session?.role === "demo") {
    const variant = resolveApprenantVariant(hostname, null);
    return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
  }

  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.needs_password_setup === true) {
    const role = String(profile?.role ?? "").toLowerCase();
    const roleType = String(profile?.role_type ?? "").toLowerCase();
    const isEntreprise =
      role === "entreprise" ||
      roleType === "entreprise" ||
      roleType === "admin_hr" ||
      String(meta.account_type ?? "") === "entreprise" ||
      String(meta.signup_source ?? "") === "edge_entreprises";
    const next = encodeURIComponent(isEntreprise ? "/dashboard/entreprise" : "/dashboard/apprenant");
    const flow = isEntreprise ? "entreprise" : "particulier";
    redirect(`/auth/set-password?next=${next}&flow=${flow}`);
  }

  const variant = resolveApprenantVariant(hostname, profile);

  if (isUniversalAdminRole(profile?.role)) {
    return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
}
