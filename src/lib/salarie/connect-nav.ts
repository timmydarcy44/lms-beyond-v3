import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ClipboardList,
  Home,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";

export type SalarieNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const SALARIE_NAV_ITEMS: SalarieNavItem[] = [
  { label: "Accueil", href: "/dashboard/salarie", icon: Home },
  { label: "Mes bilans", href: "/dashboard/salarie/bilans", icon: ClipboardList },
  { label: "Mes formations", href: "/dashboard/salarie/formations", icon: BookOpen },
  { label: "Mes compétences", href: "/dashboard/salarie/competences", icon: UserCircle },
  { label: "Accompagnement", href: "/dashboard/salarie/accompagnement", icon: Users },
  { label: "Mon compte", href: "/dashboard/salarie/profil", icon: Wallet },
];

export const SALARIE_PAGE_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45";
export const SALARIE_PAGE_TITLE = "text-3xl font-extrabold tracking-tight text-white";
export const SALARIE_PAGE_LEAD = "mt-2 max-w-3xl text-sm text-white/55";
export const SALARIE_PAGE_SHELL = "mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-8 lg:px-10";
export const SALARIE_CARD =
  "rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm";
