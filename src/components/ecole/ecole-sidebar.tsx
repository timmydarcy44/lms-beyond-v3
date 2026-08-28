"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsLeft, Euro, LogOut } from "lucide-react";
import { HandicapSidebarNav } from "@/components/beyond-connect/handicap-sidebar-nav";
import { OrgSidebarBrand } from "@/components/enterprise/org-sidebar-brand";
import {
  ECOLE_PRICING_NAV,
  ECOLE_SIDEBAR_NAV,
  isEcoleGroupActive,
  isEcoleLinkActive,
  type EcoleNavItem,
} from "@/lib/ecole/ecole-sidebar-nav";

type EcoleSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseControl?: boolean;
  className?: string;
};

function getDefaultOpenGroups(pathname: string): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  for (const item of ECOLE_SIDEBAR_NAV) {
    if (item.type === "group") {
      open[item.label] = isEcoleGroupActive(pathname, item.children);
    }
  }
  return open;
}

export function EcoleSidebar({
  collapsed = false,
  onToggleCollapse,
  showCollapseControl = true,
  className = "",
}: EcoleSidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    getDefaultOpenGroups(pathname),
  );
  const [orgBranding, setOrgBranding] = useState<{ logoUrl: string | null; name: string | null }>({
    logoUrl: null,
    name: null,
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const item of ECOLE_SIDEBAR_NAV) {
        if (item.type === "group" && isEcoleGroupActive(pathname, item.children)) {
          next[item.label] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/organizations/nav-branding", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const b = json?.branding;
        setOrgBranding({
          logoUrl: typeof b?.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null,
          name: typeof b?.name === "string" && b.name.trim() ? b.name.trim() : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(() => ECOLE_SIDEBAR_NAV, []);

  const renderLink = (item: Extract<EcoleNavItem, { type: "link" }>) => {
    const isActive = isEcoleLinkActive(pathname, item.href, item.activePathPrefix);
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
        <Icon className={`h-4 w-4 ${isActive ? "text-[#007AFF]" : "text-white/40"}`} />
        {!collapsed ? (
          <span className={isActive ? "text-white drop-shadow-[0_0_6px_rgba(197,160,89,0.3)]" : ""}>
            {item.label}
          </span>
        ) : null}
      </Link>
    );
  };

  const renderGroup = (item: Extract<EcoleNavItem, { type: "group" }>) => {
    const isActive = isEcoleGroupActive(pathname, item.children);
    const isOpen = openGroups[item.label] ?? false;
    const Icon = item.icon;

    return (
      <div key={item.label} className="space-y-1">
        <button
          type="button"
          onClick={() =>
            setOpenGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))
          }
          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 transition ${
            isActive
              ? "bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
          aria-expanded={isOpen}
        >
          <span
            className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
              isActive ? "bg-[#007AFF]" : "bg-transparent"
            }`}
          />
          <Icon className={`h-4 w-4 ${isActive ? "text-[#007AFF]" : "text-white/40"}`} />
          {!collapsed ? <span className="flex-1 text-left">{item.label}</span> : null}
          {!collapsed ? (
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          ) : null}
        </button>
        {!collapsed && isOpen ? (
          <div className="space-y-1 pl-8">
            {item.children.map((child) => {
              const childActive = isEcoleLinkActive(pathname, child.href, undefined, child.exact);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                    childActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  const pricingActive = isEcoleLinkActive(pathname, ECOLE_PRICING_NAV.href);

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen min-h-0 flex-col bg-[#121212] px-4 py-6 text-[#F5F2E8] transition-all ${
        collapsed ? "w-20" : "w-64"
      } ${className}`}
    >
      <div
        className={`flex shrink-0 ${
          collapsed ? "flex-col items-center gap-3" : "items-start justify-between gap-2"
        }`}
      >
        <div className={collapsed ? "w-full" : "min-w-0 flex-1"}>
          <OrgSidebarBrand
            logoUrl={orgBranding.logoUrl}
            name={orgBranding.name || "École"}
            compact={collapsed}
          />
        </div>
        {showCollapseControl && onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded-full border border-white/10 p-2 text-white/60 hover:text-white"
            aria-label="Replier la sidebar"
          >
            <ChevronsLeft
              className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-sm">
          {navItems.map((item) =>
            item.type === "link" ? renderLink(item) : renderGroup(item),
          )}
        </nav>
        <div className="shrink-0 pt-2">
          <HandicapSidebarNav collapsed={collapsed} labelVariant="handicap" />
        </div>
      </div>

      <div className="shrink-0 space-y-1 border-t border-white/10 pt-3">
        <Link
          href={ECOLE_PRICING_NAV.href}
          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
            pricingActive
              ? "bg-white/10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] backdrop-blur"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span
            className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full ${
              pricingActive ? "bg-[#007AFF]" : "bg-transparent"
            }`}
          />
          <Euro className={`h-4 w-4 ${pricingActive ? "text-[#007AFF]" : "text-white/40"}`} />
          {!collapsed ? <span>{ECOLE_PRICING_NAV.label}</span> : null}
        </Link>
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4 text-white/40" />
          {!collapsed ? <span>Déconnexion</span> : null}
        </Link>
      </div>
    </aside>
  );
}
