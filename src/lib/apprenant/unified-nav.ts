import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  Heart,
  Home,
  Share2,
  Sparkles,
  Target,
  UserCircle,
} from "lucide-react";
import type { LearnerSituation } from "@/lib/apprenant/learner-situation";

export type UnifiedNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pastille numérique (infos manquantes, livret à remplir…) */
  badgeCount?: number;
  /** Point framboise Care */
  careDot?: boolean;
  /** Byound Care actif */
  careActive?: boolean;
  /** Action spéciale (copie le lien /p/…) */
  action?: "share-profile";
};

export type UnifiedNavGroup = {
  id: string;
  label: string | null;
  items: UnifiedNavItem[];
};

const HREF = {
  home: "/dashboard/apprenant",
  parcours: "/dashboard/apprenant/parcours",
  competences: "/dashboard/apprenant/skills",
  tests: "/dashboard/apprenant/tests",
  opportunites: "/dashboard/apprenant/opportunites",
  care: "/dashboard/apprenant/care",
  profil: "/dashboard/apprenant/profil",
  planning: "/dashboard/apprenant/planning",
  entreprise: "/dashboard/apprenant/entreprise",
  livret: "/dashboard/apprenant/livret",
} as const;

/**
 * Menu unifié Lot 2 — un seul espace, adapté à la situation.
 * Les pages Lot 3–5 réutilisent ces hrefs ; stubs redirigent si besoin.
 */
export function buildUnifiedLearnerNav(input: {
  situation: LearnerSituation;
  showAlternanceNav: boolean;
  profileMissingCount?: number;
  livretTodoCount?: number;
}): UnifiedNavGroup[] {
  const profileBadge =
    input.profileMissingCount && input.profileMissingCount > 0
      ? input.profileMissingCount
      : undefined;
  const livretBadge =
    input.livretTodoCount && input.livretTodoCount > 0 ? input.livretTodoCount : undefined;

  const formation: UnifiedNavGroup = {
    id: "formation",
    label: "Ma formation",
    items: [
      { label: "Mon parcours", href: HREF.parcours, icon: BookMarked },
      { label: "Mes compétences", href: HREF.competences, icon: Sparkles },
      { label: "Mes tests", href: HREF.tests, icon: Target },
    ],
  };

  const pourMoi: UnifiedNavGroup = {
    id: "pour-moi",
    label: "Pour moi",
    items: [
      {
        label: "Byound Care",
        href: HREF.care,
        icon: Heart,
        careDot: true,
        careActive: true,
      },
      {
        label: "Mon profil",
        href: HREF.profil,
        icon: UserCircle,
        badgeCount: profileBadge,
      },
      {
        label: "Partager ma page",
        href: "#share-profile",
        icon: Share2,
        action: "share-profile",
      },
    ],
  };

  const home: UnifiedNavGroup = {
    id: "home",
    label: null,
    items: [{ label: "Accueil", href: HREF.home, icon: Home }],
  };

  if (input.showAlternanceNav || input.situation === "apprentice") {
    return [
      home,
      {
        id: "alternance",
        label: "Mon alternance",
        items: [
          { label: "Planning", href: HREF.planning, icon: CalendarDays },
          { label: "Mon entreprise", href: HREF.entreprise, icon: Building2 },
          {
            label: "Livret et absences",
            href: HREF.livret,
            icon: ClipboardList,
            badgeCount: livretBadge,
          },
        ],
      },
      formation,
      pourMoi,
    ];
  }

  // learner / candidate / employee (sans contrat actif)
  return [
    home,
    formation,
    {
      id: "avenir",
      label: "Mon avenir",
      items: [{ label: "Opportunités", href: HREF.opportunites, icon: Briefcase }],
    },
    pourMoi,
  ];
}

export function flattenUnifiedNav(groups: UnifiedNavGroup[]): UnifiedNavItem[] {
  return groups.flatMap((g) => g.items);
}

export function isUnifiedNavItemActive(pathname: string | null, href: string, allHrefs: string[]) {
  if (!pathname) return false;
  if (href.startsWith("#")) return false;
  const longerExists = allHrefs.some(
    (other) =>
      other !== href &&
      other.length > href.length &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
  if (longerExists) return false;
  if (pathname === href) return true;
  if (href === "/dashboard/apprenant") {
    return pathname === "/dashboard/apprenant";
  }
  return pathname.startsWith(`${href}/`);
}

/** Correspondance anciennes apps → nouvelles destinations (redirections). */
export const LEGACY_APP_REDIRECTS: Record<string, string> = {
  "/dashboard/apprenant/profil-comportemental": HREF.tests,
  "/dashboard/apprenant/matching": HREF.opportunites,
  "/dashboard/apprenant/recrutement": HREF.opportunites,
  "/dashboard/apprenant/recrutement/offres": HREF.opportunites,
  "/dashboard/apprenant/formations": HREF.parcours,
};

export { HREF as UNIFIED_HREFS };
