"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { LayoutDashboard, Users, Building2, Euro } from "lucide-react";
import { EcoleSidebar } from "@/components/ecole/ecole-sidebar";
import { EcoleFloatingAssistant } from "@/components/beyond-connect/ecole-floating-assistant";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isTodo = pathname.startsWith("/dashboard/ecole/todo");

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
            />
          </div>
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
    </div>
  );
}
