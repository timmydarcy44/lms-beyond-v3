"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";
import {
  Award,
  Bell,
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
  { label: "Tableau de bord", href: "/dashboard/expert", icon: LayoutDashboard, lockedWhenRestricted: false, external: false },
  { label: "Mon profil", href: "/dashboard/expert/profile", icon: User2, lockedWhenRestricted: false, external: false },
  { label: "Mes missions", href: "/dashboard/expert/interventions", icon: ClipboardList, lockedWhenRestricted: true, external: false },
  { label: "Mon agenda", href: "/dashboard/expert/agenda", icon: CalendarDays, lockedWhenRestricted: true, external: false },
  { label: "Mes revenus", href: "/dashboard/expert/revenus", icon: Euro, lockedWhenRestricted: true, external: false },
  { label: "Documents", href: "/dashboard/expert/documents", icon: FileText, lockedWhenRestricted: false, external: false },
  { label: "Byound Certified", href: "/dashboard/expert/certification", icon: Award, lockedWhenRestricted: false, external: false },
  { label: "Byound Online", href: EDGE_ONLINE_EXTERNAL_URL, icon: GraduationCap, lockedWhenRestricted: false, external: true },
  { label: "Notifications", href: "/dashboard/expert/notifications", icon: Bell, lockedWhenRestricted: false, external: false },
  { label: "Paramètres", href: "/dashboard/expert/settings", icon: Settings, lockedWhenRestricted: false, external: false },
] as const;

type Props = {
  restricted?: boolean;
};

export default function SidebarExpert({ restricted = false }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col gap-3 overflow-y-auto p-4">
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1230]/90 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="px-3 pb-4 pt-3">
          <div className="text-xl font-semibold tracking-tight text-white">Byound</div>
          <div className="mt-0.5 text-xs font-medium text-white/45">Espace expert</div>
        </div>

        <nav aria-label="Navigation expert" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isLocked = restricted && item.lockedWhenRestricted;
            const active = item.external
              ? false
              : item.href === "/dashboard/expert"
                ? pathname === "/dashboard/expert"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;
            const linkClass = cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition",
              active
                ? "bg-white text-[#070b1f] shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
                : "text-white/70 hover:bg-white/[0.06] hover:text-white",
            );

            if (isLocked) {
              return (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] font-medium text-white/30"
                  title="Disponible après validation de votre profil"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {item.label}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </div>
              );
            }

            if (item.external) {
              return (
                <a key={item.label} href={item.href} className={linkClass}>
                  <Icon size={16} strokeWidth={1.75} />
                  {item.label}
                </a>
              );
            }

            return (
              <Link key={item.label} href={item.href} className={linkClass}>
                <Icon size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1230]/90 p-4 backdrop-blur-xl">
        <p className="text-[11px] font-medium text-white/45">Formateur Byound</p>
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          {restricted ? "Votre dossier est en cours de validation." : "Pilotez missions, revenus et visibilité."}
        </p>
        <Link
          href="/dashboard/expert/support"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:underline"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Centre d&apos;aide
        </Link>
      </div>
    </aside>
  );
}
