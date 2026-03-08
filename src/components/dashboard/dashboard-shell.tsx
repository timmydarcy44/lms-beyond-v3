"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { useTheme } from "next-themes";

import { Sidebar } from "@/components/layout/sidebar";
import {
  DashboardHeader,
  type DashboardBreadcrumb,
} from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { getFirstName } from "@/lib/utils/user-name";
import { MessageNotificationsWatcher } from "@/components/messaging/message-notifications-watcher";

type DashboardShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  initialCollapsed?: boolean;
  firstName?: string | null;
  email?: string | null;
  compactHeader?: boolean; // Mode compact pour réduire le header
  organizationLogo?: string | null;
  forcedTheme?: "light" | "dark";
  className?: string;
  mainClassName?: string;
};

const getDesktopMatch = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;

export const DashboardShell = ({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  initialCollapsed = false,
  firstName,
  email,
  compactHeader = false,
  organizationLogo,
  forcedTheme,
  className,
  mainClassName,
}: DashboardShellProps) => {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const isLight = resolvedTheme === "light";
  const learnerPrefixes = [
    "/dashboard/apprenant",
    "/dashboard/student/learning/formations",
    "/dashboard/student/learning/parcours",
    "/dashboard/ressources",
    "/dashboard/student/learning/tests",
    "/dashboard/apprenant/todo",
    "/dashboard/student/tools/drive",
    "/dashboard/beyond-care",
    "/dashboard/beyond-connect",
    "/dashboard/catalogue",
    "/catalog",
  ];
  const isLearnerSurface = learnerPrefixes.some((prefix) => pathname?.startsWith(prefix));
  const isBeyondCareArea = pathname?.includes("beyond-care");
  const effectiveTheme =
    forcedTheme ??
    (isBeyondCareArea ? "light" : isLight ? "light" : "dark");
  const useDarkBackground = effectiveTheme === "dark";
  const useSidebar = !isLearnerSurface;
  
  // Initialiser avec false pour éviter les problèmes d'hydratation
  // On mettra à jour après le montage dans useEffect
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const matches = getDesktopMatch();
    setIsDesktop(matches);
    // Mettre à jour isOpen seulement après le montage
    if (matches) {
      setIsOpen(initialCollapsed ? false : true);
    } else {
      setIsOpen(false);
    }
  }, [initialCollapsed]);

  useEffect(() => {
    if (!isMounted) return;
    
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handler = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      setIsOpen((prev) => {
        if (event.matches) {
          return initialCollapsed ? prev : true;
        }
        return false;
      });
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [initialCollapsed, isMounted]);

  // Afficher "Bonjour (prénom)" au lieu du titre
  const firstNameDisplay = getFirstName(firstName ?? null, email ?? null);
  const displayTitle = firstName ? `Bonjour ${firstNameDisplay}` : (title ?? breadcrumbs[breadcrumbs.length - 1]?.label ?? "Dashboard");
  const displaySubtitle =
    subtitle ??
    (breadcrumbs.length > 1
      ? `Vous êtes dans ${breadcrumbs.map((crumb) => crumb.label).join(" › ")}`
      : "Bienvenue sur votre espace de pilotage.");

  const sidebarWidth = useSidebar
    ? isDesktop
      ? isOpen
        ? "18rem"
        : "5rem"
      : "0"
    : "0";

  return (
    <div
      className={cn(
        "flex min-h-screen transition-colors relative overflow-hidden",
        className,
        isBeyondCareArea
          ? "bg-white text-slate-900"
          : useDarkBackground
            ? "text-white"
            : "bg-slate-50 text-slate-900",
      )}
      style={
        useDarkBackground
          ? {
              backgroundColor: 'transparent',
            }
          : undefined
      }
    >
      <MessageNotificationsWatcher />
      {/* Fond avec gradient bleu et formes abstraites - appliqué partout */}
      {useDarkBackground && (
        <>
          {/* Gradient de base noir satiné */}
          <div 
            className="fixed inset-0 -z-10"
            style={{
              background: 'linear-gradient(130deg, #050505 0%, #0b0b0b 45%, #111111 100%)',
            }}
          />
          {/* Halos subtils */}
          <div 
            className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(148, 163, 184, 0.28) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed top-1/3 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(209, 213, 219, 0.22) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-12 blur-2xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(148, 163, 184, 0.2) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-2xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(226, 232, 240, 0.16) 0%, transparent 70%)',
            }}
          />
          {/* Formes géométriques subtiles */}
          <div 
            className="fixed top-0 left-0 w-64 h-64 opacity-5 -z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, transparent 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
          <div 
            className="fixed bottom-0 right-0 w-80 h-80 opacity-4 -z-10"
            style={{
              background: 'linear-gradient(45deg, transparent 0%, rgba(209, 213, 219, 0.08) 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
        </>
      )}
      {/* Sidebar intégrée */}
      {useSidebar ? (
        <>
          <Sidebar
            isOpen={isOpen}
            onToggle={() => setIsOpen((prev) => !prev)}
            organizationLogo={organizationLogo}
            forcedTheme={effectiveTheme}
          />

          {!isDesktop && isOpen ? (
            <button
              type="button"
              aria-label="Fermer la navigation"
              className="fixed inset-0 z-30 bg-black/60 md:hidden"
              onClick={() => setIsOpen(false)}
            />
          ) : null}
        </>
      ) : null}

      <div 
        className="flex flex-1 flex-col relative transition-[margin-left] duration-300 ease-in-out min-w-0"
        style={{
          marginLeft: sidebarWidth,
          backgroundColor: isBeyondCareArea ? "#ffffff" : useDarkBackground ? "transparent" : undefined,
          ["--sidebar-width" as string]: sidebarWidth,
        }}
      >
        {useSidebar ? (
          <DashboardHeader
            title={displayTitle}
            subtitle={displaySubtitle}
            breadcrumbs={breadcrumbs}
            onToggleSidebar={
              useSidebar && !isDesktop ? () => setIsOpen((prev) => !prev) : undefined
            }
            isSidebarOpen={useSidebar ? (isDesktop ? true : isOpen) : false}
            compact={compactHeader}
            forcedTheme={effectiveTheme}
          />
        ) : null}
        <main
          className={cn(
            "relative flex-1 overflow-x-hidden overflow-y-auto px-4 pb-16 md:px-10 transition-colors w-full",
            mainClassName,
            isLearnerSurface ? "pt-0 md:pt-0 apprenant-theme" : "pt-8",
            !isDesktop && isOpen ? "blur-sm" : "",
            useDarkBackground ? "bg-transparent" : "bg-slate-50",
          )}
          style={
            useDarkBackground
              ? {
                  backgroundColor: 'transparent',
                }
              : undefined
          }
        >
          <div className="space-y-12 relative z-10 w-full max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};


