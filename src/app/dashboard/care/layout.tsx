import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PaywallCare } from "@/components/paywalls/paywall-care";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export default async function CareSuiteLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=care");
  }

  if (profile?.access_care === false) {
    return <PaywallCare />;
  }

  return <>{children}</>;
}

