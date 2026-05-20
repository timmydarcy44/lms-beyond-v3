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

/** ——— Option B : contenu principal clair ——— */

export const APPRENANT_PAGE_SHELL = "space-y-6 md:space-y-8";

export const APPRENANT_PAGE_KICKER =
  "text-[10px] font-normal uppercase tracking-[0.2em] text-[#FF3B30]";

export const APPRENANT_PAGE_TITLE =
  "text-[clamp(1.45rem,2.5vw,1.85rem)] font-medium text-[#0a0a0a] md:text-[clamp(1.95rem,3vw,2.4rem)]";

export const APPRENANT_PAGE_LEAD = "max-w-2xl text-sm text-black/60";

/** Cartes sections */
export const APPRENANT_CARD_CLASS =
  "rounded-lg border border-black/[0.06] bg-[#f5f5f3] p-5 text-[#0a0a0a] sm:px-6 sm:py-5";

/** Carte hero « Votre progression EDGE » */
export const APPRENANT_MAIN_CARD_CLASS =
  "rounded-lg border border-black/10 bg-[#f0f0ee] p-5 text-[#0a0a0a] sm:px-6 sm:py-5";

export const CONNECT_CARD_INNER =
  "rounded-lg border border-black/[0.06] bg-white p-4 sm:p-5";

export const CONNECT_CARD_ACTIVE =
  "rounded-lg border border-[rgba(255,59,48,0.15)] border-l-2 border-l-[#FF3B30] bg-white p-4 sm:p-5";

export const CONNECT_HERO_TITLE = "text-[22px] font-medium text-[#0a0a0a]";

export const CONNECT_SECTION_TITLE = "text-sm font-medium text-[#0a0a0a]";

export const CONNECT_SECTION_SUBTITLE = "text-xs text-black/60";

export const CONNECT_LABEL_UPPER =
  "text-[10px] font-normal uppercase tracking-[0.2em] text-[#FF3B30]";

export const CONNECT_TEXT_SECONDARY = "text-sm text-black/60";

export const CONNECT_TEXT_TERTIARY = "text-xs text-black/40";

export const CONNECT_PROGRESS_TRACK = "h-2 overflow-hidden rounded-full bg-black/[0.12]";

export const CONNECT_PROGRESS_FILL = "h-full rounded-full bg-[#FF3B30] transition-all";

export const CONNECT_PROGRESS_LABEL = "text-xs text-black/60";

export const CONNECT_PROGRESS_PCT = "font-mono text-xs font-medium text-[#0a0a0a]";

export const CONNECT_PROFILE_CIRCLE_PCT = "text-2xl font-medium text-[#0a0a0a]";

export const CONNECT_PROFILE_CIRCLE_LABEL =
  "mt-1 text-[10px] font-normal uppercase tracking-[0.15em] text-black/45";

export const CONNECT_PROFILE_CIRCLE_CAPTION = "max-w-xs text-center text-xs text-black/[0.55]";

export const CONNECT_BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-full bg-edge-red px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90";

export const CONNECT_BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-full border border-black/15 bg-transparent px-4 py-2 text-sm font-medium text-black/60 transition hover:border-black/25 hover:text-[#0a0a0a]";

export const CONNECT_BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-full border border-[#FF3B30] bg-transparent px-4 py-2 text-sm font-medium text-[#FF3B30] transition hover:bg-[#FF3B30]/[0.04]";

export const CONNECT_TAG_CATEGORY =
  "text-[9px] font-normal uppercase tracking-[0.15em] text-[#FF3B30]";

export const CONNECT_BADGE_LEVEL =
  "inline-flex rounded-full border border-[rgba(255,59,48,0.2)] bg-[rgba(255,59,48,0.06)] px-2.5 py-0.5 text-[10px] font-medium text-[#FF3B30]";

export const CONNECT_BADGE_TITLE = "mt-2 text-xs font-medium text-[#0a0a0a]";

export const CONNECT_BADGE_LOCKED = "mt-1 text-xs text-black/40";

export const CONNECT_FILTER_ACTIVE =
  "rounded-full bg-[#FF3B30] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white";

export const CONNECT_FILTER_INACTIVE =
  "rounded-full border border-black/[0.06] bg-[#f5f5f3] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-black/50";

export const CONNECT_GOAL_STRIP =
  "mt-6 border-l-2 border-l-[#FF3B30] bg-white px-6 py-4";

export const CONNECT_GOAL_TEXT = "mt-1 text-sm text-[#0a0a0a]";
