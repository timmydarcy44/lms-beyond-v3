"use client";

import { usePathname } from "next/navigation";

import { getEdgeOnlineHrefPrefixFromPathname } from "@/lib/edge-online-public-path";

import { EdgeOnlineHrefPrefixProvider } from "./edge-online-href-context";
import { EdgeOnlineTopNav } from "./edge-online-top-nav";

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.replace(/^\/edgeonline(?=\/|$)/, "") || "/";
}

/**
 * Sur `/formations` en mobile, la page fournit son propre chrome type Netflix
 * (header + barre du bas) : on masque la nav supérieure globale pour éviter le doublon.
 */
export function EdgeOnlineLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefix = getEdgeOnlineHrefPrefixFromPathname(pathname);
  const norm = normalizePath(pathname);
  const isFormationsIndex = norm === "/" || norm === "/formations";

  return (
    <EdgeOnlineHrefPrefixProvider prefix={prefix}>
      <div className="relative">
        <div className={isFormationsIndex ? "hidden md:block" : ""}>
          <EdgeOnlineTopNav />
        </div>
        <main className="w-full max-w-none px-0 pb-10 pt-0">{children}</main>
      </div>
    </EdgeOnlineHrefPrefixProvider>
  );
}
