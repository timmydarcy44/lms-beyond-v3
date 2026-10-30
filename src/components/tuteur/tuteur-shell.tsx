"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Manrope } from "next/font/google";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  BookOpen,
  MessageCircle,
  Menu,
  X,
  ListChecks,
  Library,
} from "lucide-react";

import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"] });

type Props = {
  children: ReactNode;
  tutorName: string;
  navBadges?: { missions?: number; evaluations?: number; livrets?: number; messages?: number; todo?: number };
};

type NavItem = { label: string; href: string; icon: LucideIcon; badge?: number };

function buildNavItems(badges?: { missions?: number; evaluations?: number; livrets?: number; messages?: number }): NavItem[] {
  return [
    { label: "Accueil", href: "/dashboard/tuteur", icon: LayoutDashboard },
    { label: "Mes alternants", href: "/dashboard/tuteur/alternants", icon: Users },
    { label: "Missions", href: "/dashboard/tuteur/missions", icon: ListChecks, badge: badges?.missions },
    { label: "Évaluations", href: "/dashboard/tuteur/evaluations", icon: ClipboardList, badge: badges?.evaluations },
    { label: "Livrets", href: "/dashboard/tuteur/livrets", icon: BookOpen, badge: badges?.livrets },
    { label: "Calendrier", href: "/dashboard/tuteur/calendrier", icon: Calendar },
    { label: "Messagerie", href: "/dashboard/tuteur/messagerie", icon: MessageCircle, badge: badges?.messages },
    { label: "Ressources", href: "/dashboard/tuteur/ressources", icon: Library },
  ];
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || (item.href !== "/dashboard/tuteur" && pathname?.startsWith(`${item.href}/`));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9A5C]",
        active ? "bg-[#1E2130] font-extrabold text-white" : "text-[#B5BAC6] hover:bg-[#12141A]",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[var(--tutor-accent)] px-2 py-0.5 text-[11px] font-bold text-[var(--tutor-on-accent)]">{item.badge}</span>
      ) : null}
    </Link>
  );
}

export function TuteurShell({ children, tutorName, navBadges }: Props) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(navBadges);
  const [name, setName] = useState(tutorName);
  const pathname = usePathname();
  useEffect(() => {
    void fetch("/api/tuteur/nav-counts", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        setCounts(json);
        if (json.tutorName) setName(String(json.tutorName));
      })
      .catch(() => undefined);
  }, [pathname]);
  const items = buildNavItems(counts);
  return (
    <div className={cn(manrope.className, "min-h-screen bg-[#07080B] text-[#F4F5F7]")}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[240px] shrink-0 flex-col border-r border-[#262A36] bg-[#07080B] px-3 py-6 lg:flex">
          <p className="px-4 pb-6 text-sm font-semibold text-[#DADDE4]">Byound School · Espace tuteur</p>
          <nav className="flex flex-1 flex-col gap-1">
            {items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
          <p className="truncate px-4 pt-4 text-sm font-semibold text-[#DADDE4]">{name}</p>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between gap-3 border-b border-[#262A36] px-4 py-3 lg:hidden">
            <p className="text-sm font-semibold">Byound School</p>
            <button type="button" className="rounded-full bg-[#1E2130] p-2" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
              <Menu className="h-5 w-5" />
            </button>
          </header>
          <div className="mx-auto w-full min-w-0 max-w-[1040px] px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-[280px] bg-[#07080B] p-4" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="mb-4 rounded-full bg-[#1E2130] p-2" onClick={() => setOpen(false)} aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
            <nav className="flex flex-col gap-1">
              {items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
