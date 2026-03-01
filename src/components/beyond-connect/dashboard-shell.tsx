"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, Sparkles, Users } from "lucide-react";

type DashboardShellProps = {
  breadcrumbs: string[];
  children: ReactNode;
};

export function DashboardShell({ breadcrumbs, children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-black">
      <div className="flex min-h-screen">
        <aside
          className={`fixed left-0 top-0 flex h-full flex-col bg-[#0B1120] py-8 text-white transition-all duration-300 ${
            sidebarCollapsed ? "w-20 px-3" : "w-64 px-6"
          }`}
        >
          <div>
            <div className="text-lg font-bold tracking-tight">BEYOND CONNECT</div>
            <p className="mt-2 text-xs tracking-tight text-white/50">Entreprise</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 p-1 text-white/50 hover:text-white"
            aria-label="Réduire la sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
          <nav className="mt-10 space-y-8 text-sm tracking-tight text-white/70">
            <Link href="/dashboard/entreprise" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Tableau de bord"}
            </Link>
            <Link href="/dashboard/entreprise/matchs" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Sparkles className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Matchs"}
            </Link>
            <Link href="/dashboard/entreprise/talents" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Users className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Talents"}
            </Link>
            <Link href="/dashboard/entreprise/offres" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Briefcase className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Offres"}
            </Link>
            <Link href="/dashboard/entreprise/entreprise" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <Users className="h-4 w-4 text-white" />
              {!sidebarCollapsed && "Entreprise"}
            </Link>
          </nav>
          <div className="mt-auto pt-6">
            <Link
              href="/dashboard/entreprise/badges/delivrer"
              className={`block w-full rounded-full border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold tracking-tight text-white ${
                sidebarCollapsed ? "text-xs" : ""
              }`}
            >
              {sidebarCollapsed ? "Badges" : "Certifier vos talents"}
            </Link>
            <Link
              href="/logout"
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium tracking-tight text-white/80 hover:text-white ${
                sidebarCollapsed ? "text-xs" : ""
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && "Déconnexion"}
            </Link>
          </div>
        </aside>

        <main
          className={`relative flex-1 overflow-y-auto px-6 py-10 transition-all duration-300 ${
            sidebarCollapsed ? "ml-20" : "ml-64"
          }`}
        >
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                {breadcrumbs.join(" > ")}
              </p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
