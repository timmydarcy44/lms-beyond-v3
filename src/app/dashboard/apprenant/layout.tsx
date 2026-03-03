import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export default async function ApprenantSuiteLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <>{children}</>;
}

