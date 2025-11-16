"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Command Center", icon: LayoutDashboard, href: "/super" },
  { label: "Organizations", icon: Building2, href: "/super/organisations" },
  { label: "Create Org", icon: Building2, href: "/super/organisations/new" },
  { label: "Users", icon: Users, href: "/super/utilisateurs" },
  { label: "Create User", icon: UserPlus, href: "/super/utilisateurs/new" },
  { label: "Analytics", icon: BarChart3, href: "/super/statistiques" },
  { label: "System Config", icon: Settings, href: "/super/parametres" },
];

export function SuperAdminSidebarFuturistic() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-cyan-500/20 bg-gradient-to-b from-[#001122] via-[#000a1a] to-[#000000] text-white transition-all duration-300",
        "backdrop-blur-xl",
        open ? "w-[300px]" : "w-[88px]",
      )}
      style={{
        boxShadow: "0 0 60px rgba(0, 255, 255, 0.1), inset -1px 0 0 rgba(0, 255, 255, 0.1)",
      }}
    >
      {/* Header avec effet néon */}
      <div className="relative flex items-center justify-between border-b border-cyan-500/20 px-4 py-5">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 transition hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
          aria-label={open ? "Fermer" : "Ouvrir"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {open ? (
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <Shield className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-400 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider text-cyan-300 uppercase">
                Super Admin
              </span>
              <span className="text-[9px] text-cyan-400/70 uppercase tracking-[0.4em] font-mono">
                System Control
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10">
            <Shield className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
          </div>
        )}
      </div>

      {/* Navigation avec effet hologramme */}
      <nav className="mt-4 space-y-1 px-3 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300",
                "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-cyan-500/10 before:to-transparent before:opacity-0 before:transition-opacity",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 text-cyan-300 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] before:opacity-100"
                  : "text-cyan-200/60 hover:text-cyan-300 hover:bg-cyan-500/10 hover:border hover:border-cyan-500/20 hover:before:opacity-100",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-all",
                  isActive
                    ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]"
                    : "text-cyan-400/50 group-hover:text-cyan-400",
                )}
              />
              {open && (
                <span className="relative z-10 flex-1 font-mono text-xs tracking-wider">
                  {item.label}
                </span>
              )}
              {isActive && open && (
                <div className="absolute right-2 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.8)] animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer avec stats */}
      <div className={cn("mt-auto border-t border-cyan-500/20 px-4 py-4 relative", open ? "" : "px-2")}>
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent" />
        {open ? (
          <div className="relative z-10 rounded-lg border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-[0.3em] font-mono">
                Full Access
              </p>
            </div>
            <p className="text-[10px] text-cyan-400/60 font-mono">
              All systems operational
            </p>
            <div className="mt-2 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-cyan-500/30">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex justify-center">
            <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}

