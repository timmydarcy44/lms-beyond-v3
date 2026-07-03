"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Euro,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Settings,
  User2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/expert", icon: LayoutDashboard, lockedWhenRestricted: false },
  { label: "Mon profil", href: "/dashboard/expert/profile", icon: User2, lockedWhenRestricted: false },
  { label: "Mes missions", href: "/dashboard/expert/interventions", icon: ClipboardList, lockedWhenRestricted: true },
  { label: "Mon agenda", href: "/dashboard/expert/agenda", icon: CalendarDays, lockedWhenRestricted: true },
  { label: "Mes revenus", href: "/dashboard/expert/revenus", icon: Euro, lockedWhenRestricted: true },
  { label: "Documents", href: "/dashboard/expert/documents", icon: FileText, lockedWhenRestricted: false },
  { label: "EDGE Certified", href: "/dashboard/expert/certification", icon: Award, lockedWhenRestricted: false },
  { label: "EDGE Online", href: "/dashboard/expert/edge-online", icon: GraduationCap, lockedWhenRestricted: false },
  { label: "Notifications", href: "/dashboard/expert/notifications", icon: Bell, lockedWhenRestricted: false },
  { label: "Paramètres", href: "/dashboard/expert/settings", icon: Settings, lockedWhenRestricted: false },
  { label: "Support", href: "/dashboard/expert/support", icon: HelpCircle, lockedWhenRestricted: false },
] as const;

type Props = {
  restricted?: boolean;
};

export default function SidebarExpert({ restricted = false }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[260px] flex-col border-r border-white/10 bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.2),transparent_62%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-5 pt-8">
        <div className="text-lg font-semibold tracking-tight text-white">EDGE</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
          {restricted ? "Espace restreint" : "Réseau formateurs"}
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-3 py-5" aria-label="Navigation expert">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isLocked = restricted && item.lockedWhenRestricted;
            const active =
              item.href === "/dashboard/expert"
                ? pathname === "/dashboard/expert"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            if (isLocked) {
              return (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/25"
                  title="Disponible après validation de votre profil"
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {item.label}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                  "text-white/55 hover:bg-white/5 hover:text-white",
                  active && "border border-[#635BFF]/25 bg-[#635BFF]/12 text-white",
                )}
              >
                <Icon size={16} strokeWidth={1.5} className={cn("text-white/40", active && "text-[#a8a3ff]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative shrink-0 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Espace</p>
          <p className="mt-1 text-sm font-medium text-white">Formateur EDGE</p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            {restricted
              ? "Votre dossier est en cours de validation."
              : "Pilotez missions, revenus et visibilité."}
          </p>
          <Link
            href="/dashboard/expert/support"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#a8a3ff] hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Centre d'aide
          </Link>
        </div>
      </div>
    </aside>
  );
}
