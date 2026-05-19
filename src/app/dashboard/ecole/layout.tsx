"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  CheckSquare,
  ChevronsLeft,
  ClipboardCheck,
  Euro,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MonitorPlay,
  ShieldCheck,
  Users,
} from "lucide-react";
import { HandicapSidebarNav } from "@/components/beyond-connect/handicap-sidebar-nav";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { EcoleFloatingAssistant } from "@/components/beyond-connect/ecole-floating-assistant";

type SchoolLayoutProps = {
  children: React.ReactNode;
};

type EcoleNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  activePathPrefix?: string;
};

function isEcoleNavActive(pathname: string, item: EcoleNavItem): boolean {
  if (item.activePathPrefix) {
    const p = item.activePathPrefix;
    return pathname === p || pathname.startsWith(`${p}/`);
  }
  if (item.href === "/dashboard/ecole") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function SchoolDashboardLayout({ children }: SchoolLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(true);
  const isTodo = pathname.startsWith("/dashboard/ecole/todo");

  const pricingNavItem: EcoleNavItem = {
    label: "Tarifs",
    href: "/dashboard/ecole/pricing",
    icon: Euro,
  };

  const mainNavItems: EcoleNavItem[] = [
    { label: "Tableau de bord", href: "/dashboard/ecole", icon: LayoutDashboard },
    { label: "Mes apprenants", href: "/dashboard/ecole/apprenants", icon: Users },
    { label: "Mes classes", href: "/dashboard/ecole/classes", icon: GraduationCap },
    { label: "Offres", href: "/dashboard/ecole/offres", icon: Briefcase },
    {
      label: "Suivi formations",
      href: "/dashboard/ecole/formations-suivi",
      icon: ClipboardCheck,
    },
    { label: "Prospection", href: "/dashboard/ecole/prospection", icon: GitBranch },
    { label: "Ma todo", href: "/dashboard/ecole/todo", icon: CheckSquare },
    { label: "Qualiopi", href: "/dashboard/ecole/qualiopi", icon: ShieldCheck },
    {
      label: "EDGE Online",
      href: EDGE_ONLINE_APP_SURFACE_PATH,
      icon: MonitorPlay,
      activePathPrefix: EDGE_ONLINE_APP_SURFACE_PATH,
    },
  ];

  const tabItems = [...mainNavItems.slice(0, 4), pricingNavItem];

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]"
      style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="flex min-h-screen">
        {!isTodo ? (
          <aside
            className={`fixed left-0 top-0 z-30 hidden h-screen min-h-0 flex-col bg-[#121212] px-4 py-6 text-[#F5F2E8] transition-all md:flex ${
              isCollapsed ? "w-20" : "w-64"
            }`}
          >
          <div className="flex shrink-0 items-center justify-between">
            {!isCollapsed ? (
              <div>
                <div className="text-lg font-semibold tracking-tight">BEYOND CONNECT</div>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/50">École</p>
              </div>
            ) : (
              <div className="text-xs font-semibold tracking-tight">BC</div>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="rounded-full border border-white/10 p-2 text-white/60 hover:text-white"
              aria-label="Replier la sidebar"
            >
              <ChevronsLeft className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <nav className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-sm">
            {mainNavItems.map((item) => {
              const isActive = isEcoleNavActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    isActive
                      ? "bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
                      isActive ? "bg-[#007AFF]" : "bg-transparent"
                    }`}
                  />
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-[#007AFF]" : "text-white/40"
                    }`}
                  />
                  {!isCollapsed ? (
                    <span
                      className={`${
                        isActive ? "text-white drop-shadow-[0_0_6px_rgba(197,160,89,0.3)]" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCompaniesOpen((prev) => !prev)}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 transition ${
                  pathname.startsWith("/dashboard/ecole/entreprises")
                    ? "bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
                    pathname.startsWith("/dashboard/ecole/entreprises")
                      ? "bg-[#007AFF]"
                      : "bg-transparent"
                  }`}
                />
                <Building2
                  className={`h-4 w-4 ${
                    pathname.startsWith("/dashboard/ecole/entreprises")
                      ? "text-[#007AFF]"
                      : "text-white/40"
                  }`}
                />
                {!isCollapsed ? <span>Entreprises</span> : null}
                {!isCollapsed ? (
                  <span className="ml-auto text-xs text-white/40">{isCompaniesOpen ? "–" : "+"}</span>
                ) : null}
              </button>
              {!isCollapsed && isCompaniesOpen ? (
                <div className="mt-2 space-y-1 pl-8">
                  <Link
                    href="/dashboard/ecole/entreprises"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                      pathname.startsWith("/dashboard/ecole/entreprises")
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    Clients
                  </Link>
                  <Link
                    href="/dashboard/ecole/entreprises/prospects"
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                      pathname.startsWith("/dashboard/ecole/entreprises/prospects")
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    Prospects
                  </Link>
                </div>
              ) : null}
            </div>
          </nav>
          <div className="shrink-0 pt-2">
            <HandicapSidebarNav collapsed={isCollapsed} labelVariant="handicap" />
          </div>
          </div>
          <div className="shrink-0 space-y-1 border-t border-white/10 pt-3">
            <Link
              href={pricingNavItem.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                isEcoleNavActive(pathname, pricingNavItem)
                  ? "bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
                  isEcoleNavActive(pathname, pricingNavItem) ? "bg-[#007AFF]" : "bg-transparent"
                }`}
              />
              <Euro
                className={`h-4 w-4 ${
                  isEcoleNavActive(pathname, pricingNavItem) ? "text-[#007AFF]" : "text-white/40"
                }`}
              />
              {!isCollapsed ? <span>{pricingNavItem.label}</span> : null}
            </Link>
            <Link
              href="/logout"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-white/40" />
              {!isCollapsed ? <span>Déconnexion</span> : null}
            </Link>
          </div>
        </aside>
        ) : null}
        <main
          className={`flex-1 min-h-screen ${isTodo ? "" : "bg-[#F5F5F7] text-[#1D1D1F]"} ${
            isTodo ? "" : isCollapsed ? "md:ml-20" : "md:ml-64"
          } pb-24 md:pb-0`}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
      {!isTodo ? (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E5EA] bg-white/95 px-2 py-2 md:hidden">
          <div className="flex items-center justify-around gap-0.5">
            {tabItems.map((item) => {
              const isActive = isEcoleNavActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[9px] font-semibold leading-tight sm:text-[10px] ${
                    isActive ? "text-[#1D1D1F]" : "text-[#86868B]"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#1D1D1F]" : "text-[#86868B]"}`} />
                  <span className="line-clamp-2 text-center">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
      {!isTodo ? <EcoleFloatingAssistant /> : null}
    </div>
  );
}
