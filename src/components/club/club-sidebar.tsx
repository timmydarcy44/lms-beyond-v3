import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Newspaper,
  Gift,
  Calendar,
  BarChart2,
  GraduationCap,
  Building2,
  Shield,
} from "lucide-react";
import type { ClubTheme } from "@/lib/club-theme";
import { cn } from "@/lib/utils";

type ClubSidebarProps = {
  activeItem?: string;
  theme: ClubTheme;
  onClose?: () => void;
};

const navItems = [
  { label: "Dashboard", href: "/dashboard/club", icon: LayoutDashboard },
  { label: "Partenaires", href: "/dashboard/club/partenaires", icon: Users },
  { label: "Prospection", href: "/dashboard/club/tunnel", icon: GitBranch },
  { label: "News Club", href: "/dashboard/club/news", icon: Newspaper },
  { label: "Offres", href: "/dashboard/club/offres", icon: Gift },
  { label: "Aides & Formation", href: "/dashboard/club/aides", icon: GraduationCap },
  { label: "Événements", href: "/dashboard/club/evenements", icon: Calendar },
  { label: "ROI & Reporting", href: "/dashboard/club/roi", icon: BarChart2 },
  {
    label: "Rapport DNCG",
    href: "/dashboard/club/dncg",
    icon: Shield,
    activeColor: "#C8102E",
  },
];

export function ClubSidebar({ activeItem, theme, onClose }: ClubSidebarProps) {
  return (
    <aside className="fixed left-4 top-4 bottom-4 z-50 w-[220px] overflow-hidden rounded-2xl border border-[#C8102E]/30 bg-[#1B2A4A] backdrop-blur-2xl">
      <div className="flex h-full flex-col px-4 py-5 text-white">
        <div className="flex flex-col items-center text-center">
          <img
            src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Beyond%20Network/Logo_SU_Dives_Cabourg_-_2024.svg"
            alt="SU Dives Cabourg"
            className="h-16 w-16 object-contain"
          />
          <div className="mt-3 text-sm font-bold text-white">{theme.nom}</div>
          <div className="text-xs text-white/50">{theme.division}</div>
        </div>

        <div className="my-5 h-px bg-white/10" />

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = activeItem === item.label;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  isActive ? "font-semibold text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: item.activeColor ?? theme.couleur_primaire,
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <a
            href="/dashboard/entreprise"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="text-xs">Former vos collaborateurs</span>
          </a>
        </div>

        <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
          <div>23 partenaires actifs</div>
          <div>87 500€ valeur totale</div>
          <div>3 renouvellements ce mois</div>
        </div>
      </div>
    </aside>
  );
}
