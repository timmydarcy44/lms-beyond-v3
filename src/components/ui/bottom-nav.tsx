"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, TrendingUp, Newspaper, Gift, Home, FileText, LineChart, Ticket } from "lucide-react";

type NavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
};

const clubNav: NavItem[] = [
  { href: "/dashboard/club", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/club/partenaires", icon: Users, label: "Partenaires" },
  { href: "/dashboard/club/tunnel", icon: TrendingUp, label: "Prospection" },
  { href: "/dashboard/club/news", icon: Newspaper, label: "News" },
  { href: "/dashboard/club/offres", icon: Gift, label: "Offres" },
];

const partnerNav: NavItem[] = [
  { href: "/dashboard/partenaire", icon: Home, label: "Dashboard" },
  { href: "/dashboard/partenaire/contrat", icon: FileText, label: "Contrat" },
  { href: "/dashboard/partenaire/roi", icon: LineChart, label: "ROI" },
  { href: "/dashboard/partenaire/news", icon: Newspaper, label: "News" },
  { href: "/dashboard/partenaire/avantages", icon: Ticket, label: "Avantages" },
];

interface BottomNavProps {
  variant?: "club" | "partenaire";
  activeColor?: string;
}

export default function BottomNav({ variant = "club", activeColor = "#C8102E" }: BottomNavProps) {
  const pathname = usePathname();
  const items = variant === "partenaire" ? partnerNav : clubNav;

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-[#0d1b2e]/95 px-2 backdrop-blur-xl lg:hidden">
      {items.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all ${
              active ? "font-medium" : "text-white/40 hover:text-white/70"
            }`}
            style={active ? { color: activeColor } : undefined}
          >
            <Icon className="h-5 w-5" style={active ? { color: activeColor } : undefined} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
