"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/super/crm/pipeline", label: "Pipeline", match: (path: string, type: string | null) =>
    path === "/super/crm/pipeline" && type !== "btoc" },
  { href: "/super/crm/pipeline/prescripteurs", label: "Prescripteur", match: (path: string) =>
    path.startsWith("/super/crm/pipeline/prescripteurs") },
  { href: "/super/crm/pipeline/projets", label: "Projets", match: (path: string) =>
    path.startsWith("/super/crm/pipeline/projets") },
  { href: "/super/crm/formations", label: "Formations", match: (path: string) =>
    path.startsWith("/super/crm/formations") },
  { href: "/super/crm/qualiopi", label: "Qualiopi", match: (path: string) =>
    path.startsWith("/super/crm/qualiopi") },
] as const;

export function PipelineBtobSubnav({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const dark = variant === "dark";

  if (typeParam === "btoc") return null;
  if (
    !pathname?.startsWith("/super/crm/pipeline") &&
    !pathname?.startsWith("/super/crm/qualiopi") &&
    !pathname?.startsWith("/super/crm/formations")
  ) {
    return null;
  }

  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1 rounded-xl p-1",
        dark ? "border border-white/[0.08] bg-white/[0.04]" : "border border-gray-200 bg-gray-50",
      )}
    >
      {TABS.map((tab) => {
        const isActive = tab.match(pathname, typeParam);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              dark
                ? isActive
                  ? "bg-white text-[#0b0e18] shadow-sm"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
                : isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:bg-white/70 hover:text-gray-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
