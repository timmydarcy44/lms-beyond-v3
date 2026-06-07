import type { ReactNode } from "react";
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

export default async function ApprenantSuiteLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const hostname = headerStore.get("host");

  const session = await getSession();
  if (session?.role === "demo") {
    const variant = resolveApprenantVariant(hostname, null);
    return <ApprenantConnectShell variant={variant}>{children}</ApprenantConnectShell>;
  }

  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.needs_password_setup === true) {
    redirect("/auth/set-password?next=/dashboard/apprenant");
  }

  const variant = resolveApprenantVariant(hostname, profile);

  if (isUniversalAdminRole(profile?.role)) {
    return <ApprenantConnectShell variant={variant}>{children}</ApprenantConnectShell>;
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <ApprenantConnectShell variant={variant}>{children}</ApprenantConnectShell>;
}
