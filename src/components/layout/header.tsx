"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserCircle2,
  MessageCircle,
  Settings,
  Menu,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DashboardBreadcrumb = {
  label: string;
  href?: string;
};

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  compact?: boolean; // Mode compact pour réduire l'affichage
  forcedTheme?: "light" | "dark";
};

export const DashboardHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  onToggleSidebar,
  isSidebarOpen = true,
  compact = false,
  forcedTheme,
}: DashboardHeaderProps) => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const pathname = usePathname();
  const isBeyondCareArea = pathname?.includes("beyond-care");
  const desiredTheme = forcedTheme ?? (isLight ? "light" : "dark");
  const useDark = desiredTheme === "dark" && !isBeyondCareArea;
  const showTitle = Boolean(title && title.trim().length > 0);
  const trail =
    breadcrumbs.length > 0
      ? breadcrumbs
      : showTitle
        ? [{ label: title }]
        : [];
  const showBreadcrumbs = !compact && trail.length > 0;

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-30 flex flex-col gap-2 px-4 py-2 backdrop-blur-sm transition-colors md:flex-row md:items-center md:justify-between md:px-6",
        compact && "py-1.5 gap-1 md:py-2",
        isBeyondCareArea
          ? "border-b border-[#f6cada] bg-white/95 text-[#c91459]"
          : useDark
            ? "bg-transparent text-white"
            : "border-b border-slate-200 bg-white/90 text-slate-900",
      )}
      style={
        useDark
          ? {
              backgroundColor: 'transparent',
              border: 'none',
            }
          : undefined
      }
    >
      <div className="flex flex-1 items-start gap-3 md:items-center">
        <div className="md:hidden" />

        <div className={cn("space-y-2", compact && "space-y-1")}>
          {showBreadcrumbs && (
            <nav
              className={cn(
                "flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em]",
                isBeyondCareArea
                  ? "text-[#c91459]/60"
                  : useDark
                    ? "text-white/40"
                    : "text-slate-400",
              )}
            >
              {trail.map((crumb, index) => {
                const isLast = index === trail.length - 1;
                return (
                  <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className={cn(
                          "transition",
                          isBeyondCareArea
                            ? "hover:text-[#c91459]"
                            : useDark
                              ? "hover:text-white/70"
                              : "hover:text-slate-600",
                        )}
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          isLast
                            ? isBeyondCareArea
                            ? "text-[#c91459]"
                            : useDark
                              ? "text-white/70"
                              : "text-slate-600"
                            : "",
                        )}
                      >
                        {crumb.label}
                      </span>
                    )}
                    {isLast ? null : (
                      <ChevronRight
                        className={cn(
                          "h-3 w-3",
                          isBeyondCareArea
                            ? "text-[#f1c2d2]"
                            : useDark
                              ? "text-white/30"
                              : "text-slate-300",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </nav>
          )}
          <div className={cn("space-y-1", compact && "space-y-0.5")}>
            {showTitle ? (
              <h1
                className={cn(
                  "text-2xl font-semibold md:text-3xl",
                  compact && "text-lg md:text-xl",
                  isBeyondCareArea
                    ? "text-[#c91459]"
                    : useDark
                      ? "text-white"
                      : "text-slate-900",
                )}
              >
                {title}
              </h1>
            ) : null}
            {subtitle && !compact && showTitle && (
              <p
                className={cn(
                  "text-sm",
                  isBeyondCareArea
                    ? "text-slate-500"
                    : useDark
                      ? "text-white/60"
                      : "text-slate-500",
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bouton burger mobile - toujours visible sur mobile */}
        {onToggleSidebar ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "md:hidden",
            isBeyondCareArea
              ? "text-[#c91459] hover:bg-[#f9d7e5]"
              : useDark
                ? "text-white hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100",
            )}
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        ) : null}
        <div
          className={cn(
            "hidden items-center gap-2 rounded-full border px-3 py-1.5 text-sm md:flex backdrop-blur-sm",
            isBeyondCareArea
              ? "border-[#f6cada] bg-white text-[#c91459]"
              : useDark
                ? "border-white/10 bg-white/5 text-white/60"
                : "border-slate-200 bg-white text-slate-500",
          )}
        >
          <Search
            className={cn(
              "h-4 w-4",
              isBeyondCareArea
                ? "text-[#c91459]"
                : useDark
                  ? "text-white/60"
                  : "text-slate-400",
            )}
          />
          <Input
            placeholder="Rechercher formations, parcours..."
            className={cn(
              "h-auto border-0 bg-transparent p-0 text-sm focus-visible:ring-0",
              isBeyondCareArea
                ? "text-[#c91459] placeholder:text-[#d8769b]"
                : useDark
                  ? "text-white placeholder:text-white/50"
                  : "text-slate-600 placeholder:text-slate-400",
            )}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden md:flex",
            isBeyondCareArea
              ? "text-[#c91459] hover:bg-[#f9d7e5]"
              : useDark
                ? "text-white hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            "hidden md:flex",
            isBeyondCareArea
              ? "text-[#c91459] hover:bg-[#f9d7e5]"
              : useDark
                ? "text-white hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100",
          )}
          aria-label="Paramètres"
        >
          <Link href="/dashboard/parametres">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className={cn(
            isBeyondCareArea
              ? "text-[#c91459] hover:bg-[#f9d7e5]"
              : useDark
                ? "text-white hover:bg-white/10"
                : "text-slate-600 hover:bg-slate-100",
          )}
          aria-label="Mon compte"
        >
          <Link href="/dashboard/mon-compte">
            <UserCircle2 className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </header>
    <Link
      href="/dashboard/student/community"
      className="md:hidden"
      aria-label="Ouvrir la messagerie"
    >
      <span className="sr-only">Messagerie</span>
      <span className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] via-[#4F46E5] to-[#9333EA] shadow-[0_18px_35px_rgba(79,70,229,0.45)] transition-transform hover:scale-105">
        <MessageCircle className="h-6 w-6 text-white" />
      </span>
    </Link>
    </>
  );
};


