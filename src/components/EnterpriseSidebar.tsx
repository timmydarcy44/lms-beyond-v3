"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  LayoutDashboard,
  BarChart3,
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
  { label: "Équipe Insight", href: "/dashboard/entreprise/equipe-insight", icon: BarChart3 },
  { label: "Mes Offres", href: "/dashboard/entreprise/offres", icon: Briefcase },
  { label: "Messages", href: "/dashboard/entreprise/messages", icon: MessageCircle },
  { label: "Paramètres", href: "/dashboard/entreprise/parametres", icon: Settings },
];

function viewerInitials(prenom: string | null, nom: string | null, email: string | null) {
  const a = (prenom ?? "").trim().slice(0, 1).toUpperCase();
  const b = (nom ?? "").trim().slice(0, 1).toUpperCase();
  if (a || b) return `${a}${b}`.trim();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const supabase = useSupabase();
  const [viewer, setViewer] = useState<{ prenom: string | null; nom: string | null; email: string | null }>({
    prenom: null,
    nom: null,
    email: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadViewer() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("prenom, nom, first_name, last_name, email")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        const row = data as {
          prenom?: string | null;
          nom?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
        } | null;
        setViewer({
          prenom: row?.prenom ?? row?.first_name ?? null,
          nom: row?.nom ?? row?.last_name ?? null,
          email: row?.email ?? user.email ?? null,
        });
      } catch {
        if (!cancelled) setViewer({ prenom: null, nom: null, email: null });
      }
    }
    void loadViewer();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const displayName = useMemo(() => {
    const full = [viewer.prenom, viewer.nom].filter(Boolean).join(" ").trim();
    return full || viewer.email || "Responsable RH";
  }, [viewer]);

  const initials = viewerInitials(viewer.prenom, viewer.nom, viewer.email);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-[rgba(124,58,237,0.15)] bg-[#161428]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.28),rgba(15,14,26,0)_62%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-[#9896b8]">
          Enterprise · Admin
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-sm font-bold text-white shadow-lg shadow-purple-900/30">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-[#5d5b7a]">{viewer.email ?? ""}</p>
          </div>
        </div>
      </div>

      <nav className="relative flex flex-col gap-1 px-3 py-6" aria-label="Navigation entreprise">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard/entreprise"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13.5px] font-semibold transition",
                "text-[#9896b8] hover:bg-white/5 hover:text-white",
                active && "border border-[rgba(124,58,237,0.25)] bg-[#7c3aed]/15 text-white",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className={cn("text-[#5d5b7a]", active && "text-[#a78bfa]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto p-4">
        <Link
          href="/dashboard/entreprise/equipe-insight"
          className={cn(
            "group block w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition",
            "hover:border-[#7c3aed]/30 hover:bg-white/[0.06]",
            (pathname === "/dashboard/entreprise/equipe-insight" ||
              pathname.startsWith("/dashboard/entreprise/equipe-radar")) &&
              "border-[#7c3aed]/40 bg-[#7c3aed]/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] shadow-[0_0_22px_rgba(124,58,237,0.35)]">
              <span className="absolute inset-0 animate-ping rounded-xl bg-[#7c3aed]/30" aria-hidden />
              <Zap size={18} strokeWidth={1.5} className="relative text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-white">Beyond IA</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80">
                  BETA
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#9896b8]">Insights, signaux faibles, actions prioritaires.</div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
