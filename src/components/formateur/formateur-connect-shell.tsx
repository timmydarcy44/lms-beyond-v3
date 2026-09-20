"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { ConnectCockpitBackdrop } from "@/components/apprenant/connect-cockpit-backdrop";
import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { getConnectShellTheme } from "@/lib/apprenant/connect-theme";
import { FORMATEUR_NAV_ITEMS } from "@/lib/formateur/formateur-nav";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Shell Formateur = même App Shell EDGE que l'apprenant :
 * ConnectCockpitBackdrop + sidebar intégrée + main transparent.
 * Pas de container de page autour du contenu — seules les cartes ont une surface.
 */
export function FormateurConnectShell({ children }: { children: React.ReactNode }) {
  const theme = getConnectShellTheme("edge");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div data-connect-shell={theme.shellAttr} className={theme.rootClass}>
      <ConnectCockpitBackdrop />
      <div className="relative z-10 flex h-screen overflow-hidden font-['Inter',system-ui,sans-serif]">
        <div className="hidden lg:block">
          <FormateurSidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>

        <main className={theme.mainClass}>
          <div className={theme.mobileHeaderClass}>
            <button
              type="button"
              className={theme.mobileMenuBtnClass}
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className={theme.mobileTitleClass}>EDGE Expert</p>
            <div className="w-10" />
          </div>

          <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fermer"
            onClick={() => setMobileOpen(false)}
          />
          <div className={`absolute inset-y-0 left-0 flex w-[280px] flex-col ${theme.mobileSheetClass}`}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-white">Menu Expert</p>
              <button
                type="button"
                className={theme.mobileMenuBtnClass}
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {FORMATEUR_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard/formateur" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium ${
                      active ? theme.mobileNavActive : theme.mobileNavInactive
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] ${
                        active ? theme.mobileNavIconActive : theme.mobileNavIconInactive
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
