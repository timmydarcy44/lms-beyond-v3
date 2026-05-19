"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { cn } from "@/lib/utils";

import { useOptionalEdgeOnlineHrefPrefix } from "./edge-online-href-context";

/** Ordre : Formations en premier, puis Parcours, Profil, etc. */
const NAV_ITEMS = [
  { href: "/formations", label: "Formations" },
  { href: "/parcours", label: "Parcours" },
  { href: "/profil", label: "Profil" },
  { href: "/progression", label: "Progression" },
  { href: "/badges", label: "Badges" },
  { href: "/communaute", label: "Communauté" },
] as const;

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  return pathname.replace(/^\/edgeonline(?=\/|$)/, "") || "/";
}

function isNavActive(href: string, pathname: string | null): boolean {
  const p = normalizePath(pathname);
  if (href === "/") return p === "/" || p === "";
  return p === href || p.startsWith(`${href}/`);
}

/**
 * Menu type Netflix : fixé en overlay sur le hero, fond transparent (léger dégradé pour lisibilité).
 */
export function EdgeOnlineTopNav() {
  const pathname = usePathname();
  const prefix = useOptionalEdgeOnlineHrefPrefix();

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] bg-gradient-to-b from-black/80 via-black/35 to-transparent pb-10 pt-[max(0.65rem,env(safe-area-inset-top))]"
      aria-label="Navigation"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-[1920px] justify-center px-3 sm:px-5">
        <nav
          className="flex max-w-full items-center justify-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 md:gap-3 [&::-webkit-scrollbar]:hidden"
          aria-label="Navigation principale"
        >
          {NAV_ITEMS.map((it) => {
            const active = isNavActive(it.href, pathname);
            return (
              <Link
                key={it.href}
                href={edgeOnlinePublicHref(it.href, prefix)}
                className={cn(
                  "shrink-0 rounded-md px-2 py-2 text-[13px] font-medium tracking-wide transition sm:px-3 sm:text-sm",
                  "drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]",
                  active ? "text-white" : "text-white/80 hover:text-white",
                )}
              >
                <span className="relative inline-block pb-1">
                  {it.label}
                  {active ? (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-red-600 shadow-[0_0_14px_rgba(220,38,38,0.55)]"
                      aria-hidden
                    />
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
