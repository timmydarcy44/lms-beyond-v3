import type { LucideIcon } from "lucide-react";

import {

  LayoutDashboard,

  MonitorPlay,

  UserCircle,

  BookMarked,

  Award,

  Wallet,

  Briefcase,

  Building2,

  Share2,

  ClipboardList,

} from "lucide-react";



import { EDGE_LAB_ONLINE_CATALOG_HREF, EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

import type { ApprenantConnectVariant } from "@/lib/apprenant/connect-theme";

export type ApprenantNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  action?: "share-profile";
};

const PARCOURS_HREF = "/dashboard/student/learning/parcours";

const BASE: ApprenantNavItem[] = [
  { label: "Accueil", href: "/dashboard/apprenant", icon: LayoutDashboard },
  { label: "Profil", href: "/dashboard/apprenant/profil", icon: UserCircle },
  {
    label: "Partager mon profil",
    href: "#share-profile",
    icon: Share2,
    action: "share-profile",
  },
  { label: "EDGE Online", href: EDGE_ONLINE_APP_SURFACE_PATH, icon: MonitorPlay },
  { label: "Parcours", href: PARCOURS_HREF, icon: BookMarked },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Wallet", href: "/dashboard/apprenant/badges", icon: Wallet },
  { label: "Mes opportunités", href: "/dashboard/apprenant/matching", icon: Briefcase },
];

const JESSICA_BASE: ApprenantNavItem[] = [
  { label: "Accueil", href: "/dashboard/apprenant", icon: LayoutDashboard },
  { label: "Profil", href: "/dashboard/apprenant/profil", icon: UserCircle },
  {
    label: "Partager mon profil",
    href: "#share-profile",
    icon: Share2,
    action: "share-profile",
  },
  { label: "Parcours guidé", href: "/jessica-contentin/parcours-guide", icon: BookMarked },
  { label: "Mes parcours", href: PARCOURS_HREF, icon: BookMarked },
  { label: "Mes résultats", href: "/dashboard/apprenant/results", icon: Award },
  { label: "Wallet", href: "/dashboard/apprenant/badges", icon: Wallet },
];

export function buildApprenantNavItems(
  hasOrganisation: boolean,
  variant: ApprenantConnectVariant = "edge",
): ApprenantNavItem[] {
  if (variant === "jessica") {
    return [...JESSICA_BASE];
  }

  const items = [...BASE];

  if (hasOrganisation) {

    items.splice(6, 0, {

      label: "Mes missions",

      href: "/dashboard/apprenant/missions",

      icon: ClipboardList,

    });

    items.splice(7, 0, {

      label: "Mon entreprise",

      href: "/dashboard/apprenant/entreprise",

      icon: Building2,

    });

  }

  return items;

}



/** ——— Cockpit carrière (zone principale sombre) ——— */



export const APPRENANT_PAGE_SHELL = "relative space-y-6 md:space-y-8";



export const APPRENANT_PAGE_KICKER = "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]";



export const APPRENANT_PAGE_TITLE =

  "text-[clamp(1.45rem,2.5vw,1.85rem)] font-extrabold tracking-[-0.02em] text-white md:text-[clamp(1.95rem,3vw,2.4rem)]";



export const APPRENANT_PAGE_LEAD = "max-w-2xl text-[13px] text-white/40";



/** Surfaces & cards — finance premium (Revolut/Robinhood) */
export const APPRENANT_CARD_CLASS =
  "rounded-2xl border border-white/[0.06] bg-[#17171F]";

/** Carte avec padding standard */
export const APPRENANT_CARD_BODY = `${APPRENANT_CARD_CLASS} flex flex-col gap-3 px-[20px] py-[18px] text-white`;

/** Bloc hero accueil — gradient + overlay bleu (directives) */
export const APPRENANT_HERO_CLASS =
  "flex flex-col gap-4 rounded-2xl border border-white/[0.06] px-[20px] py-[18px] text-white";

/** Carte cliquable (lien) */
export const APPRENANT_CARD_INTERACTIVE = `${APPRENANT_CARD_BODY} transition hover:border-sky-400/30 group`;

export const APPRENANT_CARD_KICKER =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]";

export const APPRENANT_CARD_TITLE = "text-[15px] font-extrabold tracking-[-0.02em] text-white";

export const APPRENANT_CARD_MUTED = "text-[13px] text-white/40";

export const APPRENANT_CARD_NOTE =
  "rounded-2xl border border-white/[0.06] bg-[#1C1C28] px-[20px] py-[18px] text-[13px] text-white/40";

export const APPRENANT_MAIN_CARD_CLASS = APPRENANT_CARD_BODY;

export const CONNECT_CARD_INNER =
  "rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm sm:p-5";



export const CONNECT_CARD_ACTIVE =

  "rounded-lg border border-sky-400/25 border-l-2 border-l-sky-400 bg-sky-500/[0.08] p-4 backdrop-blur-sm sm:p-5";



export const CONNECT_HERO_TITLE = "text-[22px] font-medium text-white";



export const CONNECT_SECTION_TITLE = "text-sm font-medium text-white";



export const CONNECT_SECTION_SUBTITLE = "text-xs text-slate-400";



export const CONNECT_LABEL_UPPER =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]";



export const CONNECT_TEXT_SECONDARY = "text-[13px] text-white/40";



export const CONNECT_TEXT_TERTIARY = "text-[13px] text-white/40";



export const CONNECT_PROGRESS_TRACK = "h-[3px] overflow-hidden rounded-full bg-white/[0.07]";



export const CONNECT_PROGRESS_FILL = "h-full rounded-full bg-[#2563EB] transition-all";



export const CONNECT_PROGRESS_LABEL = "text-[13px] text-white/40";



export const CONNECT_PROGRESS_PCT = "text-[13px] font-semibold text-white";



export const CONNECT_PROFILE_CIRCLE_PCT = "text-2xl font-medium text-white";



export const CONNECT_PROFILE_CIRCLE_LABEL =

  "mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500";



export const CONNECT_PROFILE_CIRCLE_CAPTION = "max-w-xs text-center text-xs text-slate-400";



/** Violet type Revolut — CTA principaux */
export const CONNECT_BTN_PRIMARY =
  "inline-flex items-center justify-center rounded-[10px] bg-[#2563EB] px-5 py-[11px] text-[13px] font-bold text-white transition hover:bg-[#1D4ED8]";



export const CONNECT_BTN_SECONDARY =
  "inline-flex items-center justify-center rounded-[10px] border border-white/[0.08] bg-transparent px-5 py-[11px] text-[13px] font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white/70";



export const CONNECT_BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-[10px] border border-white/[0.08] bg-transparent px-5 py-[11px] text-[13px] font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white/70";



export const CONNECT_TAG_CATEGORY =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]";



export const CONNECT_BADGE_LEVEL =

  "inline-flex rounded-full border border-sky-400/25 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-200";



export const CONNECT_BADGE_TITLE = "mt-2 text-xs font-medium text-white";



export const CONNECT_BADGE_LOCKED = "mt-1 text-xs text-slate-500";



export const CONNECT_FILTER_ACTIVE =

  "rounded-full bg-sky-600 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-white";



export const CONNECT_FILTER_INACTIVE =

  "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-500";



export const CONNECT_GOAL_STRIP =

  "mt-6 border-l-2 border-l-[#FF3B30] bg-gradient-to-r from-[#FF3B30]/10 to-transparent px-6 py-4";



export const CONNECT_GOAL_TEXT = "mt-1 text-sm text-slate-200";

