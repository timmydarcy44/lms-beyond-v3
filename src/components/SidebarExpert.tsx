"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Award, LayoutDashboard, Settings, User2, ClipboardList } from "lucide-react";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/expert", icon: LayoutDashboard },
  { label: "Mes Missions", href: "/dashboard/expert/interventions", icon: ClipboardList },
  { label: "Mon Profil", href: "/dashboard/expert/profile", icon: User2 },
  { label: "Ma Certification", href: "/dashboard/expert/certification", icon: Award },
] as const;

export default function SidebarExpert() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 h-full w-[260px] border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl">
      {/* Halo expert (émeraude/indigo) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.28),rgba(99,102,241,0.16),rgba(2,6,23,0)_62%)] blur-2xl" />
        <div className="absolute -bottom-28 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.14),rgba(2,6,23,0)_66%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-emerald-300/80">
          Expert Ops
        </div>
      </div>

      <nav className="relative flex flex-col gap-1 px-3 py-6" aria-label="Navigation expert">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard/expert"
              ? pathname === "/dashboard/expert"
              : item.href === "/dashboard/expert/interventions"
                ? pathname === item.href || pathname.startsWith("/dashboard/expert/interventions/")
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13.5px] font-semibold transition",
                "text-slate-400 hover:bg-white/5 hover:text-white",
                active &&
                  "border border-emerald-400/15 bg-emerald-400/10 text-white shadow-[0_0_22px_rgba(16,185,129,0.20)]",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className={cn("text-slate-500", active && "text-emerald-100")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Espace</div>
              <div className="mt-1 text-sm font-extrabold text-white">Expert</div>
            </div>
            <Settings className="h-4 w-4 text-white/50" aria-hidden />
          </div>
          <div className="mt-3 text-xs text-white/55">Gestion missions, planification et certification.</div>
        </div>
      </div>
    </aside>
  );
}

