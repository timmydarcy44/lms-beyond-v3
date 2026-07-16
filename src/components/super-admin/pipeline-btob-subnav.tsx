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
] as const;

export function PipelineBtobSubnav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  if (typeParam === "btoc") return null;
  if (!pathname?.startsWith("/super/crm/pipeline")) return null;

  return (
    <nav className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
      {TABS.map((tab) => {
        const isActive = tab.match(pathname, typeParam);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
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
