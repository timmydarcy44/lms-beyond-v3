"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radar,
  Briefcase,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/entreprise", icon: LayoutDashboard },
  { label: "Salariés", href: "/dashboard/entreprise/salaries", icon: Users },
  { label: "Talent Radar", href: "/dashboard/entreprise/talent-radar", icon: Radar },
  { label: "Mes Offres", href: "/dashboard/entreprise/offres", icon: Briefcase },
  { label: "Messages", href: "/dashboard/entreprise/messages", icon: MessageCircle },
  { label: "Paramètres", href: "/dashboard/entreprise/parametres", icon: Settings },
];

export default function EnterpriseSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] border-r border-blue-500/20 bg-[#050505]/80 backdrop-blur-xl">
      <div className="border-b border-blue-500/10 px-6 pb-6 pt-8">
        <div className="text-[18px] font-extrabold tracking-[-0.5px] text-white">Beyond</div>
        <div className="mt-1 text-[11px] font-medium uppercase tracking-[1.5px] text-blue-200/70">
          Enterprise
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-[12px] px-3 py-2 text-[13.5px] font-semibold transition ${
                active
                  ? "bg-blue-500/20 text-white shadow-[0_0_16px_rgba(0,123,255,0.35)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
