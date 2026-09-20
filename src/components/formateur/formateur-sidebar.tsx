"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { getConnectShellTheme } from "@/lib/apprenant/connect-theme";
import {
  FORMATEUR_NAV_ITEMS,
  resolveFormateurActiveLabel,
} from "@/lib/formateur/formateur-nav";

type FormateurSidebarProps = {
  /** @deprecated Le pathname détermine l'actif ; conservé pour compat. */
  activeItem?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function FormateurSidebar({
  activeItem,
  collapsed = false,
  onToggleCollapse,
}: FormateurSidebarProps) {
  const pathname = usePathname();
  const theme = getConnectShellTheme("edge");
  const [initials, setInitials] = useState("?");
  const [displayName, setDisplayName] = useState("Expert");

  const resolvedActive = activeItem || resolveFormateurActiveLabel(pathname);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id || ignore) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = resolveLearnerDisplayFirstName({
        profileFirstName: profile?.first_name,
        email: profile?.email ?? user.email,
      });
      const lastName = String(profile?.last_name ?? "").trim();
      const fullName = String(profile?.full_name ?? "").trim();
      const name =
        firstName ||
        fullName.split(/\s+/)[0] ||
        String(user.email ?? "Expert").split("@")[0] ||
        "Expert";

      const letterSource = firstName || lastName || fullName || user.email || "?";
      const letters = letterSource
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

      if (!ignore) {
        setDisplayName(name);
        setInitials(letters || "?");
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <aside
      data-connect-sidebar
      className={`${theme.sidebarClass} ${collapsed ? "w-[76px]" : "w-[240px]"}`}
    >
      <div className={`flex shrink-0 items-center gap-2 px-2.5 h-[52px] ${theme.sidebarHeaderBorder}`}>
        {!collapsed ? (
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-white">EDGE</div>
            <p className="text-[9px] tracking-[0.1em] text-white/20">Espace Expert</p>
          </div>
        ) : (
          <div className={theme.brandCollapsedClass}>E</div>
        )}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={theme.collapseBtnClass}
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      {!collapsed ? (
        <div className="px-2 pt-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${theme.profileBorder} ${theme.profileAvatarBg} ${theme.profileInitialClass}`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className={theme.profileNameClass}>{displayName}</div>
              <div className={theme.profileRoleClass}>Expert EDGE</div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.03] px-3 py-2 text-sm text-white/50">
            <Search className="h-3.5 w-3.5 shrink-0 text-white/35" />
            <input
              type="text"
              placeholder="Rechercher…"
              className="w-full bg-transparent text-[12px] text-white/70 outline-none placeholder:text-white/30"
            />
          </div>
        </div>
      ) : null}

      <nav
        className={`min-h-0 flex-1 overflow-y-auto py-2 ${
          collapsed ? "px-1.5" : "px-2"
        } [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]`}
      >
        <div className="space-y-0.5">
          {FORMATEUR_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === resolvedActive;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group relative flex w-full items-center rounded-xl text-[13px] font-medium transition ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                } ${isActive ? theme.navActiveClass : theme.navInactiveClass}`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? theme.navIconActive : theme.navIconInactive}`} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {!collapsed ? (
        <div className={theme.sidebarFooterClass}>
          <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
            Contenu organisation
          </p>
        </div>
      ) : null}
    </aside>
  );
}
