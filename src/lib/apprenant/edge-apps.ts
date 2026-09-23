import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarDays,
  Clock3,
  Dumbbell,
  FileCheck2,
  FileWarning,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutDashboard,
  MonitorPlay,
  Share2,
  Sparkles,
  TrendingUp,
  UserCircle,
} from "lucide-react";

import type { ApprenantNavItem } from "@/lib/apprenant/connect-nav";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

export type EdgeAppId =
  | "profil"
  | "skills"
  | "learning"
  | "planning"
  | "recrutement"
  | "care";

export type EdgeAppDefinition = {
  id: EdgeAppId;
  /** Label court du switcher (Profil, Skills, …). */
  label: string;
  /** Nom affiché pendant la transition de marque (EDGE Skills). */
  transitionName: string;
  subtitle: string;
  icon: LucideIcon;
  image: string;
  homeHref: string;
  navItems: ApprenantNavItem[];
};

const APP_ASSETS = {
  profil:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/EDGE%20Profil.jpg",
  skills:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_B_brosse_Wallet.png",
  learn:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_B_Learn.png",
  planning:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_B_Planning.png",
  recrutement:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/EDGE%20Recrutement.jpg",
  care:
    "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Logo_B_Care.png",
} as const;

/** Profil = hub identité (synthèse / partage), pas le catalogue compétences. */
const PROFIL_NAV: ApprenantNavItem[] = [
  {
    label: "Vue d'ensemble",
    href: "/dashboard/apprenant/profil-comportemental",
    icon: LayoutDashboard,
  },
  { label: "Mon évolution", href: "/dashboard/apprenant", icon: TrendingUp },
  {
    label: "Identité",
    href: "/dashboard/apprenant/profil-comportemental/identite",
    icon: UserCircle,
  },
  {
    label: "Partager mon profil",
    href: "#share-profile",
    icon: Share2,
    action: "share-profile",
  },
];

const SKILLS_NAV: ApprenantNavItem[] = [
  {
    label: "Accueil",
    href: "/dashboard/apprenant/skills",
    icon: Home,
  },
  {
    label: "Mes compétences",
    href: "/dashboard/apprenant/skills/competences",
    icon: Sparkles,
  },
  {
    label: "Entraînement",
    href: "/dashboard/apprenant/skills/entrainement",
    icon: Dumbbell,
  },
  {
    label: "Mes preuves",
    href: "/dashboard/apprenant/skills/preuves",
    icon: FileCheck2,
  },
  {
    label: "Badges & certifications",
    href: "/dashboard/apprenant/skills/badges",
    icon: Award,
  },
];

const LEARNING_NAV: ApprenantNavItem[] = [
  { label: "Mes formations", href: "/dashboard/apprenant/formations", icon: BookOpen },
  { label: "Mes parcours", href: "/dashboard/apprenant/parcours", icon: BookMarked },
  { label: "Online", href: EDGE_ONLINE_APP_SURFACE_PATH, icon: MonitorPlay },
  { label: "Statistiques", href: "/dashboard/apprenant/statistiques", icon: GraduationCap },
];

const PLANNING_NAV: ApprenantNavItem[] = [
  { label: "Mon planning", href: "/dashboard/apprenant/planning", icon: CalendarDays },
  { label: "Mes absences", href: "/dashboard/apprenant/planning/absences", icon: FileWarning },
];

const RECRUTEMENT_NAV: ApprenantNavItem[] = [
  { label: "Mon profil", href: "/dashboard/apprenant/recrutement/profil", icon: UserCircle },
  { label: "Offres", href: "/dashboard/apprenant/recrutement/offres", icon: Briefcase },
  { label: "En attente", href: "/dashboard/apprenant/recrutement/en-attente", icon: Clock3 },
];

const CARE_NAV: ApprenantNavItem[] = [
  { label: "Accueil Care", href: "/dashboard/apprenant/care", icon: HeartPulse },
];

/**
 * Ordre switcher (grille 3×2) :
 * Profil · Skills · Learn
 * Planning · Recrutement · Care
 */
