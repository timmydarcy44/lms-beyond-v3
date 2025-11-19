"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HardDrive,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  Settings,
  Store,
  Users,
  X,
  GraduationCap,
  Layers,
  BookOpen,
  ClipboardList,
  ListChecks,
  MessageCircle,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BeyondWordmark } from "@/components/ui/beyond-wordmark";
import { BeyondLogo } from "@/components/ui/beyond-logo";
import Image from "next/image";
import { BeyondCareSidebarWrapper } from "@/components/beyond-care/beyond-care-sidebar-wrapper";
import { BeyondNoteSidebarWrapper } from "@/components/beyond-note/beyond-note-sidebar-wrapper";
import { useCommunityConversations } from "@/hooks/use-community-conversations";
import { useUserRole } from "@/hooks/use-user-role";
import { databaseToFrontendRole, type DatabaseRole } from "@/lib/utils/role-mapping";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  organizationLogo?: string | null;
}

export const Sidebar = ({ isOpen, onToggle, organizationLogo }: SidebarProps) => {
  const pathname = usePathname();
  const isFormateurArea = pathname?.startsWith("/dashboard/formateur");
  const isTutorArea = pathname?.startsWith("/dashboard/tuteur");
  const isBeyondCareArea = pathname?.includes("beyond-care");
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const unreadMessages = useCommunityConversations((state) => state.unreadTotal);
  const { data: userRoleDB, isLoading: isLoadingRole } = useUserRole();

  // Debug: log unread messages count
  useEffect(() => {
    if (unreadMessages > 0) {
      console.log("[sidebar] Unread messages count:", unreadMessages);
    }
  }, [unreadMessages]);

  // Convertir le rôle DB (anglais) en rôle frontend (français)
  // Le hook useUserRole retourne le rôle de la DB (instructor, student, etc.)
  let roleForNav: "formateur" | "apprenant" | "admin" | "tuteur";
  
  if (userRoleDB) {
    // Convertir le rôle DB en rôle frontend
    roleForNav = databaseToFrontendRole(userRoleDB as DatabaseRole);
    console.log("[sidebar] User role from DB:", userRoleDB, "→ Frontend:", roleForNav);
  } else if (!isLoadingRole) {
    // Fallback basé sur le pathname seulement si le rôle n'est pas encore chargé
    // Mais on évite de changer le rôle si on est en train de charger
    if (isTutorArea) {
      roleForNav = "tuteur";
    } else if (isFormateurArea) {
      roleForNav = "formateur";
    } else {
      roleForNav = "apprenant";
    }
    console.log("[sidebar] Using pathname-based fallback role:", roleForNav, "pathname:", pathname);
  } else {
    // Pendant le chargement, utiliser le pathname comme fallback temporaire
    if (isTutorArea) {
      roleForNav = "tuteur";
    } else if (isFormateurArea) {
      roleForNav = "formateur";
    } else {
      roleForNav = "apprenant";
    }
  }

  const isInstructor = roleForNav === "formateur";
  const isTutorRole = roleForNav === "tuteur";
  const isAdminRole = roleForNav === "admin";

  const navItems = useMemo(() => {
    // Si le rôle n'est pas encore chargé, retourner un tableau vide pour éviter les liens incorrects
    // Le fallback basé sur le pathname sera utilisé pour déterminer le rôle temporairement
    if (isLoadingRole && !userRoleDB) {
      console.log("[sidebar] Role is loading, using pathname-based navigation items");
    }

    if (isTutorRole) {
      return [
        { label: "Mes alternants", icon: Users, href: "/dashboard/tuteur" },
        { label: "Formulaires", icon: ClipboardList, href: "/dashboard/tuteur/formulaires" },
        { label: "Missions", icon: ListChecks, href: "/dashboard/tuteur/missions" },
        { label: "To-Do List", icon: CheckSquare, href: "/dashboard/tuteur/todo" },
        { label: "Messagerie", icon: MessageCircle, href: "/dashboard/communaute" },
        { label: "No School", icon: Store, href: "/dashboard/catalogue" },
        { label: "Ressources", icon: BookOpen, href: "/dashboard/ressources" },
        { label: "Paramètres", icon: Settings, href: "/dashboard/parametres" },
      ];
    }

    const baseItems = [
      {
        label: "Formations",
        icon: GraduationCap,
        href: isInstructor ? "/dashboard/formateur/formations" : "/dashboard/formations",
      },
      {
        label: "Parcours",
        icon: Layers,
        href: isInstructor ? "/dashboard/formateur/parcours" : "/dashboard/parcours",
      },
      // "Mes apprenants" uniquement pour les formateurs
      ...(isInstructor
        ? [
            {
              label: "Mes apprenants",
              icon: Users,
              href: "/dashboard/formateur/apprenants",
            },
          ]
        : []),
      {
        label: "Ressources",
        icon: BookOpen,
        href: isInstructor ? "/dashboard/formateur/ressources" : "/dashboard/ressources",
      },
      {
        label: "Drive",
        icon: HardDrive,
        href: isInstructor ? "/dashboard/formateur/drive" : "/dashboard/drive",
        showBadge: isInstructor,
        badgeCount: isInstructor ? 1 : 0,
      },
      {
        label: "Tests",
        icon: PenTool,
        href: isInstructor ? "/dashboard/formateur/tests" : "/dashboard/tests",
      },
      {
        label: "To-Do List",
        icon: CheckSquare,
        href: isInstructor
          ? "/dashboard/formateur/todo"
          : isAdminRole
            ? "/dashboard/admin/todo"
            : "/dashboard/apprenant/todo",
      },
      {
        label: "Messagerie",
        icon: MessageCircle,
        href: "/dashboard/communaute",
      },
      // "Mon compte" et "Messagerie" supprimés pour tous (déjà dans le header)
      // "Paramètres" supprimé de la sidebar (sera dans le header)
      // "No School" retiré pour les formateurs et apprenants (réservé aux admin et tuteurs)
      ...(isInstructor || (!isAdminRole && !isTutorRole) ? [] : [
        {
          label: "No School",
          icon: Store,
          href: "/dashboard/catalogue",
        },
      ]),
    ];

    return baseItems;
  }, [isInstructor, isTutorRole, isAdminRole, isLoadingRole, userRoleDB]);

  // Ajouter Beyond Care après No School si l'accès est disponible
  // (sera géré par le composant BeyondCareSidebarWrapper qui vérifie l'accès)

  // Déterminer le rôle pour Beyond Care et Beyond Note
  const beyondCareRole =
    roleForNav === "admin" ? "admin" : roleForNav === "formateur" ? "formateur" : "apprenant";
  const beyondNoteRole =
    roleForNav === "admin" ? "admin" : roleForNav === "formateur" ? "formateur" : "apprenant";

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            key="sidebar-mobile"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-72 md:hidden",
              isBeyondCareArea
                ? "bg-[#c91459] text-white shadow-[0_25px_50px_rgba(201,20,89,0.35)] rounded-e-3xl"
                : isLight
                  ? "bg-white shadow-2xl shadow-slate-200/60 rounded-e-3xl"
                  : "bg-[#252525] shadow-xl shadow-black/50 rounded-e-3xl",
            )}
          >
            <div className="flex h-full flex-col py-10 pl-8 pr-6">
              <div className="mb-12 flex items-center justify-between pr-2">
                {organizationLogo ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-12 w-12">
                      <Image
                        src={organizationLogo}
                        alt="Logo organisation"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[10px] text-white/50">Powered by Beyond</span>
                  </div>
                ) : isOpen ? (
                  <BeyondWordmark
                    size="md"
                    className={cn(
                      isLight ? "text-slate-900" : "text-white",
                    )}
                  />
                ) : (
                  <BeyondLogo size="md" className={isLight ? "text-slate-900" : "text-white"} />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    isLight ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/10",
                  )}
                  onClick={onToggle}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1 px-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                  const isCatalogue = item.label === "No School";
                  const isMessaging = item.label === "Messagerie";
                  const displayUnread = isMessaging ? unreadMessages : 0;
                  return (
                    <div key={item.label}>
                      <Link href={item.href} prefetch={false}>
                        <div
                          className={cn(
                            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isBeyondCareArea
                              ? isActive
                                ? "bg-white/20 text-white shadow-[0_12px_24px_rgba(255,255,255,0.08)]"
                                : "text-white/80 hover:bg-white/10 hover:text-white"
                              : isLight
                                ? isActive
                                  ? "bg-slate-100 text-slate-900"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                : isActive
                                  ? "bg-white/10 text-white"
                                  : "text-white/70 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isBeyondCareArea
                                ? isActive
                                  ? "text-white"
                                  : "text-white/75 group-hover:text-white"
                                : isLight 
                                  ? isActive 
                                    ? "text-slate-700" 
                                    : "text-slate-500 group-hover:text-slate-700"
                                  : isActive
                                    ? "text-white"
                                    : "text-white/60 group-hover:text-white",
                            )}
                          />
                          <div className="flex flex-1 items-center gap-2">
                            <span
                              className={cn(
                                "transition-opacity duration-300",
                                isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                              )}
                            >
                              {item.label}
                            </span>
                            {displayUnread > 0 && (
                              <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-md ring-1 ring-white/20">
                                {displayUnread > 99 ? "99+" : displayUnread}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                      {/* Beyond Care - conditionnel, juste après No School */}
                      {isCatalogue && !isTutorArea && (
                        <>
                          <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} />
                          <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} />
                        </>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "hidden md:flex md:flex-col md:gap-6 md:transition-all md:duration-300 md:ease-in-out",
          "md:h-full md:text-white",
          isOpen ? "md:w-72" : "md:w-20",
          isBeyondCareArea
            ? "bg-[#c91459] text-white shadow-[0_30px_60px_rgba(201,20,89,0.25)] rounded-e-[2.5rem]"
            : "rounded-e-[2.5rem]"
        )}
        style={
          isBeyondCareArea
            ? undefined
            : {
                backgroundColor: 'transparent',
                background: 'none',
              }
        }
      >
        <div
          className={cn(
            "flex items-center px-4 pt-8 pb-6",
            isOpen ? "justify-between" : "justify-center",
          )}
        >
          {isOpen ? (
            organizationLogo ? (
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="relative h-12 w-12">
                  <Image
                    src={organizationLogo}
                    alt="Logo organisation"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] text-white/50">Powered by Beyond</span>
              </div>
            ) : (
              <BeyondWordmark
                size="md"
                className={cn(
                  isBeyondCareArea
                    ? "text-white"
                    : isLight
                      ? "text-slate-900"
                      : "text-white",
                )}
              />
            )
          ) : (
            <BeyondLogo size="md" className={isBeyondCareArea ? "text-white" : isLight ? "text-slate-900" : "text-white"} />
          )}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              isBeyondCareArea
                ? "text-white hover:bg-white/15"
                : isLight
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-white hover:bg-white/10",
            )}
            onClick={onToggle}
            aria-label={isOpen ? "Réduire la navigation" : "Déployer la navigation"}
          >
            {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const isCatalogue = item.label === "No School";
            const isMessaging = item.label === "Messagerie";
            const baseBadge = item.badgeCount ?? 0;
            const showBadge = isMessaging ? unreadMessages : baseBadge;
            return (
              <div key={item.label}>
                <Link href={item.href} title={item.label} className="relative" prefetch={false}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isBeyondCareArea
                          ? isActive
                            ? "bg-white/15 text-white shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                          : isLight
                            ? isActive
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            : isActive
                              ? "bg-white/10 text-white backdrop-blur-sm"
                              : "text-white/70 hover:bg-white/5 hover:text-white",
                        !isOpen && "justify-center px-0",
                      )}
                    >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isBeyondCareArea
                          ? isActive
                            ? "text-white"
                            : "text-white/75 group-hover:text-white"
                          : isLight 
                            ? isActive 
                              ? "text-slate-700" 
                              : "text-slate-500 group-hover:text-slate-700"
                            : isActive
                              ? "text-white"
                              : "text-white/60 group-hover:text-white",
                      )}
                    />
                    {!isOpen && showBadge ? (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-gray-900">
                        {showBadge > 9 ? "9+" : showBadge}
                      </span>
                    ) : null}
                    {isOpen ? (
                      <div
                        className={cn(
                          "relative flex flex-1 items-center gap-2 transition-opacity duration-300",
                          isOpen ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <span className="flex-1">{item.label}</span>
                        {showBadge ? (
                          <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-md ring-1 ring-white/20">
                            {showBadge > 99 ? "99+" : showBadge}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Link>
                {/* Beyond Care et Beyond Note - conditionnels, juste après No School */}
                {isCatalogue && !isTutorArea && (
                  <>
                    <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} />
                    <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} />
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {isOpen ? (
          <div className="mt-auto space-y-4 px-4 pb-8">
            <ThemeToggle
              className={cn(
                "w-full justify-center",
                isBeyondCareArea
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : isLight
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                    : "border-white/10 bg-white/5 text-white hover:bg-white/10",
              )}
            />
            <form action="/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className={cn(
                  "w-full rounded-full border text-sm font-semibold",
                  isBeyondCareArea
                    ? "border-white/25 text-white hover:bg-white/15"
                    : isLight
                      ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                      : "border-white/10 text-white hover:bg-white/10",
                )}
              >
                Déconnexion
              </Button>
            </form>
          </div>
        ) : (
          <div className="mt-auto flex flex-col items-center gap-3 pb-6">
            <ThemeToggle
              showLabel={false}
              className={cn(
                "rounded-full",
                isBeyondCareArea
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : isLight
                    ? "border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
                    : "border-white/10 bg-white/5 text-white",
              )}
            />
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "rounded-full border",
                isBeyondCareArea
                  ? "border-white/25 text-white hover:bg-white/15"
                  : isLight
                    ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                    : "border-white/10 text-white hover:bg-white/10",
              )}
              onClick={onToggle}
              aria-label="Déployer la navigation"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </Button>
          </div>
        )}
      </aside>
    </>
  );
};


