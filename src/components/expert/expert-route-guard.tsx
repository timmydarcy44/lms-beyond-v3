"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { isExpertLockedRoute } from "@/lib/expert/expert-access";

export function ExpertRouteGuard({ children }: { children: React.ReactNode }) {
  const { isApproved } = useExpertAccess();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isApproved && isExpertLockedRoute(pathname)) {
      router.replace("/dashboard/expert");
    }
  }, [isApproved, pathname, router]);

  if (!isApproved && isExpertLockedRoute(pathname)) {
    return null;
  }

  return <>{children}</>;
}
