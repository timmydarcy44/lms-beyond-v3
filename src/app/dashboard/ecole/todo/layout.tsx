"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Building2,
  CheckSquare,
  ChevronsLeft,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

type TodoLayoutProps = {
  children: React.ReactNode;
};

export default function TodoLayout({ children }: TodoLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(true);

  const navItems = [
    { label: "Tableau de bord", href: "/dashboard/ecole", icon: LayoutDashboard },
    { label: "Mes apprenants", href: "/dashboard/ecole/apprenants", icon: Users },
    { label: "Mes classes", href: "/dashboard/ecole/classes", icon: GraduationCap },
    { label: "Offres", href: "/dashboard/ecole/offres", icon: Briefcase },
    { label: "Prospection", href: "/dashboard/ecole/prospection", icon: GitBranch },
    { label: "Ma todo", href: "/dashboard/ecole/todo", icon: CheckSquare },
    { label: "Qualiopi", href: "/dashboard/ecole/qualiopi", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen w-full bg-[#121212] text-white">
      <div className="flex min-h-screen">
        <aside
          className={`fixed left-0 top-0 flex h-full flex-col bg-[#121212] px-4 py-6 text-[#F5F2E8] transition-all ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          <div className="flex items-center justify-between">
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
          <nav className="mt-8 space-y-2 text-sm">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard/ecole" ? pathname === item.href : pathname.startsWith(item.href);
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
                  {!isCollapsed ? <span>{item.label}</span> : null}
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
                    pathname.startsWith("/dashboard/ecole/entreprises") ? "bg-[#007AFF]" : "bg-transparent"
                  }`}
                />
                <Building2
                  className={`h-4 w-4 ${
                    pathname.startsWith("/dashboard/ecole/entreprises") ? "text-[#007AFF]" : "text-white/40"
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
          <div className="mt-4">
            <svg aria-hidden="true" className="absolute h-0 w-0">
              <defs>
                <linearGradient id="handicapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>
            <Link
              href="/dashboard/ecole/handicap"
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold"
            >
              <ShieldCheck className="h-4 w-4" style={{ stroke: "url(#handicapGradient)" }} />
              {!isCollapsed ? (
                <span className="bg-gradient-to-r from-[#064e3b] to-[#22c55e] bg-clip-text text-transparent">
                  Handicap
                </span>
              ) : null}
            </Link>
          </div>
          <div className="mt-auto">
            <Link
              href="/logout"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4 text-white/40" />
              {!isCollapsed ? <span>Déconnexion</span> : null}
            </Link>
          </div>
        </aside>
        <main className={`flex-1 bg-[#121212] ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="mx-auto w-full max-w-none p-0 -m-4 md:-m-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
