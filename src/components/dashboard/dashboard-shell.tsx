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
}: DashboardShellProps) => {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const isLight = resolvedTheme === "light";
  const isApprenantDashboard = pathname?.startsWith("/dashboard/apprenant");
  const isBeyondCareArea = pathname?.includes("beyond-care");
  
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

  const sidebarWidth = isDesktop ? (isOpen ? "18rem" : "5rem") : "0";

  return (
    <div
      className={cn(
        "flex min-h-screen transition-colors relative overflow-hidden",
        isBeyondCareArea
          ? "bg-white text-slate-900"
          : isLight
            ? "bg-slate-50 text-slate-900"
            : "text-white",
      )}
      style={
        !isLight && !isBeyondCareArea
          ? {
              backgroundColor: 'transparent',
            }
          : undefined
      }
    >
      <MessageNotificationsWatcher />
      {/* Fond avec gradient bleu et formes abstraites - appliqué partout */}
      {!isLight && !isBeyondCareArea && (
        <>
          {/* Gradient de base bleu-gris inspiré Revolut */}
          <div 
            className="fixed inset-0 -z-10"
            style={{
              background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 30%, #0f172a 60%, #0a0f1a 100%)',
            }}
          />
          {/* Formes abstraites - cercles dégradés avec blur */}
          <div 
            className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed top-1/3 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-12 blur-2xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
            }}
          />
          <div 
            className="fixed bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-2xl -z-10"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            }}
          />
          {/* Formes géométriques subtiles */}
          <div 
            className="fixed top-0 left-0 w-64 h-64 opacity-5 -z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
          <div 
            className="fixed bottom-0 right-0 w-80 h-80 opacity-4 -z-10"
            style={{
              background: 'linear-gradient(45deg, transparent 0%, rgba(139, 92, 246, 0.08) 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
        </>
      )}
      {/* Sidebar intégrée - transparente pour laisser voir le fond global */}
      <div 
        className={cn(
          "fixed top-0 left-0 z-30 h-screen transition-all duration-300",
          isBeyondCareArea
            ? "bg-[#c91459] text-white shadow-[8px_0_30px_rgba(201,20,89,0.25)] rounded-tr-[3.5rem] rounded-br-[3.5rem] overflow-hidden"
            : isLight 
              ? "bg-slate-50" 
              : "bg-transparent",
        )}
        style={{
          width: sidebarWidth,
        }}
      >
        <Sidebar isOpen={isOpen} onToggle={() => setIsOpen((prev) => !prev)} organizationLogo={organizationLogo} />
      </div>

      {!isDesktop && isOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div 
        className="flex flex-1 flex-col relative transition-[margin-left] duration-300 ease-in-out min-w-0"
        style={{
          marginLeft: sidebarWidth,
          backgroundColor: isBeyondCareArea ? "#ffffff" : !isLight ? "transparent" : undefined,
        }}
      >
        <DashboardHeader
          title={displayTitle}
          subtitle={displaySubtitle}
          breadcrumbs={breadcrumbs}
          onToggleSidebar={isDesktop ? undefined : () => setIsOpen((prev) => !prev)}
          isSidebarOpen={isDesktop ? true : isOpen}
          compact={compactHeader}
        />
        <main
          className={cn(
            "relative flex-1 overflow-x-hidden overflow-y-auto px-4 pb-16 md:px-10 transition-colors w-full",
            isApprenantDashboard ? "pt-4" : "pt-8",
            !isDesktop && isOpen ? "blur-sm" : "",
            isLight ? "bg-slate-50" : "bg-transparent",
          )}
          style={
            !isLight
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


