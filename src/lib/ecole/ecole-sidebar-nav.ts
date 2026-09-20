import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MonitorPlay,
  ShieldCheck,
  Users,
} from "lucide-react";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

export type EcoleNavLeaf = { label: string; href: string; exact?: boolean };

export type EcoleNavItem =
  | {
      type: "link";
      label: string;
      href: string;
      icon: LucideIcon;
      activePathPrefix?: string;
    }
  | {
      type: "group";
      label: string;
      icon: LucideIcon;
      children: EcoleNavLeaf[];
    };

export const ECOLE_SIDEBAR_NAV: EcoleNavItem[] = [
  { type: "link", label: "Tableau de bord", href: "/dashboard/ecole", icon: LayoutDashboard },
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
      { label: "Entreprises inactives", href: "/dashboard/ecole/entreprises/inactives" },
      { label: "Prospection", href: "/dashboard/ecole/prospection" },
    ],
  },
  {
    type: "group",
    label: "Formations",
    icon: BookOpen,
    children: [
      { label: "Liste des formations", href: "/dashboard/ecole/formations/gerer" },
      { label: "Référentiels", href: "/dashboard/ecole/formations/referentiels" },
      { label: "Suivi des formations", href: "/dashboard/ecole/formations-suivi" },
      { label: "Statistiques", href: "/dashboard/ecole/statistiques" },
    ],
  },
  {
    type: "link",
    label: "Planning",
    href: "/dashboard/ecole/planning",
    icon: CalendarDays,
  },
  {
    type: "group",
    label: "Recrutement",
    icon: Briefcase,
    children: [
      { label: "Prospects étudiants", href: "/dashboard/ecole/recrutement/prospects" },
      { label: "Post formation", href: "/dashboard/ecole/recrutement/post-formation" },
    ],
  },
  {
    type: "group",
    label: "Formateurs",
    icon: GraduationCap,
    children: [
      { label: "Formateurs", href: "/dashboard/ecole/formateurs" },
      { label: "CVthèques", href: "/dashboard/ecole/formateurs/cvtheque" },
    ],
  },
  {
    type: "group",
    label: "Qualité",
    icon: ClipboardCheck,
    children: [
      { label: "Questionnaires qualité", href: "/dashboard/ecole/qualite/questionnaires" },
      { label: "Résultats", href: "/dashboard/ecole/qualite/resultats" },
    ],
  },
  { type: "link", label: "Ma todo", href: "/dashboard/ecole/todo", icon: CheckSquare },
  { type: "link", label: "Qualiopi", href: "/dashboard/ecole/qualiopi", icon: ShieldCheck },
  {
    type: "link",
    label: "EDGE Online",
    href: EDGE_ONLINE_APP_SURFACE_PATH,
    icon: MonitorPlay,
    activePathPrefix: EDGE_ONLINE_APP_SURFACE_PATH,
  },
];

export const ECOLE_PRICING_NAV = {
  label: "Tarifs",
  href: "/dashboard/ecole/pricing",
};

export function isEcoleLinkActive(
  pathname: string,
  href: string,
  activePathPrefix?: string,
  exact = false,
): boolean {
  if (activePathPrefix) {
    return pathname === activePathPrefix || pathname.startsWith(`${activePathPrefix}/`);
  }
  if (href === "/dashboard/ecole") return pathname === href;
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isEcoleGroupActive(pathname: string, children: EcoleNavLeaf[]): boolean {
  return children.some((child) =>
    isEcoleLinkActive(pathname, child.href, undefined, child.exact),
  );
}

export function flattenEcoleNavLinks(items: EcoleNavItem[] = ECOLE_SIDEBAR_NAV): EcoleNavLeaf[] {
  const links: EcoleNavLeaf[] = [];
  for (const item of items) {
    if (item.type === "link") {
      links.push({ label: item.label, href: item.href });
    } else {
      links.push(...item.children);
    }
  }
  return links;
}
