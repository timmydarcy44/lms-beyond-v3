"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ListChecks,
  CheckSquare,
  MessageCircle,
  UserCircle,
  Menu,
  LifeBuoy,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Props = {
  children: ReactNode;
  tutorName: string;
  /** Compteurs dynamiques (ex. depuis /api/tuteur/workspace). */
  navBadges?: { missions?: number; todo?: number };
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

function buildNavItems(badges?: { missions?: number; todo?: number }): NavItem[] {
  const m = badges?.missions;
  const t = badges?.todo;
  return [
    { label: "Tableau de bord", href: "/dashboard/tuteur", icon: LayoutDashboard },
    { label: "Mes alternants", href: "/dashboard/tuteur/alternants", icon: Users },
    {
      label: "Missions à valider",
      href: "/dashboard/tuteur/missions",
      icon: ListChecks,
      badge: typeof m === "number" && m > 0 ? m : undefined,
    },
    { label: "Évaluations", href: "/dashboard/tuteur/formulaires", icon: ClipboardList },
    {
      label: "To-Do",
      href: "/dashboard/tuteur/todo",
      icon: CheckSquare,
      badge: typeof t === "number" && t > 0 ? t : undefined,
    },
    { label: "Messagerie", href: "/dashboard/student/community", icon: MessageCircle },
  ];
}

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-violet-500/20 to-sky-500/15 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
      <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
      {typeof item.badge === "number" ? (
        <span className="rounded-full bg-violet-500/90 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-sm">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function TuteurShell({ children, tutorName, navBadges }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = buildNavItems(navBadges);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="relative z-20 hidden w-[240px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0f] lg:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.03] via-transparent to-sky-500/[0.04] pointer-events-none" />
          <div className="relative px-5 pt-7 pb-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-300">Beyond</div>
            <div className="mt-1 text-xs font-medium text-zinc-500">Espace tuteur</div>
          </div>
          <div className="relative mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <nav className="relative mt-3 flex-1 space-y-0.5 px-3 py-4">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </nav>
          <div className="relative mt-auto space-y-1 border-t border-white/[0.06] px-3 py-5">
            <Link
              href="/dashboard/mon-compte"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
            >
              <UserCircle className="h-4 w-4" />
              <span className="truncate font-medium">{tutorName}</span>
            </Link>
            <Link
              href="/dashboard/student/community"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
            >
              <LifeBuoy className="h-4 w-4" />
              Centre d&apos;aide
            </Link>
          </div>
        </aside>

        <main className="relative min-w-0 flex-1 pb-20 lg:pb-0">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.12),transparent)]" />
          {children}
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/[0.08] bg-[#0c0c0f]/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <Link
          href="/dashboard/tuteur"
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-zinc-400"
        >
          <LayoutDashboard className="h-5 w-5" />
          Accueil
        </Link>
        <Link
          href="/dashboard/tuteur/alternants"
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-zinc-400"
        >
          <Users className="h-5 w-5" />
          Alternants
        </Link>
        <Link
          href="/dashboard/tuteur/missions"
          className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-zinc-400"
        >
          <span className="absolute right-2 top-1 rounded-full bg-violet-500 px-1.5 text-[9px] font-bold text-white">5</span>
          <ListChecks className="h-5 w-5" />
          Missions
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-zinc-300"
            >
              <Menu className="h-5 w-5" />
              Menu
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="border-white/10 bg-[#0c0c0f] text-zinc-100">
            <SheetHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4 text-left">
              <SheetTitle className="text-white">Navigation</SheetTitle>
              <Button type="button" variant="ghost" size="icon" className="text-zinc-400" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </SheetHeader>
            <div className="mt-4 space-y-1 pb-8">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setMobileOpen(false)} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
