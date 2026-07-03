"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Award,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Lock,
  Settings,
  User2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard/expert", icon: LayoutDashboard, lockedWhenRestricted: false },
  { label: "Mon profil", href: "/dashboard/expert/profile", icon: User2, lockedWhenRestricted: false },
  { label: "EDGE Certified", href: "/dashboard/expert/certification", icon: Award, lockedWhenRestricted: false },
  { label: "Missions", href: "/dashboard/expert/interventions", icon: ClipboardList, lockedWhenRestricted: true },
  { label: "Documents", href: "/dashboard/expert/documents", icon: FileText, lockedWhenRestricted: false },
  { label: "Paramètres", href: "/dashboard/expert/settings", icon: Settings, lockedWhenRestricted: false },
] as const;

type Props = {
  restricted?: boolean;
};

export default function SidebarExpert({ restricted = false }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 h-full w-[260px] border-r border-white/10 bg-[#050505]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,91,255,0.2),transparent_62%)] blur-2xl" />
      </div>

      <div className="relative border-b border-white/10 px-6 pb-6 pt-8">
        <div className="text-lg font-semibold tracking-tight text-white">EDGE</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
          {restricted ? "Espace restreint" : "Réseau formateurs"}
        </div>
      </div>

      <nav className="relative flex flex-col gap-1 px-3 py-6" aria-label="Navigation expert">
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
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Espace</p>
          <p className="mt-1 text-sm font-medium text-white">Formateur EDGE</p>
          <p className="mt-2 text-xs text-white/45">
            {restricted
              ? "Complétez votre profil en attendant la validation."
              : "Missions, certification et visibilité réseau."}
          </p>
        </div>
      </div>
    </aside>
  );
}
