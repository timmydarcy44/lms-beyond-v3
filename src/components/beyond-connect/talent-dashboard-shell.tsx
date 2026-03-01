"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Briefcase, Sparkles, User } from "lucide-react";

type TalentDashboardShellProps = {
  children: ReactNode;
};

export function TalentDashboardShell({ children }: TalentDashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-black">
      <div className="flex min-h-screen">
        <aside
          className={`fixed left-0 top-0 flex h-full flex-col bg-[#0B1120] py-8 text-white transition-all duration-300 ${
            collapsed ? "w-20 px-3" : "w-64 px-6"
          }`}
        >
          <div>
            <div className="text-lg font-bold tracking-tight">BEYOND CONNECT</div>
            <p className="mt-2 text-xs tracking-tight text-white/50">Talent</p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 p-1 text-white/50 hover:text-white"
            aria-label="Réduire la sidebar"
          >
            <span className="text-xs">{collapsed ? ">" : "<"}</span>
          </button>
          <nav className="mt-10 space-y-8 text-sm tracking-tight text-white/70">
            <Link href="/dashboard/talent" className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4 text-white" />
              {!collapsed && "Tableau de bord"}
            </Link>
            <Link
              href="/dashboard/talent/offres"
              className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10"
            >
              <Briefcase className="h-4 w-4 text-white" />
              {!collapsed && "Offres"}
            </Link>
            <Link
              href="/dashboard/talent/matchs"
              className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-white" />
              {!collapsed && "Mes Matchs"}
            </Link>
            <Link
              href="/dashboard/talent/profil"
              className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-white/10"
            >
              <User className="h-4 w-4 text-white" />
              {!collapsed && "Mon Profil"}
            </Link>
          </nav>
          <div className="mt-auto pt-6">
            <Link
              href="/logout"
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium tracking-tight text-white/80 hover:text-white ${
                collapsed ? "text-xs" : ""
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Déconnexion"}
            </Link>
          </div>
        </aside>

        <main
          className={`relative flex-1 overflow-y-auto px-6 py-10 transition-all duration-300 ${
            collapsed ? "ml-20" : "ml-64"
          }`}
        >
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
