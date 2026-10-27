"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, MessageCircle, Search, X } from "lucide-react";

import { FormateurAppSwitcher } from "@/components/formateur/formateur-app-switcher";
import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import {
  FORMATEUR_APP_BY_ID,
  resolveFormateurAppFromPathname,
  setStoredFormateurAppId,
  type FormateurAppId,
} from "@/lib/formateur/expert-apps";

function isFormationWorkspace(pathname: string | null) {
  if (!pathname) return false;
  return /\/dashboard\/formateur\/formations\/(?:new(?:\/|$)|[^/]+\/preview(?:\/|$))/.test(pathname);
}

export function FormateurConnectShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeAppId, setActiveAppId] = useState<FormateurAppId | "">("");
  const workspace = isFormationWorkspace(pathname);
  const appItems = activeAppId ? FORMATEUR_APP_BY_ID[activeAppId].navItems : null;

  useEffect(() => {
    const fromPath = resolveFormateurAppFromPathname(pathname);
    setActiveAppId(fromPath ?? "");
    if (fromPath) setStoredFormateurAppId(fromPath);
  }, [pathname]);

  const handleAppChange = useCallback(
    (id: FormateurAppId) => {
      setActiveAppId(id);
      setStoredFormateurAppId(id);
      const href = FORMATEUR_APP_BY_ID[id]?.homeHref;
      if (href) router.push(href);
      setMobileOpen(false);
    },
    [router],
  );

  return (
    <div className="expert-revolut">
      <div className="relative z-10 flex h-screen gap-4 overflow-hidden p-4 max-lg:p-0">
        {workspace ? null : (
          <div className="hidden h-full shrink-0 lg:block">
            <FormateurSidebar
              collapsed={collapsed}
              onToggleCollapse={() => setCollapsed((value) => !value)}
              items={appItems}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {workspace ? null : (
            <header className="mb-4 flex items-center gap-3 px-4 lg:mb-6 lg:px-0">
              <button
                type="button"
                className="expert-icon-btn inline-flex lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard/formateur" className="shrink-0" aria-label="Byound">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_byound_blanc_sans_fond.png"
                  alt="Byound"
                  className="h-8 w-auto"
                />
              </Link>
              <label className="expert-search hidden min-w-0 flex-1 items-center gap-2 px-4 py-2.5 sm:flex">
                <Search className="h-4 w-4 shrink-0 text-[var(--expert-muted)]" />
                <input
                  type="search"
                  placeholder="Rechercher un cours, une classe, un apprenant…"
                  className="w-full bg-transparent text-[14px] text-[var(--expert-text)] outline-none placeholder:text-[var(--expert-muted)]"
                />
              </label>
              <div className="ml-auto flex items-center gap-2">
                <FormateurAppSwitcher activeAppId={activeAppId} onAppChange={handleAppChange} />
                <button type="button" className="expert-icon-btn relative inline-flex" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                  <span className="expert-dot absolute right-2.5 top-2.5 !h-2 !w-2" />
                </button>
                <Link
                  href="/dashboard/student/community"
                  className="expert-icon-btn inline-flex"
                  aria-label="Messages"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            </header>
          )}

          <main className={workspace ? "h-full overflow-y-auto" : "min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 lg:px-0"}>
            {children}
          </main>
        </div>
      </div>

      {mobileOpen && !workspace ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Fermer"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 flex w-[min(100%,320px)] flex-col p-4"
            onClick={(event) => {
              if (event.target instanceof Element && event.target.closest("a")) setMobileOpen(false);
            }}
          >
            <div className="mb-3 flex justify-end">
              <button type="button" className="expert-icon-btn inline-flex" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu">
                <X className="h-4 w-4" />
              </button>
            </div>
            <FormateurSidebar items={appItems} layout="sheet" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
