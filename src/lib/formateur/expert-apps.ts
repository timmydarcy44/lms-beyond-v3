import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarDays, FolderOpen, Gamepad2, HardDrive, Layers, NotebookPen, QrCode } from "lucide-react";

import type { FormateurNavItem } from "@/lib/formateur/formateur-nav";

export type FormateurAppId = "planning" | "pedagogie" | "administratifs" | "drive";

export type FormateurAppDefinition = {
  id: FormateurAppId;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  homeHref: string;
  navItems: FormateurNavItem[];
};

export const FORMATEUR_APPS: FormateurAppDefinition[] = [
  {
    id: "planning",
    label: "Planning",
    subtitle: "Emploi du temps",
    icon: CalendarDays,
    homeHref: "/dashboard/formateur/planning",
    navItems: [{ label: "Planning", href: "/dashboard/formateur/planning", icon: CalendarDays }],
  },
  {
    id: "pedagogie",
    label: "Pédagogie",
    subtitle: "Cours, parcours, ressources",
    icon: BookOpen,
    homeHref: "/dashboard/formateur/formations",
    navItems: [
      { label: "Mes cours", href: "/dashboard/formateur/formations", icon: BookOpen },
      { label: "Parcours", href: "/dashboard/formateur/parcours", icon: Layers },
      { label: "Ressources", href: "/dashboard/formateur/ressources", icon: FolderOpen },
      { label: "Résultats des jeux", href: "/dashboard/ecole/jeux", icon: Gamepad2 },
    ],
  },
  {
    id: "administratifs",
    label: "Administratifs",
    subtitle: "Cahier et émargement",
    icon: NotebookPen,
    homeHref: "/dashboard/formateur/cahier-de-texte",
    navItems: [
      { label: "Cahier de texte", href: "/dashboard/formateur/cahier-de-texte", icon: NotebookPen },
      { label: "Émargement", href: "/dashboard/formateur/emargement", icon: QrCode },
    ],
  },
  {
    id: "drive",
    label: "Drive",
    subtitle: "Fichiers",
    icon: HardDrive,
    homeHref: "/dashboard/formateur/drive",
    navItems: [{ label: "Drive", href: "/dashboard/formateur/drive", icon: HardDrive }],
  },
];

export const FORMATEUR_APP_BY_ID: Record<FormateurAppId, FormateurAppDefinition> = FORMATEUR_APPS.reduce(
  (acc, app) => {
    acc[app.id] = app;
    return acc;
  },
  {} as Record<FormateurAppId, FormateurAppDefinition>,
);

const STORAGE_KEY = "edge-formateur-active-app";

export function getStoredFormateurAppId(): FormateurAppId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw && raw in FORMATEUR_APP_BY_ID) return raw as FormateurAppId;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredFormateurAppId(id: FormateurAppId) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function resolveFormateurAppFromPathname(pathname: string | null | undefined): FormateurAppId | null {
  const path = String(pathname ?? "");
  if (path.startsWith("/dashboard/formateur/planning")) return "planning";
  if (
    path.startsWith("/dashboard/formateur/formations") ||
    path.startsWith("/dashboard/formateur/parcours") ||
    path.startsWith("/dashboard/formateur/ressources")
  ) {
    return "pedagogie";
  }
  if (
    path.startsWith("/dashboard/formateur/cahier-de-texte") ||
    path.startsWith("/dashboard/formateur/emargement")
  ) {
    return "administratifs";
  }
  if (path.startsWith("/dashboard/formateur/drive")) return "drive";
  return null;
}
