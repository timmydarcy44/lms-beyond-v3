"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { JessicaHeader } from "@/components/jessica-contentin/jessica-header";
import { FloatingCreateButton } from "@/components/jessica-contentin/floating-create-button";
import { CrmAreaWrapper } from "@/components/super-admin/crm-area-wrapper";
import { ControlShell } from "@/components/control/control-shell";
import type { ControlNavCounts } from "@/lib/control/nav";
import { isJessicaCabinetPath } from "@/lib/utils/contentin-theme";

/**
 * Jessica : cabinet (header Jessica) sur ses routes,
 * Byound Control sur le reste de /super (CTA « Byound »).
 */
export function ContentinSuperShell({
  counts,
  userName,
  userEmail,
  notice,
  children,
}: {
  counts: ControlNavCounts;
  userName: string;
  userEmail: string;
  notice: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const cabinet = isJessicaCabinetPath(pathname);

  if (cabinet) {
    return (
      <>
        <JessicaHeader />
        <CrmAreaWrapper>
          {notice}
          {children}
        </CrmAreaWrapper>
        <FloatingCreateButton />
      </>
    );
  }

  return (
    <div className="super-theme min-h-screen">
      <Suspense fallback={null}>
        <ControlShell counts={counts} userName={userName} userEmail={userEmail}>
          {notice}
          {children}
        </ControlShell>
      </Suspense>
    </div>
  );
}
