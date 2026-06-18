"use client";

import { usePathname } from "next/navigation";
import { EdgeFooter } from "@/components/edge-site/edge-footer";
import { Navbar } from "@/components/edge-site/navbar";
import { OrientationTopBanner } from "@/components/edge-site/orientation-top-banner";

export function EdgeLabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimalShell =
    pathname?.includes("/votre-orientation") ||
    pathname?.includes("/orientation") ||
    pathname?.includes("/postuler") ||
    pathname?.includes("/entreprises/connexion");

  if (isMinimalShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-edge-black antialiased">
      <OrientationTopBanner />
      <Navbar />
      <main>{children}</main>
      <EdgeFooter />
    </div>
  );
}
