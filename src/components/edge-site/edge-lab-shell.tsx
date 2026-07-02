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

/**
 * Chemins (URL navigateur) qui conservent l'ancien shell blanc.
 * Sur edgebs.fr, le middleware réécrit vers /edge-lab/* mais usePathname() reste
 * souvent sans le préfixe /edge-lab (ex. /, /tarifs, /apprenants).
 */
const LEGACY_SHELL_PATH_PREFIXES = [
  "/edge-lab/parcours",
  "/parcours",
  "/edge-lab/entreprises",
  "/entreprises",
  "/edge-lab/edge-online",
  "/edge-online",
];

function usesLegacyShell(pathname: string): boolean {
  return LEGACY_SHELL_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function EdgeLabShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  if (MINIMAL_SHELL_PATHS.some((p) => pathname.includes(p))) {
    return <>{children}</>;
  }

  // Premium par défaut dans le layout edge-lab : les pages embarquent EdgePremiumShell.
  if (!usesLegacyShell(pathname)) {
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
