"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Brain, Home, Sparkles, Users } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/salarie", icon: Home },
  { label: "Mes Formations", href: "/dashboard/salarie/formations", icon: BookOpen },
  { label: "Mes Coachings", href: "/dashboard/salarie/coachings", icon: Users },
  { label: "Test IDMC", href: "/dashboard/salarie/test-idmc", icon: Brain },
  { label: "Test Soft Skills", href: "/dashboard/salarie/test-soft-skills", icon: Sparkles },
] as const;

export default function SidebarSalarie() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 h-full w-[260px] border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),rgba(99,102,241,0.14),rgba(2,6,23,0)_62%)] blur-2xl" />
        <div className="absolute -bottom-28 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),rgba(2,6,23,0)_66%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-slate-400">Salarie</div>
      </div>

      <nav className="relative flex flex-col gap-1 px-3 py-6" aria-label="Navigation salarié">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard/salarie" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13.5px] font-semibold transition",
                "text-slate-400 hover:bg-white/5 hover:text-white",
                active &&
                  "border border-emerald-400/15 bg-emerald-400/10 text-white shadow-[0_0_22px_rgba(16,185,129,0.16)]",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className={cn("text-slate-500", active && "text-emerald-100")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

