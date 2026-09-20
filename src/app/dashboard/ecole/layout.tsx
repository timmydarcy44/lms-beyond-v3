"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { LayoutDashboard, Users, Building2, Euro } from "lucide-react";

import { AppTransition } from "@/components/apprenant/edge-app-transition";
import { EcoleFloatingAssistant } from "@/components/beyond-connect/ecole-floating-assistant";
import { EdgeAppsLauncher } from "@/components/edge/edge-apps-launcher";
import { EcoleSidebar } from "@/components/ecole/ecole-sidebar";
import {
  ECOLE_APPS,
  ECOLE_APP_BY_ID,
  getEcoleAppLabel,
  resolveEcoleAppFromPathname,
  setStoredEcoleAppId,
  type EcoleAppId,
} from "@/lib/ecole/ecole-apps";
import { ECOLE_PRICING_NAV, isEcoleLinkActive } from "@/lib/ecole/ecole-sidebar-nav";

type SchoolLayoutProps = {
  children: React.ReactNode;
};

const MOBILE_TAB_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/ecole", icon: LayoutDashboard },
  { label: "Apprenants", href: "/dashboard/ecole/apprenants", icon: Users },
  { label: "Entreprises", href: "/dashboard/ecole/entreprises", icon: Building2 },
  { label: "Tarifs", href: ECOLE_PRICING_NAV.href, icon: Euro },
];

export default function SchoolDashboardLayout({ children }: SchoolLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeAppId, setActiveAppId] = useState<EcoleAppId>("pilotage");
  const [pendingAppId, setPendingAppId] = useState<EcoleAppId | null>(null);
  const isTodo = pathname.startsWith("/dashboard/ecole/todo");

  useEffect(() => {
    if (pendingAppId) return;
    const fromPath = resolveEcoleAppFromPathname(pathname);
    setActiveAppId(fromPath);
    setStoredEcoleAppId(fromPath);
  }, [pathname, pendingAppId]);

  const navItems = useMemo(
    () => ECOLE_APP_BY_ID[activeAppId]?.navItems ?? ECOLE_APP_BY_ID.pilotage.navItems,
    [activeAppId],
  );

  const handleAppChange = useCallback(
    (id: string) => {
      const next = id as EcoleAppId;
      setActiveAppId(next);
      setStoredEcoleAppId(next);
      setPendingAppId(next);
      const href = ECOLE_APP_BY_ID[next]?.homeHref;
      if (href) router.push(href);
    },
    [router],
  );

  const destinationReady = Boolean(
    pendingAppId && resolveEcoleAppFromPathname(pathname) === pendingAppId,
  );

  const completeAppTransition = useCallback(() => {
    if (!pendingAppId) return;
    const next = pendingAppId;
    setActiveAppId(next);
    setStoredEcoleAppId(next);
    setPendingAppId(null);
  }, [pendingAppId]);

  return (
    <div
      className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]"
      style={{ fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <div className="flex min-h-screen">
        {!isTodo ? (
          <div className="hidden md:block">
            <EcoleSidebar
              collapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
              navItems={navItems}
            />
          </div>
        ) : null}
        <main
          className={`flex-1 min-h-screen ${isTodo ? "" : "bg-transparent text-[#1D1D1F]"} ${
            isTodo ? "" : isCollapsed ? "md:ml-20" : "md:ml-64"
          } pb-24 md:pb-0`}
        >
          {!isTodo ? (
            <div className="sticky top-0 z-20 flex items-center justify-end gap-2 px-4 py-3 sm:px-6">
              <EdgeAppsLauncher
                light
                title="Applications EDGE École"
                apps={ECOLE_APPS}
                activeAppId={activeAppId}
                onAppChange={handleAppChange}
              />
            </div>
          ) : null}
          <Suspense fallback={null}>
            <div className={pendingAppId ? "invisible" : undefined} aria-hidden={pendingAppId ? true : undefined}>
              {children}
            </div>
          </Suspense>
        </main>
      </div>
      {!isTodo ? (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E5EA] bg-white/95 px-2 py-2 md:hidden">
          <div className="flex items-center justify-around gap-0.5">
            {MOBILE_TAB_ITEMS.map((item) => {
              const isActive = isEcoleLinkActive(pathname, item.href);
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
      <AppTransition
        appName={pendingAppId ? getEcoleAppLabel(pendingAppId) : ""}
        open={Boolean(pendingAppId)}
        destinationReady={destinationReady}
        onComplete={completeAppTransition}
      />
    </div>
  );
}
