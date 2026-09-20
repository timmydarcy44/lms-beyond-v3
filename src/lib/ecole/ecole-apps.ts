import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  MonitorPlay,
  Presentation,
  UserPlus,
  Users,
} from "lucide-react";

import type { EcoleNavItem } from "@/lib/ecole/ecole-sidebar-nav";

export type EcoleAppId = "pilotage" | "apprenants" | "formateurs" | "planning" | "formations";

export type EcoleAppDefinition = {
  id: EcoleAppId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  homeHref: string;
  navItems: EcoleNavItem[];
};

const PILOTAGE_NAV: EcoleNavItem[] = [
  { type: "link", label: "Tableau de bord", href: "/dashboard/ecole", icon: LayoutDashboard },
  { type: "link", label: "Statistiques", href: "/dashboard/ecole/statistiques", icon: ClipboardList },
  { type: "link", label: "Ma todo", href: "/dashboard/ecole/todo", icon: CheckSquare },
];

const APPRENANTS_NAV: EcoleNavItem[] = [
  {
    type: "group",
    label: "Mes apprenants",
    icon: Users,
    children: [
      { label: "Liste des apprenants", href: "/dashboard/ecole/apprenants" },
      { label: "Liste des classes", href: "/dashboard/ecole/classes" },
    ],
  },
  {
    type: "group",
    label: "Entreprises",
    icon: Building2,
    children: [
      { label: "Entreprises partenaires", href: "/dashboard/ecole/entreprises", exact: true },
      { label: "Offres", href: "/dashboard/ecole/offres" },
      { label: "Prospection", href: "/dashboard/ecole/prospection" },
    ],
  },
];

const FORMATEURS_NAV: EcoleNavItem[] = [
  { type: "link", label: "Vue d'ensemble", href: "/dashboard/ecole/formateurs", icon: LayoutDashboard },
  { type: "link", label: "Formateurs", href: "/dashboard/ecole/formateurs/liste", icon: Presentation },
  { type: "link", label: "Candidats formateurs", href: "/dashboard/ecole/formateurs/candidats", icon: UserPlus },
];

const PLANNING_NAV: EcoleNavItem[] = [
  { type: "link", label: "Emploi du temps", href: "/dashboard/ecole/planning", icon: CalendarDays },
  { type: "link", label: "Cahier de texte", href: "/dashboard/ecole/planning/cahier-de-texte", icon: BookOpen },
  { type: "link", label: "Émargement / Absences", href: "/dashboard/ecole/planning/absences", icon: ClipboardList },
];

const FORMATIONS_NAV: EcoleNavItem[] = [
  { type: "link", label: "Vue d'ensemble", href: "/dashboard/ecole/formations", icon: LayoutDashboard },
  { type: "link", label: "Cursus", href: "/dashboard/ecole/formations/cursus", icon: GraduationCap },
  { type: "link", label: "EDGE Online", href: "/dashboard/ecole/formations/online", icon: MonitorPlay },
];

export const ECOLE_APPS: EcoleAppDefinition[] = [
  {
    id: "pilotage",
    label: "Pilotage",
    subtitle: "Piloter l’école",
    icon: LayoutDashboard,
    homeHref: "/dashboard/ecole",
    navItems: PILOTAGE_NAV,
  },
  {
    id: "apprenants",
    label: "Apprenants",
    subtitle: "Gérer les apprenants",
    icon: Users,
    homeHref: "/dashboard/ecole/apprenants",
    navItems: APPRENANTS_NAV,
  },
  {
    id: "formateurs",
    label: "Formateurs",
    subtitle: "Gérer les intervenants",
    icon: GraduationCap,
    homeHref: "/dashboard/ecole/formateurs",
    navItems: FORMATEURS_NAV,
  },
  {
    id: "planning",
    label: "Planning",
    subtitle: "Organiser les cours",
    icon: CalendarDays,
    homeHref: "/dashboard/ecole/planning",
    navItems: PLANNING_NAV,
  },
  {
    id: "formations",
    label: "Formations",
    subtitle: "Gérer l’offre pédagogique",
    icon: BookOpen,
    homeHref: "/dashboard/ecole/formations",
    navItems: FORMATIONS_NAV,
  },
];

export const ECOLE_APP_BY_ID = ECOLE_APPS.reduce(
  (acc, app) => {
    acc[app.id] = app;
    return acc;
  },
  {} as Record<EcoleAppId, EcoleAppDefinition>,
);

const STORAGE_KEY = "edge-ecole-active-app";

export function getStoredEcoleAppId(): EcoleAppId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw && raw in ECOLE_APP_BY_ID) return raw as EcoleAppId;
  } catch {
    // ignore
  }
  return null;
}

export function setStoredEcoleAppId(id: EcoleAppId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

export function resolveEcoleAppFromPathname(pathname: string | null | undefined): EcoleAppId {
  const p = String(pathname ?? "");
  if (p.startsWith("/dashboard/ecole/formateurs")) return "formateurs";
  if (p.startsWith("/dashboard/ecole/planning")) return "planning";
  if (
    p.startsWith("/dashboard/ecole/formations") ||
    p.startsWith("/dashboard/ecole/formations-suivi") ||
    p.startsWith("/dashboard/ecole/referentiels")
  ) {
    return "formations";
  }
  if (
    p.startsWith("/dashboard/ecole/apprenants") ||
    p.startsWith("/dashboard/ecole/classes") ||
    p.startsWith("/dashboard/ecole/entreprises") ||
    p.startsWith("/dashboard/ecole/offres") ||
    p.startsWith("/dashboard/ecole/prospection") ||
    p.startsWith("/dashboard/ecole/recrutement")
  ) {
    return "apprenants";
  }
  return "pilotage";
}

export function getEcoleAppLabel(id: EcoleAppId): string {
  return ECOLE_APP_BY_ID[id]?.label ?? "Pilotage";
}
