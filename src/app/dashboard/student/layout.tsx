import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { PaywallLMS } from "@/components/paywalls/paywall-lms";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export default async function StudentSuiteLayout({ children }: { children: ReactNode }) {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) {
    redirect("/login?from=lms");
  }

  if (profile?.access_lms === false) {
    return <PaywallLMS />;
  }

  return <>{children}</>;
}

