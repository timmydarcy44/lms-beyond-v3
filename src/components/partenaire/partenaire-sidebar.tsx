import Link from "next/link";
import {
  Home,
  FileText,
  LineChart,
  Newspaper,
  Ticket,
  Users2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ClubInfo = {
  name: string;
  initials: string;
  logoUrl?: string;
};

type PartnerInfo = {
  name: string;
  initials: string;
};

type PartenaireSidebarProps = {
  club: ClubInfo;
  partner: PartnerInfo;
  activeItem?: string;
  onClose?: () => void;
};

const navItems = [
  { label: "Tableau de bord", href: "/dashboard/partenaire", icon: Home },
  { label: "Mon contrat", href: "/dashboard/partenaire/contrat", icon: FileText },
  { label: "Mon ROI", href: "/dashboard/partenaire/roi", icon: LineChart },
  { label: "Actualités club", href: "/dashboard/partenaire/news", icon: Newspaper },
  { label: "Mes avantages", href: "/dashboard/partenaire/avantages", icon: Ticket },
  { label: "Annuaire partenaires", href: "/dashboard/partenaire/annuaire", icon: Users2 },
];

export function PartenaireSidebar({ club, partner, activeItem, onClose }: PartenaireSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] border-r border-white/10 bg-[#0d1b2e]">
      <div className="flex h-full flex-col px-4 py-6 text-white">
        <div className="flex items-center gap-3">
          {club.logoUrl ? (
            <img src={club.logoUrl} alt={club.name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
              {club.initials}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-white">{club.name}</div>
            <div className="text-xs text-white/50">Espace Partenaire</div>
          </div>
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
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              {partner.initials}
            </div>
            <div className="text-sm text-white">{partner.name}</div>
          </div>
          <button
            onClick={onClose}
            className="mt-3 flex items-center gap-2 text-xs text-white/50 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </div>
    </aside>
  );
}
