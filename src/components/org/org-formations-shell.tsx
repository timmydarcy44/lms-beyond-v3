"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, FolderPlus, Library, Route, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrgFormationsTab = "catalogue" | "creer" | "gerer" | "parcours";

const TABS: Array<{ id: OrgFormationsTab; label: string; segment: string; icon: typeof BookOpen }> = [
  { id: "catalogue", label: "Catalogue EDGE", segment: "catalogue", icon: Library },
  { id: "creer", label: "Créer une formation", segment: "creer", icon: FolderPlus },
  { id: "gerer", label: "Gérer mes formations", segment: "gerer", icon: Settings2 },
  { id: "parcours", label: "Créer un parcours", segment: "parcours", icon: Route },
];

export function OrgFormationsShell({
  basePath,
  title = "Formations",
  lead,
  variant = "light",
  hideTabs = false,
  children,
}: {
  basePath: string;
  title?: string;
  lead?: string;
  variant?: "light" | "dark";
  /** Quand la nav est dans la sidebar (entreprise), masquer les pills. */
  hideTabs?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isDark = variant === "dark";

  return (
    <div className={cn("w-full", isDark ? "text-white" : "text-[#1D1D1F]")}>
      <header className="mb-6 space-y-2">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.2em]",
            isDark ? "text-white/45" : "text-black/40",
          )}
        >
          Formations
        </p>
        <h1 className={cn("text-3xl font-extrabold tracking-tight", isDark ? "text-white" : "text-[#1D1D1F]")}>
          {title}
        </h1>
        {lead ? (
          <p className={cn("max-w-3xl text-sm", isDark ? "text-white/55" : "text-black/55")}>{lead}</p>
        ) : null}
      </header>

      {!hideTabs ? (
        <nav
          className={cn(
            "mb-8 flex flex-wrap gap-2 border-b pb-3",
            isDark ? "border-white/10" : "border-black/10",
          )}
          aria-label="Sous-onglets formations"
        >
          {TABS.map((tab) => {
            const href = `${basePath}/${tab.segment}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  active
                    ? isDark
                      ? "bg-white text-black"
                      : "bg-[#1D1D1F] text-white"
                    : isDark
                      ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      : "bg-black/[0.04] text-black/60 hover:bg-black/[0.08] hover:text-black",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {children}
    </div>
  );
}

export function OrgFormationsEmpty({
  title,
  description,
  variant = "light",
}: {
  title: string;
  description?: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div
      className={cn(
        "rounded-2xl border px-6 py-10 text-center",
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white",
      )}
    >
      <BookOpen className={cn("mx-auto h-8 w-8", isDark ? "text-white/40" : "text-black/30")} />
      <p className={cn("mt-3 text-base font-semibold", isDark ? "text-white" : "text-[#1D1D1F]")}>{title}</p>
      {description ? (
        <p className={cn("mx-auto mt-2 max-w-md text-sm", isDark ? "text-white/50" : "text-black/50")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
