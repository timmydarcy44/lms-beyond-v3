import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import "@/styles/edge-connect.css";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import { ApprenantConnectShell } from "@/components/apprenant/apprenant-connect-shell";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { getSession } from "@/lib/auth/session";

export default async function ApprenantSuiteLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.role === "demo") {
    return <ApprenantConnectShell>{children}</ApprenantConnectShell>;
  }
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  if (isUniversalAdminRole(profile?.role)) {
    return <ApprenantConnectShell>{children}</ApprenantConnectShell>;
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <ApprenantConnectShell>{children}</ApprenantConnectShell>;
}

