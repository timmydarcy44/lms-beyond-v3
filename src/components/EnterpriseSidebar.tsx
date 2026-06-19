"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useOptionalEnterpriseOverviewContext } from "@/components/enterprise/enterprise-overview-provider";
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

type ViewerState = {
  prenom: string | null;
  nom: string | null;
  email: string | null;
};

let viewerInflight: Promise<ViewerState | null> | null = null;

/** Purge le cache sidebar (ex. après correction profil RH en base). */
export function invalidateEnterpriseViewerCache() {
  viewerInflight = null;
}

function viewerInitials(prenom: string | null, nom: string | null, email: string | null) {
  const a = (prenom ?? "").trim().slice(0, 1).toUpperCase();
  const b = (nom ?? "").trim().slice(0, 1).toUpperCase();
  if (a || b) return `${a}${b}`.trim();
  return (email ?? "?").slice(0, 2).toUpperCase();
}

async function fetchViewer(): Promise<ViewerState | null> {
  if (viewerInflight) return viewerInflight;
  viewerInflight = fetch("/api/dashboard/entreprise/viewer", { credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as ViewerState;
    })
    .finally(() => {
      viewerInflight = null;
    });
  return viewerInflight;
}

export default function EnterpriseSidebar() {
  const pathname = usePathname();
  const overviewCtx = useOptionalEnterpriseOverviewContext();
  const overviewData = overviewCtx?.data;
  const [viewer, setViewer] = useState<ViewerState>({ prenom: null, nom: null, email: null });

  useEffect(() => {
    invalidateEnterpriseViewerCache();
    if (overviewData?.viewer) {
      setViewer({
        prenom: overviewData.viewer.prenom,
        nom: overviewData.viewer.nom,
        email: overviewData.viewer.email,
      });
      return;
    }
    void fetchViewer().then((v) => {
      if (v) setViewer(v);
    });
  }, [overviewData?.viewer]);

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
              key={item.label}
              href={item.href}
              prefetch
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-violet-600/20 text-violet-200"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-200">
            <Zap size={14} />
            Beyond IA
            <span className="rounded bg-violet-500/30 px-1.5 py-0.5 text-[10px] uppercase">Beta</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            Assistant RH intégré — posez vos questions depuis l&apos;icône en bas à droite.
          </p>
        </div>
      </div>
    </aside>
  );
}
