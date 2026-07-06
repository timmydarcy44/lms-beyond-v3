import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import "@/styles/edge-connect.css";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import { ApprenantConnectShell } from "@/components/apprenant/apprenant-connect-shell";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { getSession } from "@/lib/auth/session";

function Shell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ApprenantConnectShell variant="edge">{children}</ApprenantConnectShell>
    </Suspense>
  );
}

export default async function AccompagnementLayout({ children }: { children: ReactNode }) {
  await headers();

  const session = await getSession();
  if (session?.role === "demo") {
    return <Shell>{children}</Shell>;
  }

  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  if (isUniversalAdminRole(profile?.role)) {
    return <Shell>{children}</Shell>;
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <Shell>{children}</Shell>;
}
