"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import {
  FORMATEUR_NAV_ITEMS,
  FORMATEUR_NAV_SECTIONS,
  resolveFormateurActiveLabel,
  type FormateurNavItem,
} from "@/lib/formateur/formateur-nav";

type FormateurSidebarProps = {
  activeItem?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Nav de l’application active. Sans valeur : menu complet de l’accueil. */
  items?: FormateurNavItem[] | null;
  layout?: "dock" | "sheet";
};

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: FormateurNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`expert-nav-item w-full gap-3 px-3 ${collapsed ? "justify-center px-0" : ""} ${
        active ? "is-active" : "is-idle"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function FormateurSidebar({
  activeItem,
  collapsed = false,
  onToggleCollapse,
  items = null,
  layout = "dock",
}: FormateurSidebarProps) {
  const pathname = usePathname();
  const [initials, setInitials] = useState("?");
  const [displayName, setDisplayName] = useState("Expert");
  const resolvedActive = activeItem || resolveFormateurActiveLabel(pathname);
  const accueil = FORMATEUR_NAV_ITEMS[0];

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
      className={`expert-glass flex shrink-0 flex-col !p-4 ${
        layout === "sheet" ? "min-h-0 w-full flex-1" : `h-full ${collapsed ? "w-[76px]" : "w-[248px]"}`
      }`}
    >
      {onToggleCollapse ? (
        <div className={`mb-3 flex items-center px-1 ${collapsed ? "justify-center" : "justify-end"}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="expert-icon-btn inline-flex !h-8 !w-8"
            aria-label={collapsed ? "Développer le menu" : "Réduire le menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5 [scrollbar-width:thin]">
        <NavLink item={accueil} active={resolvedActive === accueil.label} collapsed={collapsed} />
        {items?.length ? (
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={resolvedActive === item.label || pathname === item.href || pathname?.startsWith(`${item.href}/`)}
                collapsed={collapsed}
              />
            ))}
          </div>
        ) : (
          FORMATEUR_NAV_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              {collapsed ? null : <p className="expert-kicker px-3 pb-1">{section.label}</p>}
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} active={resolvedActive === item.label} collapsed={collapsed} />
              ))}
            </div>
          ))
        )}
      </nav>

      <div className={`mt-3 flex items-center gap-3 px-1 ${collapsed ? "justify-center" : ""}`}>
        <div className="expert-icon-btn inline-flex !h-9 !w-9 text-[12px] font-bold">
          {initials}
        </div>
        {collapsed ? null : (
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[var(--expert-text)]">{displayName}</p>
            <p className="expert-muted truncate text-[11px]">Expert Byound</p>
          </div>
        )}
      </div>
    </aside>
  );
}