export const EDGE_APPS: EdgeAppDefinition[] = [
  {
    id: "profil",
    label: "Profil",
    transitionName: "Byound Profil",
    subtitle: "Mon identité",
    icon: UserCircle,
    image: APP_ASSETS.profil,
    homeHref: "/dashboard/apprenant/profil-comportemental",
    navItems: PROFIL_NAV,
  },
  {
    id: "skills",
    label: "Skills",
    transitionName: "Byound Skills",
    subtitle: "Training Center",
    icon: Sparkles,
    image: APP_ASSETS.skills,
    homeHref: "/dashboard/apprenant/skills",
    navItems: SKILLS_NAV,
  },
  {
    id: "learning",
    label: "Learn",
    transitionName: "Byound Learn",
    subtitle: "Mes apprentissages",
    icon: BookOpen,
    image: APP_ASSETS.learn,
    homeHref: "/dashboard/apprenant/formations",
    navItems: LEARNING_NAV,
  },
  {
    id: "planning",
    label: "Planning",
    transitionName: "Byound Planning",
    subtitle: "Mon emploi du temps",
    icon: CalendarDays,
    image: APP_ASSETS.planning,
    homeHref: "/dashboard/apprenant/planning",
    navItems: PLANNING_NAV,
  },
  {
    id: "recrutement",
    label: "Recrutement",
    transitionName: "Byound Recrutement",
    subtitle: "Mes opportunités",
    icon: Briefcase,
    image: APP_ASSETS.recrutement,
    homeHref: "/dashboard/apprenant/recrutement/offres",
    navItems: RECRUTEMENT_NAV,
  },
  {
    id: "care",
    label: "Care",
    transitionName: "Byound Care",
    subtitle: "Bien-être & accompagnement",
    icon: HeartPulse,
    image: APP_ASSETS.care,
    homeHref: "/dashboard/apprenant/care",
    navItems: CARE_NAV,
  },
];

export const EDGE_APP_BY_ID: Record<EdgeAppId, EdgeAppDefinition> = EDGE_APPS.reduce(
  (acc, app) => {
    acc[app.id] = app;
    return acc;
  },
  {} as Record<EdgeAppId, EdgeAppDefinition>,
);

const STORAGE_KEY = "edge-apprenant-active-app";

export function getStoredEdgeAppId(): EdgeAppId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw && raw in EDGE_APP_BY_ID) return raw as EdgeAppId;
  } catch {
    // ignore
  }
  return null;
}

export function setStoredEdgeAppId(id: EdgeAppId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function resolveEdgeAppFromPathname(pathname: string | null | undefined): EdgeAppId {
  const p = String(pathname ?? "");

  if (p.startsWith("/dashboard/apprenant/care") || p.startsWith("/dashboard/apprenant/beyond-care")) {
    return "care";
  }

  if (p.startsWith("/dashboard/apprenant/planning")) return "planning";

  if (
    p.startsWith("/dashboard/apprenant/skills") ||
    p.startsWith("/dashboard/apprenant/badges") ||
    p.includes("/profil-comportemental/hard-skills") ||
    p.includes("/profil-comportemental/tests") ||
    p.startsWith("/dashboard/apprenant/results")
  ) {
    return "skills";
  }

  if (
    p.startsWith("/dashboard/apprenant/formations") ||
    p.startsWith("/dashboard/apprenant/parcours") ||
    p.startsWith("/dashboard/apprenant/online") ||
    p.startsWith("/dashboard/apprenant/statistiques") ||
    p.startsWith(EDGE_ONLINE_APP_SURFACE_PATH) ||
    p.startsWith("/g/edgelab") ||
    p.startsWith("/g/edge-lab")
  ) {
    return "learning";
  }

  if (
    p.startsWith("/dashboard/apprenant/recrutement") ||
    p.startsWith("/dashboard/apprenant/matching") ||
    p.startsWith("/dashboard/apprenant/entreprise") ||
    p.startsWith("/dashboard/apprenant/missions")
  ) {
    return "recrutement";
  }

  return "profil";
}

export function getEdgeAppNavItems(appId: EdgeAppId): ApprenantNavItem[] {
  return EDGE_APP_BY_ID[appId]?.navItems ?? PROFIL_NAV;
}

export function getEdgeAppLabel(appId: EdgeAppId): string {
  return EDGE_APP_BY_ID[appId]?.label ?? "Profil";
}

export function getEdgeAppTransitionName(appId: EdgeAppId): string {
  return EDGE_APP_BY_ID[appId]?.transitionName ?? "Byound Profil";
}
