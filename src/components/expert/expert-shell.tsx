"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Manrope } from "next/font/google";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  CalendarDays,
  ChevronDown,
  Euro,
  BookOpen,
  FolderCog,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Menu,
  Settings,
  User2,
  X,
} from "lucide-react";

import { DEFAULT_CARE_PRESTATIONS } from "@/lib/expert/care-prestations";

import type { ExpertMembership, ExpertPole } from "@/lib/expert/pole-model";
import { setDashboardSpace } from "@/lib/dashboard/space";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

type NavChild = { label: string; href: string };

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
  locked?: boolean;
  badge?: number;
  children?: NavChild[];
};

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8]";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "E") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCollapsed({});
  }, [pathname]);

  return (
    <nav aria-label="Navigation expert" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const childActive = item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`));
        const menuOpen =
          Boolean(item.children?.length) && (collapsed[item.label] === undefined ? Boolean(childActive) : !collapsed[item.label]);
        const active =
          !item.external &&
          (item.href === "/dashboard/expert"
            ? pathname === "/dashboard/expert"
            : pathname === item.href || pathname.startsWith(`${item.href}/`) || Boolean(childActive));
        const className = cn(
          "flex h-11 w-full items-center gap-3 rounded-full px-4 text-sm font-semibold",
          focusRing,
          active ? "bg-[#F4F5F7] font-extrabold text-[#07080B]" : "text-[#DADDE4] hover:bg-[#12141A]",
        );
        const badge =
          item.badge && item.badge > 0 ? (
            <span className="ml-auto rounded-full bg-[#FF4B4B] px-2 py-0.5 text-[11px] font-extrabold text-[#04140C]">
              {item.badge}
            </span>
          ) : null;
        if (item.locked) {
          return (
            <div
              key={item.label}
              className="flex h-11 cursor-not-allowed items-center gap-3 rounded-full px-4 text-sm font-semibold text-[#9096A3]"
              title="Disponible après validation de votre profil"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              <Lock className="h-3.5 w-3.5" aria-hidden />
            </div>
          );
        }
        const content = (
          <>
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
            {item.children?.length ? (
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 opacity-70 transition-transform", menuOpen && "rotate-180")} aria-hidden />
            ) : null}
            {badge}
          </>
        );
        if (item.external) {
          return (
            <a key={item.label} href={item.href} className={className} onClick={onNavigate}>
              {content}
            </a>
          );
        }
        if (item.children?.length) {
          return (
            <div key={item.label}>
              <button
                type="button"
                className={className}
                aria-expanded={menuOpen}
                onClick={() =>
                  setCollapsed((current) => ({
                    ...current,
                    [item.label]: menuOpen,
                  }))
                }
              >
                {content}
              </button>
              {menuOpen ? (
                <div className="ml-6 mt-1 flex flex-col gap-0.5">
                  {item.children.map((child) => {
                    const open = pathname === child.href || pathname.startsWith(`${child.href}/`);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex h-9 items-center rounded-full px-3 text-sm font-semibold",
                          focusRing,
                          open ? "bg-[#1E2130] text-[#F4F5F7]" : "text-[#9096A3] hover:text-[#DADDE4]",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            className={className}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

export function ExpertShell({
  children,
  name,
  certified,
  restricted,
  photoUrl,
  pole = "formation",
  memberships = [],
  managerPoles = [],
}: {
  children: ReactNode;
  name: string;
  certified: boolean;
  restricted: boolean;
  photoUrl?: string | null;
  pole?: ExpertPole;
  memberships?: ExpertMembership[];
  managerPoles?: ExpertPole[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ missions: 0, documents: 0 });
  const [prestations, setPrestations] = useState<typeof DEFAULT_CARE_PRESTATIONS>([]);

  useEffect(() => {
    setDashboardSpace("expert");
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      void fetch("/api/expert/nav-counts", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (cancelled || !json) return;
          setCounts({
            missions: Number(json.missions) || 0,
            documents: Number(json.documents) || 0,
          });
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener("expert-nav-refresh", load);
    return () => {
      cancelled = true;
      window.removeEventListener("expert-nav-refresh", load);
    };
  }, [pathname]);

  const hasCare = pole === "care" || memberships.some((item) => item.pole === "care" && item.status === "active");
  const careOnly = hasCare && !memberships.some((item) => item.pole === "formation" && item.status === "active");

  useEffect(() => {
    if (!hasCare) return;
    let cancelled = false;
    void fetch("/api/expert/care/prestations", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled || !Array.isArray(json?.prestations)) return;
        setPrestations(json.prestations);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [hasCare, pathname]);
  const adminChildren: NavChild[] = [{ label: "Mes documents", href: "/dashboard/expert/documents" }];
  if (hasCare) {
    adminChildren.push(
      { label: "CRM", href: "/dashboard/expert/dossiers" },
      { label: "Byound tests", href: "/dashboard/expert/tests" },
      { label: "Facturation", href: "/dashboard/expert/facturation" },
    );
  }
  const items: NavItem[] = [
    { label: "Tableau de bord", href: "/dashboard/expert", icon: LayoutDashboard },
    { label: "Mon profil", href: "/dashboard/expert/profile", icon: User2 },
    { label: "Agenda", href: "/dashboard/expert/agenda", icon: CalendarDays, locked: restricted },
  ];
  if (hasCare) {
    items.push({
      label: "Mes prestations",
      href: "/dashboard/expert/prestations",
      icon: Briefcase,
      locked: restricted,
      children: [
        ...prestations.map((item) => ({
          label: item.label,
          href: `/dashboard/expert/prestations#${item.id}`,
        })),
        { label: "Ajouter une prestation", href: "/dashboard/expert/prestations?nouveau=1" },
      ],
    });
    items.push({
      label: "Byound Care",
      href: "/dashboard/expert/care/disponibilites",
      icon: HeartHandshake,
      locked: restricted,
      children: [
        { label: "Disponibilités", href: "/dashboard/expert/care/disponibilites" },
        { label: "Rendez-vous", href: "/dashboard/expert/care/rendez-vous" },
      ],
    });
  }
  items.push(
    { label: "Mes revenus", href: "/dashboard/expert/revenus", icon: Euro, locked: restricted },
    {
      label: "Gestion admin",
      href: "/dashboard/expert/documents",
      icon: FolderCog,
      badge: counts.documents,
      children: adminChildren,
    },
  );
  if (!careOnly) {
    items.push(
      {
        label: "Formations",
        href: "/dashboard/expert/formations",
        icon: BookOpen,
        children: [
          { label: "Mes formations", href: "/dashboard/expert/formations" },
          { label: "Mes résultats", href: "/dashboard/expert/resultats" },
        ],
      },
      { label: "Byound Certified", href: "/dashboard/expert/certification", icon: Award },
    );
  }
  items.push({ label: "Paramètres", href: "/dashboard/expert/settings", icon: Settings });

  const identity = (
    <div className="mb-5 flex items-center gap-3 px-2">
      {photoUrl ? (
        <Image src={photoUrl} alt="" width={44} height={44} unoptimized className="h-11 w-11 rounded-full object-cover" />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF4B4B] text-sm font-extrabold text-[#04140C]">
          {initialsOf(name)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold text-[#F4F5F7]">{name}</span>
        {certified ? <span className="block text-xs font-bold text-[#F2CF6B]">Experte certifiée</span> : null}
      </span>
    </div>
  );

  const help = (
    <Link
      href="/dashboard/expert/support"
      className={cn("mt-4 flex items-center gap-3 rounded-[24px] bg-[#12141A] p-4", focusRing)}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E2130] text-[#F4F5F7]">
        <HelpCircle className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-[#F4F5F7]">Centre d&apos;aide</span>
        <span className="block text-xs text-[#B5BAC6]">Une question sur une mission ?</span>
      </span>
    </Link>
  );

  const brand = (
    <div className="mb-6 flex items-center gap-3 px-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4F5F7] text-xs font-extrabold text-[#07080B]">
        BY
      </span>
      <span>
        <span className="block text-sm font-extrabold leading-tight text-[#F4F5F7]">Byound</span>
        <span className="block text-xs text-[#9096A3]">Espace expert</span>
      </span>
    </div>
  );

  return (
    <div className={cn(manrope.className, "min-h-screen bg-[#07080B] text-[#F4F5F7]")}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#1E2130] bg-[#07080B] px-3 py-6 md:flex">
          {brand}
          {identity}
          {managerPoles.length > 0 ? (
            <Link href="/dashboard/expert/appartenances" className={cn("mb-3 block rounded-full px-4 py-2 text-sm font-semibold text-[#FFB4B8]", focusRing)}>
              Appartenances
            </Link>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavLinks items={items} />
          </div>
          {help}
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#1E2130] bg-[#07080B] px-4 py-3 md:hidden">
            <Link href="/dashboard/expert" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F5F7] text-xs font-extrabold text-[#07080B]">
                BY
              </span>
              <span className="text-sm font-extrabold">Espace expert</span>
            </Link>
            <button
              type="button"
              className={cn("rounded-full bg-[#12141A] p-2 text-[#F4F5F7]", focusRing)}
              onClick={() => setOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)}>
          <aside
            className="flex h-full w-[min(88vw,320px)] flex-col bg-[#07080B] px-3 py-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <span className="text-sm font-extrabold">Espace expert</span>
              <button
                type="button"
                className={cn("rounded-full bg-[#12141A] p-2", focusRing)}
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {identity}
            {managerPoles.length > 0 ? (
              <Link href="/dashboard/expert/appartenances" className={cn("mb-3 block rounded-full px-4 py-2 text-sm font-semibold text-[#FFB4B8]", focusRing)} onClick={() => setOpen(false)}>
                Appartenances
              </Link>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NavLinks items={items} onNavigate={() => setOpen(false)} />
            </div>
            {help}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
