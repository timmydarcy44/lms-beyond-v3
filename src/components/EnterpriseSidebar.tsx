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
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/entreprise", icon: LayoutDashboard },
  { label: "Salariés", href: "/dashboard/entreprise/salaries", icon: Users },
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
        const authEmail = user.email ?? null;
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const { data } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        const row = data as {
          first_name?: string | null;
          last_name?: string | null;
          email?: string | null;
        } | null;
        setViewer({
          prenom:
            row?.first_name ??
            (typeof meta.first_name === "string" ? meta.first_name : null) ??
            (typeof meta.prenom === "string" ? meta.prenom : null),
          nom:
            row?.last_name ??
            (typeof meta.last_name === "string" ? meta.last_name : null) ??
            (typeof meta.nom === "string" ? meta.nom : null),
          email: authEmail ?? row?.email ?? null,
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
    return full || viewer.email || "—";
  }, [viewer]);

  const initials = viewerInitials(viewer.prenom, viewer.nom, viewer.email);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-[rgba(124,58,237,0.15)]"
      style={{ background: "linear-gradient(180deg, #0f0e1a 0%, #1a1535 100%)" }}
    >
      <div className="border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-lg font-extrabold tracking-tight text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white/40">
          Enterprise · Admin
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/40">{viewer.email ?? ""}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Navigation entreprise">
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
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition",
                active
                  ? "border border-violet-500/30 bg-violet-600/20 font-semibold text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <Icon size={16} strokeWidth={1.5} className={active ? "text-violet-300" : "text-white/40"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <Link
          href="/dashboard/entreprise/equipe-insight"
          className={cn(
            "group block w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition",
            "hover:border-violet-500/30 hover:bg-white/[0.06]",
            (pathname === "/dashboard/entreprise/equipe-insight" ||
              pathname.startsWith("/dashboard/entreprise/equipe-radar")) &&
              "border-violet-500/40 bg-violet-600/10",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 shadow-[0_0_22px_rgba(124,58,237,0.35)]">
              <span className="absolute inset-0 animate-ping rounded-xl bg-violet-600/30" aria-hidden />
              <Zap size={18} strokeWidth={1.5} className="relative text-white" aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-semibold text-white">Beyond IA</span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80">
                  BETA
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-white/40">Insights et actions prioritaires</div>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
