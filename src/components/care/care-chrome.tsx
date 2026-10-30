"use client";

import { usePathname } from "next/navigation";
import { CareFooter } from "@/components/care/care-footer";
import { CareHeader } from "@/components/care/care-header";
import { CareAudienceProvider, CareHostProvider } from "@/components/care/care-host";

export function CareChrome({ children, publicHost = false }: { children: React.ReactNode; publicHost?: boolean }) {
  const pathname = usePathname();
  const tunnel = /\/reserver(\/|$)/.test(pathname) || /\/reservation(\/|$)/.test(pathname);
  return (
    <CareHostProvider publicHost={publicHost}>
      <CareAudienceProvider>
        {tunnel ? null : <CareHeader />}
        {children}
        {tunnel ? null : <CareFooter />}
      </CareAudienceProvider>
    </CareHostProvider>
  );
}
