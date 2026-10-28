"use client";

import { usePathname } from "next/navigation";
import { CareFooter } from "@/components/care/care-footer";
import { CareHeader } from "@/components/care/care-header";
import { CareHostProvider } from "@/components/care/care-host";

export function CareChrome({ children, publicHost = false }: { children: React.ReactNode; publicHost?: boolean }) {
  const pathname = usePathname();
  const home = pathname === "/care";
  const tunnel = pathname.startsWith("/care/reserver") || pathname.startsWith("/care/reservation");
  return (
    <CareHostProvider publicHost={publicHost}>
      {home || tunnel ? null : <CareHeader />}
      {children}
      {tunnel ? null : <CareFooter />}
    </CareHostProvider>
  );
}
