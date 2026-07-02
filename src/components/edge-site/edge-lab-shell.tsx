"use client";

import { usePathname } from "next/navigation";
import { EdgeFooter } from "@/components/edge-site/edge-footer";
import { Navbar } from "@/components/edge-site/navbar";
import { OrientationTopBanner } from "@/components/edge-site/orientation-top-banner";

const MINIMAL_SHELL_PATHS = [
  "/votre-orientation",
  "/orientation",
  "/postuler",
  "/entreprises/connexion",
];

/** Pages EDGE Lab legacy qui gardent l'ancien shell (navbar blanche). */
const LEGACY_EDGE_LAB_SHELL_PREFIXES = [
  "/edge-lab/parcours",
  "/edge-lab/entreprises",
  "/edge-lab/edge-online",
];

function needsLegacyShell(pathname: string): boolean {
  if (!pathname.startsWith("/edge-lab")) {
    return true;
  }
  return LEGACY_EDGE_LAB_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function EdgeLabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (MINIMAL_SHELL_PATHS.some((p) => pathname.includes(p))) {
    return <>{children}</>;
  }

  // Pages premium (home, marketing) embarquent déjà EdgePremiumShell — pas de double menu.
  if (pathname.startsWith("/edge-lab") && !needsLegacyShell(pathname)) {
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
