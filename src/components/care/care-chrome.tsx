"use client";

import { usePathname } from "next/navigation";
import { CareFooter } from "@/components/care/care-footer";
import { CareHeader } from "@/components/care/care-header";
import { CareAudienceProvider, CareHostProvider } from "@/components/care/care-host";

export function CareChrome({ children, publicHost = false }: { children: React.ReactNode; publicHost?: boolean }) {
  const pathname = usePathname();
  const tunnel = /\/reserver(\/|$)/.test(pathname) || /\/reservation(\/|$)/.test(pathname);
  const maintenance = /\/maintenance(\/|$)/.test(pathname);
  const bare = tunnel || maintenance;
  return (
    <CareHostProvider publicHost={publicHost}>
      <CareAudienceProvider>
        {bare ? null : <CareHeader />}
        {children}
        {bare ? null : <CareFooter />}
      </CareAudienceProvider>
    </CareHostProvider>
  );
}
