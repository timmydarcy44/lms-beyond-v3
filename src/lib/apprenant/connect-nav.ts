import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  LayoutDashboard,
  MonitorPlay,
  Sparkles,
  UserCircle,
} from "lucide-react";

import { EDGE_LAB_ONLINE_CATALOG_HREF, EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

export type ApprenantNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const BASE: ApprenantNavItem[] = [
  { label: "Accueil", href: "/dashboard/apprenant", icon: LayoutDashboard },
  { label: "EDGE Online", href: EDGE_ONLINE_APP_SURFACE_PATH, icon: MonitorPlay },
  { label: "Profil", href: "/dashboard/apprenant/profil", icon: UserCircle },
  { label: "Parcours", href: EDGE_LAB_ONLINE_CATALOG_HREF, icon: BookMarked },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Mes missions", href: "/dashboard/apprenant/career", icon: ClipboardList },
  { label: "Mes badges", href: "/dashboard/apprenant/badges", icon: Sparkles },
  { label: "Mes opportunités", href: "/dashboard/apprenant/matching", icon: Briefcase },
  { label: "Ma carrière", href: "/dashboard/apprenant/career", icon: BookOpen },
];

export function buildApprenantNavItems(hasOrganisation: boolean): ApprenantNavItem[] {
  const items = [...BASE];
  if (hasOrganisation) {
    items.splice(6, 0, {
      label: "Mon entreprise",
      href: "/dashboard/apprenant/entreprise",
      icon: Building2,
    });
  }
  return items;
}

/** Cartes / sections — même langage visuel que le hero Connect */
export const APPRENANT_CARD_CLASS =
  "rounded-3xl border border-white/[0.08] bg-[#10151c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";
