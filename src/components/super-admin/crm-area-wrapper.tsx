"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CrmSidebar } from "@/components/super-admin/crm-sidebar";
import { AiAssistantProvider } from "@/components/crm/ai-assistant-provider";
import { AiAssistant } from "@/components/crm/ai-assistant";

function isCrmPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/super/utilisateurs") ||
    pathname.startsWith("/super/crm") ||
    pathname.startsWith("/super/organisations")
  );
}

export function CrmAreaWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!isCrmPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <AiAssistantProvider>
      <div className="flex w-full flex-col lg:flex-row">
        <Suspense fallback={<aside className="w-full shrink-0 border-b border-gray-200 bg-gray-50 lg:w-56 lg:border-b-0 lg:border-r" />}>
          <CrmSidebar />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <AiAssistant />
    </AiAssistantProvider>
  );
}
