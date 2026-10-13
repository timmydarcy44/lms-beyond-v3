import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  FolderOpen,
  Gamepad2,
  HardDrive,
  Home,
  Layers,
  MessageCircle,
  NotebookPen,
  QrCode,
} from "lucide-react";

export type FormateurNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Navigation Expert / Formateur — orientée action pédagogique. */
export const FORMATEUR_NAV_ITEMS: FormateurNavItem[] = [
  { label: "Accueil", href: "/dashboard/formateur", icon: Home },
  { label: "Planning", href: "/dashboard/formateur/planning", icon: CalendarDays },
  { label: "Mes cours", href: "/dashboard/formateur/formations", icon: BookOpen },
  { label: "Parcours", href: "/dashboard/formateur/parcours", icon: Layers },
  { label: "Cahier de texte", href: "/dashboard/formateur/cahier-de-texte", icon: NotebookPen },
  { label: "Émargement", href: "/dashboard/formateur/emargement", icon: QrCode },
  { label: "Ressources", href: "/dashboard/formateur/ressources", icon: FolderOpen },
  { label: "Drive", href: "/dashboard/formateur/drive", icon: HardDrive },
  { label: "Tests", href: "/dashboard/formateur/tests", icon: ClipboardCheck },
  { label: "Résultats des jeux", href: "/dashboard/ecole/jeux", icon: Gamepad2 },
  { label: "To-Do", href: "/dashboard/formateur/todo", icon: CheckSquare },
  { label: "Messages", href: "/dashboard/student/community", icon: MessageCircle },
];

const navByLabel = (label: string) => FORMATEUR_NAV_ITEMS.find((item) => item.label === label)!;

export const FORMATEUR_NAV_SECTIONS: Array<{ label: string; items: FormateurNavItem[] }> = [
  {
    label: "Enseigner",
    items: ["Planning", "Mes cours", "Parcours", "Cahier de texte", "Émargement", "Tests", "Résultats des jeux"].map(navByLabel),
  },
  {
    label: "Outils",
    items: ["Ressources", "Drive", "To-Do", "Messages"].map(navByLabel),
  },
];

export function resolveFormateurActiveLabel(pathname: string | null): string {
  if (!pathname) return "Accueil";
  const match = FORMATEUR_NAV_ITEMS.filter((item) => item.href !== "/dashboard/formateur")
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (match) return match.label;
  if (pathname === "/dashboard/formateur" || pathname.startsWith("/dashboard/formateur/")) {
    return "Accueil";
  }
  return "Accueil";
}
