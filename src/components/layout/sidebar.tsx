"use client";

import { useMemo } from "react";
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
import { BeyondConnectSidebarWrapper } from "@/components/beyond-connect/beyond-connect-sidebar-wrapper";
import { useCommunityConversations } from "@/hooks/use-community-conversations";
import { useUserRole } from "@/hooks/use-user-role";
import { databaseToFrontendRole, type DatabaseRole, type FrontendRole } from "@/lib/utils/role-mapping";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  organizationLogo?: string | null;
  forcedTheme?: "light" | "dark";
}

export const Sidebar = ({ isOpen, onToggle, organizationLogo, forcedTheme }: SidebarProps) => {
  const pathname = usePathname();
  const isFormateurArea = pathname?.startsWith("/dashboard/formateur");
  const isTutorArea = pathname?.startsWith("/dashboard/tuteur");
  const isCatalogueSurface = pathname?.startsWith("/catalog");
  const isBeyondCareArea = pathname?.includes("beyond-care");
  const { resolvedTheme } = useTheme();
  const desiredTheme = forcedTheme ?? (resolvedTheme === "light" ? "light" : "dark");
  const isLight = desiredTheme === "light";
  const unreadMessages = useCommunityConversations((state) => state.unreadTotal);
  const { data: userRoleDB, isLoading: isLoadingRole } = useUserRole();

  const roleForNav = userRoleDB ? databaseToFrontendRole(userRoleDB as DatabaseRole) : undefined;
  const isInstructor = roleForNav === "formateur";
  const isTutorRole = roleForNav === "tuteur";
  const isAdminRole = roleForNav === "admin";
  const resolvedRoleForNav: FrontendRole = roleForNav ?? "apprenant";
  const connectRole: FrontendRole = resolvedRoleForNav;
  const connectRoleForWrapper: "admin" | "formateur" | "apprenant" =
    connectRole === "admin"
      ? "admin"
      : connectRole === "formateur"
        ? "formateur"
        : "apprenant";

  const navItems = useMemo(() => {
    if (!roleForNav || isLoadingRole) {
      return [];
    }

    if (roleForNav === "tuteur") {
      return [
        { label: "Tableau de bord", icon: Users, href: "/dashboard/tuteur" },
        { label: "Mes missions", icon: ListChecks, href: "/dashboard/tuteur/missions" },
        { label: "To-Do", icon: CheckSquare, href: "/dashboard/tuteur/todo" },
        { label: "Formulaires", icon: ClipboardList, href: "/dashboard/tuteur/formulaires" },
        { label: "Messagerie", icon: MessageCircle, href: "/dashboard/student/community" },
      ];
    }

    const isTrainerOrAdmin = roleForNav === "formateur" || roleForNav === "admin";

    const baseItems = [
      {
        label: "Formations",
        icon: GraduationCap,
        href: isTrainerOrAdmin ? "/dashboard/formateur/formations" : "/dashboard/student/learning/formations",
      },
      {
        label: "Parcours",
        icon: Layers,
        href: isTrainerOrAdmin ? "/dashboard/formateur/parcours" : "/dashboard/student/learning/parcours",
      },
      ...(roleForNav === "formateur"
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
        href: isTrainerOrAdmin ? "/dashboard/formateur/ressources" : "/dashboard/ressources",
      },
      {
        label: "Drive",
        icon: HardDrive,
        href: isTrainerOrAdmin ? "/dashboard/formateur/drive" : "/dashboard/student/tools/drive",
        showBadge: roleForNav === "formateur",
        badgeCount: roleForNav === "formateur" ? 1 : 0,
      },
      {
        label: "Tests",
        icon: PenTool,
        href: isTrainerOrAdmin ? "/dashboard/formateur/tests" : "/dashboard/student/learning/tests",
      },
      {
        label: "To-Do List",
        icon: CheckSquare,
        href:
          roleForNav === "formateur"
            ? "/dashboard/formateur/todo"
            : roleForNav === "admin"
              ? "/dashboard/admin/todo"
              : "/dashboard/apprenant/todo",
      },
      {
        label: "Messagerie",
        icon: MessageCircle,
        href: isTrainerOrAdmin ? "/dashboard/formateur/communaute" : "/dashboard/student/community",
      },
      ...(roleForNav === "admin"
        ? [
            {
              label: "No School",
              icon: Store,
              href: "/dashboard/catalogue",
            },
          ]
        : []),
    ];

    return baseItems;
  }, [isLoadingRole, roleForNav]);

  // Ajouter Beyond Care après No School si l'accès est disponible
  // (sera géré par le composant BeyondCareSidebarWrapper qui vérifie l'accès)

  // Déterminer le rôle pour Beyond Care et Beyond Note
  const beyondCareRole =
    roleForNav === "admin" ? "admin" : roleForNav === "formateur" ? "formateur" : "apprenant";
  const beyondNoteRole =
    roleForNav === "admin" ? "admin" : roleForNav === "formateur" ? "formateur" : "apprenant";

  const learnerApplePrefixes = [
    "/dashboard/apprenant",
    "/dashboard/student/learning/formations",
    "/dashboard/student/learning/parcours",
    "/dashboard/ressources",
    "/dashboard/student/learning/tests",
    "/dashboard/apprenant/todo",
    "/dashboard/todo",
    "/dashboard/student/tools/drive",
    "/dashboard/beyond-care",
    "/dashboard/beyond-connect",
    "/dashboard/catalogue",
    "/dashboard/catalog",
  ];

  const isLearnerAppleSurface =
    pathname ? learnerApplePrefixes.some((prefix) => pathname.startsWith(prefix)) : false;

  const isLearnerApple = (isCatalogueSurface || isLearnerAppleSurface) && !isBeyondCareArea;

  const renderSkeletonNav = (context: "mobile" | "desktop") => {
    const isMobileContext = context === "mobile";
    const collapsed = !isMobileContext && !isOpen;
    const baseClasses = cn(
      "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 animate-pulse",
      collapsed ? "justify-center px-0" : undefined,
      isLearnerApple ? "rounded-[20px]" : "rounded-lg",
      isBeyondCareArea
        ? "bg-white/10"
        : isLearnerApple
          ? "border border-white/10 bg-white/8"
          : isLight
            ? "bg-white/10"
            : "bg-white/[0.08]",
    );

    return Array.from({ length: 6 }).map((_, index) => (
      <div key={`sidebar-skeleton-${context}-${index}`} className={baseClasses}>
        <span
          className={cn(
            "h-9 w-9 flex-shrink-0 rounded-full",
            isBeyondCareArea ? "bg-white/30" : "bg-white/12",
          )}
        />
        {!collapsed ? <span className="h-2.5 flex-1 rounded-full bg-white/12" /> : null}
      </div>
    ));
  };

  const renderNavLinks = (context: "mobile" | "desktop") => {
    const isMobileContext = context === "mobile";
    const collapsed = !isMobileContext && !isOpen;

    if (!navItems.length) {
      return renderSkeletonNav(context);
    }

    return navItems.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
      const isCatalogue = item.label === "No School";
      const badgeValue = item.label === "Messagerie" ? unreadMessages : item.badgeCount ?? 0;

      const linkClasses = cn(
        "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isLearnerApple ? "rounded-[20px]" : "rounded-lg",
        isBeyondCareArea
          ? isActive
            ? "bg-white/15 text-white shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
            : "text-white/80 hover:bg-white/10 hover:text-white"
          : isLearnerApple
            ? cn(
                "border border-white/12 bg-white/6 text-white/80 shadow-[0_35px_120px_-70px_rgba(8,8,24,0.75)]",
                isActive
                  ? "border-white/35 bg-white/12 text-white shadow-[0_45px_140px_-60px_rgba(225,225,255,0.35)]"
                  : "hover:border-white/25 hover:bg-white/9 hover:text-white",
              )
            : isLight
              ? isActive
                ? "bg-white text-slate-900 shadow-[0_18px_32px_-30px_rgba(15,23,42,0.2)]"
                : "text-slate-500 hover:bg-white/80 hover:text-slate-900"
              : isActive
                ? "bg-white/10 text-white backdrop-blur-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white",
        collapsed ? "justify-center px-0" : undefined,
      );

      const iconNode = isLearnerApple ? (
        <span
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all",
            isActive
              ? "border-white/40 bg-white/15 text-white shadow-[0_22px_60px_-36px_rgba(255,255,255,0.55)]"
              : "border-white/20 bg-white/8 text-white/80 shadow-[0_18px_50px_-38px_rgba(8,8,24,0.6)] group-hover:border-white/30 group-hover:bg-white/12 group-hover:text-white",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            isBeyondCareArea
              ? isActive
                ? "text-white"
                : "text-white/75 group-hover:text-white"
              : isLight
                ? isActive
                  ? "text-slate-800"
                  : "text-slate-400 group-hover:text-slate-600"
                : isActive
                  ? "text-white"
                  : "text-white/60 group-hover:text-white",
          )}
        />
      );

      const inlineBadge =
        (isMobileContext || !collapsed) && badgeValue > 0 ? (
          <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-md ring-1 ring-white/20">
            {badgeValue > 99 ? "99+" : badgeValue}
          </span>
        ) : null;

      const collapsedBadge =
        !isMobileContext && collapsed && badgeValue > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-gray-900">
            {badgeValue > 9 ? "9+" : badgeValue}
          </span>
        ) : null;

      return (
        <div key={item.label} className="relative">
          <Link href={item.href} title={item.label} className="relative block" prefetch={false}>
            <div className={linkClasses}>
              {iconNode}
              <div
                className={cn(
                  "flex flex-1 items-center gap-2",
                  collapsed ? "justify-center" : undefined,
                )}
              >
                <span
                  className={cn(
                    "transition-opacity duration-300",
                    collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
                  )}
                >
                  {item.label}
                </span>
                {inlineBadge}
              </div>
            </div>
          </Link>
          {collapsedBadge}
          {!isLearnerApple && isCatalogue && !isTutorArea && (
            <>
              <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} />
              <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} />
            </>
          )}
        </div>
      );
    });
  };

  const renderAppleApps = (context: "mobile" | "desktop") => {
    if (!isLearnerApple || !roleForNav || isLoadingRole) {
      return null;
    }
    return (
      <div className="mt-8 space-y-3">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          Apps
        </p>
        <div className="space-y-2">
          <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} appearance="apple" />
          <BeyondConnectSidebarWrapper isOpen={isOpen} role={connectRoleForWrapper} appearance="apple" />
          <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} appearance="apple" />
        </div>
      </div>
    );
  };

  if (isLearnerApple) {
    const renderAppleNavLinks = (context: "mobile" | "desktop") => {
      const isMobileContext = context === "mobile";
      const collapsed = !isMobileContext && !isOpen;
      if (!navItems.length) {
        return renderSkeletonNav(context);
      }
      return navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
        const badgeValue = item.label === "Messagerie" ? unreadMessages : item.badgeCount ?? 0;

        return (
          <div key={item.label} className="relative">
            <Link href={item.href} title={item.label} className="relative block" prefetch={false}>
              <div
                className={cn(
                  "group flex items-center gap-3 rounded-[26px] border px-4 py-3 text-sm font-medium transition-all duration-200",
                  "border-white/80 bg-white/90 text-slate-600 shadow-[0_35px_110px_-60px_rgba(15,23,42,0.28)] hover:-translate-y-0.5 hover:shadow-[0_45px_120px_-60px_rgba(15,23,42,0.35)] hover:text-slate-900",
                  isActive && "border-white bg-white text-slate-900 shadow-[0_45px_140px_-60px_rgba(15,23,42,0.45)]",
                  collapsed && "justify-center px-0",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 text-slate-500 transition-all duration-200",
                    "shadow-[0_18px_45px_-34px_rgba(15,23,42,0.25)] group-hover:border-slate-300 group-hover:text-slate-700",
                    isActive && "border-slate-300 text-slate-900 shadow-[0_25px_55px_-32px_rgba(15,23,42,0.28)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div
                  className={cn(
                    "flex flex-1 items-center gap-2",
                    collapsed ? "opacity-0 pointer-events-none -translate-x-2" : "opacity-100 translate-x-0",
                    "transition-all duration-200",
                  )}
                >
                  <span className="text-sm">{item.label}</span>
                  {badgeValue > 0 ? (
                    <span className="ml-auto inline-flex min-w-[22px] items-center justify-center rounded-full bg-slate-900/10 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.35)]">
                      {badgeValue > 99 ? "99+" : badgeValue}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
            {!isMobileContext && collapsed && badgeValue > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white shadow-lg ring-2 ring-white">
                {badgeValue > 9 ? "9+" : badgeValue}
              </span>
            ) : null}
          </div>
        );
      });
    };

    const desktopNav = renderAppleNavLinks("desktop");
    const mobileNav = renderAppleNavLinks("mobile");

    return (
      <>
        <AnimatePresence>
          {isOpen ? (
            <motion.aside
              key="sidebar-mobile-apple"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed inset-y-0 left-0 z-40 w-72 rounded-e-[32px] border border-white/90 bg-[#f5f5f7]/95 text-slate-900 backdrop-blur-[40px] md:hidden shadow-[0_55px_140px_-60px_rgba(15,23,42,0.35)]"
            >
              <div className="flex h-full flex-col px-6 py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white bg-white text-slate-900 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.25)]">
                      <BeyondLogo size="sm" className="text-slate-900" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Espace apprenant</p>
                      <p className="text-base font-semibold text-slate-900">Beyond</p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-slate-500 hover:bg-white hover:text-slate-900"
                    onClick={onToggle}
                    aria-label="Fermer la navigation"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="mt-10 flex-1 space-y-4 overflow-y-auto pb-8">
                  <nav className="space-y-3">{mobileNav}</nav>
                  {renderAppleApps("mobile")}
                </div>

                <div className="space-y-3 pt-4">
                  <ThemeToggle className="w-full justify-center rounded-full border border-white bg-white/80 text-slate-700 hover:bg-white" />
                  <form action="/logout" method="POST">
                    <Button
                      type="submit"
                      variant="ghost"
                      className="w-full rounded-full border border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
                    >
                      Déconnexion
                    </Button>
                  </form>
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <aside
          className={cn(
            "hidden md:fixed md:top-0 md:left-0 md:z-30 md:flex md:h-screen md:flex-col md:transition-all md:duration-300 md:ease-in-out",
            isOpen ? "md:w-72" : "md:w-24",
            "rounded-e-[36px] border border-white/90 bg-[#f5f5f7]/95 text-slate-800 backdrop-blur-[50px] shadow-[0_70px_180px_-70px_rgba(15,23,42,0.25)]",
          )}
        >
          <div className={cn("flex items-center px-6 pt-9 pb-7", isOpen ? "justify-between" : "justify-center")}>
            <div
              className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isOpen ? "opacity-100 translate-x-0" : "pointer-events-none opacity-0 -translate-x-4",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white text-slate-900 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.25)]">
                <BeyondLogo size="sm" className="text-slate-900" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Espace apprenant</p>
                <p className="text-base font-semibold text-slate-900">Beyond</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full border border-white/90 text-slate-500 hover:bg-white hover:text-slate-900"
              onClick={onToggle}
              aria-label={isOpen ? "Réduire la navigation" : "Déployer la navigation"}
            >
              {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden px-4">
            <nav className="space-y-3">{desktopNav}</nav>
            {renderAppleApps("desktop")}
          </div>

          <div className="mt-auto space-y-3 px-6 pb-8 pt-6">
            <ThemeToggle className="w-full justify-center rounded-full border border-white bg-white/80 text-slate-700 hover:bg-white" />
            <form action="/logout" method="POST">
              <Button
                type="submit"
                variant="ghost"
                className="w-full rounded-full border border-slate-200 bg-white/90 text-slate-700 hover:bg-white"
              >
                Déconnexion
              </Button>
            </form>
          </div>
        </aside>
      </>
    );
  }

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
              "fixed inset-y-0 left-0 z-40 w-72 rounded-e-3xl md:hidden",
              isBeyondCareArea
                ? "bg-[#c91459] text-white shadow-[0_25px_50px_rgba(201,20,89,0.35)] rounded-e-3xl"
                : isLearnerApple
                  ? "border border-white/15 bg-[#101018]/85 text-white backdrop-blur-[80px] shadow-[0_45px_140px_-60px_rgba(10,10,25,0.8)]"
                  : isLight
                    ? "bg-white/95 text-slate-900 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.45)] border border-white/80 backdrop-blur-2xl"
                    : "border border-white/10 bg-black/85 text-white backdrop-blur-2xl shadow-[0_35px_80px_rgba(0,0,0,0.65)]",
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
                      isLearnerApple ? "text-white" : isLight ? "text-slate-900" : "text-white",
                    )}
                  />
                ) : (
                  <BeyondLogo size="md" className={isLearnerApple ? "text-white" : isLight ? "text-slate-900" : "text-white"} />
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    isLearnerApple
                      ? "text-white/80 hover:bg-white/15 hover:text-white"
                      : isLight
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-white hover:bg-white/10",
                  )}
                  onClick={onToggle}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className={cn("space-y-1 px-3", isLearnerApple && "space-y-6")}>
                <div className="space-y-1">{renderNavLinks("mobile")}</div>
                {isLearnerApple ? (
                  renderAppleApps("mobile")
                ) : (
                  !isTutorArea && !isInstructor && !isAdminRole && (
                    <>
                      <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} />
                      <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} />
                      <BeyondConnectSidebarWrapper isOpen={isOpen} role={connectRoleForWrapper} />
                    </>
                  )
                )}
              </nav>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "hidden md:fixed md:top-0 md:left-0 md:z-30 md:flex md:h-screen md:flex-col md:gap-6 md:transition-all md:duration-300 md:ease-in-out",
          isOpen ? "md:w-72" : "md:w-20",
          isBeyondCareArea
            ? "bg-[#c91459] text-white shadow-[0_30px_60px_rgba(201,20,89,0.25)] rounded-e-[2.5rem]"
            : isLearnerApple
              ? "rounded-e-[2.5rem] border border-white/15 bg-[#0c0c18]/85 text-white backdrop-blur-[90px] shadow-[0_55px_160px_-65px_rgba(8,8,24,0.75)]"
              : isLight
                ? "rounded-e-[2.5rem] text-slate-900"
                : "rounded-e-[2.5rem] border border-white/10 bg-black/75 backdrop-blur-[80px] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]"
        )}
        style={
          isBeyondCareArea
            ? {
                backgroundColor: '#c91459',
                background: '#c91459',
                zIndex: 30,
              }
            : isLearnerApple
              ? {
                  background: 'linear-gradient(155deg, rgba(12,12,26,0.92) 0%, rgba(18,18,34,0.88) 55%, rgba(26,26,44,0.82) 100%)',
                  backdropFilter: 'blur(90px)',
                }
              : isLight
                ? {
                    backgroundColor: 'transparent',
                    background: 'none',
                  }
                : {
                    background: 'linear-gradient(140deg, rgba(18,18,18,0.94) 0%, rgba(12,12,12,0.9) 100%)',
                    backdropFilter: 'blur(60px)',
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
                    : isLearnerApple
                      ? "text-white"
                      : isLight
                        ? "text-slate-900"
                        : "text-white",
                )}
              />
            )
          ) : (
            <BeyondLogo size="md" className={isBeyondCareArea ? "text-white" : isLearnerApple ? "text-white" : isLight ? "text-slate-900" : "text-white"} />
          )}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              isBeyondCareArea
                ? "text-white hover:bg-white/15"
                : isLearnerApple
                  ? "text-white/80 hover:bg-white/15 hover:text-white"
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

        <nav className={cn("flex-1 space-y-1 px-3", isLearnerApple && "space-y-6")}>
          <div className="space-y-1">{renderNavLinks("desktop")}</div>
          {isLearnerApple ? (
            renderAppleApps("desktop")
          ) : (
            !isTutorArea && !isInstructor && !isAdminRole && (
              <>
                <BeyondCareSidebarWrapper isOpen={isOpen} role={beyondCareRole} />
                <BeyondNoteSidebarWrapper isOpen={isOpen} role={beyondNoteRole} />
                <BeyondConnectSidebarWrapper isOpen={isOpen} role={connectRoleForWrapper} />
              </>
            )
          )}
        </nav>

        {isOpen ? (
          <div className="mt-auto space-y-4 px-4 pb-8">
            <ThemeToggle
              className={cn(
                "w-full justify-center",
                isBeyondCareArea
                  ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  : isLearnerApple
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
                    : isLearnerApple
                      ? "border-white/20 text-white hover:bg-white/15"
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
                  : isLearnerApple
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
                  : isLearnerApple
                    ? "border-white/20 text-white hover:bg-white/15"
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


