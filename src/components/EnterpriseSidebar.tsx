"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  LayoutDashboard,
  BarChart3,
  Radar,
  Briefcase,
  MessageCircle,
  Settings,
  Users,
  Zap,
  Brain,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/entreprise", icon: LayoutDashboard },
  { label: "Salariés", href: "/dashboard/entreprise/salaries", icon: Users },
  { label: "Marketplace BCT", href: "/dashboard/entreprise/marketplace", icon: Brain },
  { label: "Équipe Insight", href: "/dashboard/entreprise/equipe-radar", icon: BarChart3 },
  { label: "Équipe Insight", href: "/dashboard/entreprise/talent-radar", icon: Radar },
  { label: "Mes Offres", href: "/dashboard/entreprise/offres", icon: Briefcase },
  { label: "Messages", href: "/dashboard/entreprise/messages", icon: MessageCircle },
  { label: "Paramètres", href: "/dashboard/entreprise/parametres", icon: Settings },
];

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRole() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return;
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (!cancelled) setRole(((data as any)?.role as string | undefined) ?? null);
      } catch {
        if (!cancelled) setRole(null);
      }
    }
    loadRole();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 h-full w-[260px] border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl">
      {/* Halo cinematic (bas gauche) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),rgba(99,102,241,0.18),rgba(2,6,23,0)_62%)] blur-2xl" />
        <div className="absolute -bottom-28 -left-24 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.22),rgba(2,6,23,0)_66%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-slate-400">
          Enterprise {role ? `· ${role}` : ""}
        </div>
      </div>

      <nav className="relative flex flex-col gap-1 px-3 py-6" aria-label="Navigation entreprise">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard/entreprise"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13.5px] font-semibold transition",
                "text-slate-400 hover:bg-white/5 hover:text-white",
                active && "border border-white/10 bg-white/10 text-white shadow-[0_0_22px_rgba(168,85,247,0.22)]",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className={cn("text-slate-500", active && "text-white")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto p-4">
        <Link
          href="/dashboard/entreprise/equipe-radar"
          className={cn(
            "group block w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition",
            "hover:border-white/15 hover:bg-white/[0.06]",
            (pathname === "/dashboard/entreprise/equipe-radar" ||
              pathname.startsWith("/dashboard/entreprise/radar-equipe")) &&
              "border-violet-400/30 bg-violet-500/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_22px_rgba(99,102,241,0.35)]">
              <Zap size={18} strokeWidth={1.5} className="text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-white">Beyond IA</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80">
                  BETA
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Insights, signaux faibles, actions prioritaires.
              </div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
