import type { ReactNode } from "react";

export type LearnerNavIcon =
  | "home"
  | "film"
  | "layers"
  | "library"
  | "trophy"
  | "checklist"
  | "sparkles"
  | "drive"
  | "message";

export type LearnerNavItem = {
  label: string;
  href: string;
  icon?: LearnerNavIcon;
  group?: "apps" | "primary";
  brandColor?: {
    dot: string;
    text: string;
    bg: string;
    hoverBg?: string;
  };
};

export const learnerNavItems: LearnerNavItem[] = [
  { label: "Accueil", href: "/dashboard/apprenant", icon: "home" },
  { label: "Formations", href: "/dashboard/formations", icon: "film" },
  { label: "Parcours", href: "/dashboard/parcours", icon: "layers" },
  { label: "Ressources", href: "/dashboard/ressources", icon: "library" },
  { label: "Drive", href: "/dashboard/drive", icon: "drive" },
  { label: "Tests", href: "/dashboard/tests", icon: "trophy" },
  { label: "À faire", href: "/dashboard/apprenant/todo", icon: "checklist" },
  { label: "Messagerie", href: "/dashboard/communaute", icon: "message" },
  {
    label: "Beyond Care",
    href: "/dashboard/beyond-care",
    icon: "sparkles",
    group: "apps",
    brandColor: {
      dot: "bg-[#c91459] text-white",
      text: "text-white",
      bg: "bg-[#c91459]/90",
      hoverBg: "hover:bg-[#c91459]",
    },
  },
  {
    label: "Beyond Connect",
    href: "/dashboard/beyond-connect",
    icon: "sparkles",
    group: "apps",
    brandColor: {
      dot: "bg-[#2563eb] text-white",
      text: "text-white",
      bg: "bg-[#1d4ed8]/90",
      hoverBg: "hover:bg-[#1d4ed8]",
    },
  },
  {
    label: "Beyond No School",
    href: "/dashboard/catalogue",
    icon: "sparkles",
    group: "apps",
    brandColor: {
      dot: "bg-[#0ea5e9] text-white",
      text: "text-white",
      bg: "bg-[#0ea5e9]/90",
      hoverBg: "hover:bg-[#0284c7]",
    },
  },
];

export type LearnerNavIconMap = Record<NonNullable<LearnerNavItem["icon"]>, ReactNode>;

