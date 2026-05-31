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
      <div className="flex w-full">
        <Suspense fallback={<aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50" />}>
          <CrmSidebar />
        </Suspense>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <AiAssistant />
    </AiAssistantProvider>
  );
}
