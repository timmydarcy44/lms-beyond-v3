"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  Sparkles,
  Store,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/super" },
  { label: "Organisations", icon: Building2, href: "/super/organisations" },
  { label: "Créer Organisation", icon: Building2, href: "/super/organisations/new" },
  { label: "Utilisateurs", icon: Users, href: "/super/utilisateurs" },
  { label: "Créer Utilisateur", icon: UserPlus, href: "/super/utilisateurs/new" },
  { label: "Statistiques", icon: BarChart3, href: "/super/statistiques" },
  { label: "IA", icon: Sparkles, href: "/super/ia" },
  {
    label: "No School",
    icon: Store,
    children: [
      { label: "Voir mon catalogue", icon: Store, href: "/super/catalogue" },
    ],
  },
  { label: "Paramètres", icon: Settings, href: "/super/parametres" },
];


export function SuperAdminSidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  
  // Debug: vérifier que l'item IA est présent
  useEffect(() => {
    console.log("=== SUPER ADMIN SIDEBAR DEBUG ===");
    console.log("[SuperAdminSidebar] NAV_ITEMS:", NAV_ITEMS);
    const iaItem = NAV_ITEMS.find((item) => item.label === "IA");
    console.log("[SuperAdminSidebar] IA item exists:", !!iaItem);
    console.log("[SuperAdminSidebar] IA item:", iaItem);
    console.log("[SuperAdminSidebar] Total items:", NAV_ITEMS.length);
    console.log("[SuperAdminSidebar] All labels:", NAV_ITEMS.map((i) => i.label));
    console.log("=================================");
  }, []);
  
  // Ouvrir automatiquement le menu No School si on est sur une page du catalogue
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (pathname?.startsWith("/super/catalogue")) {
      initial.add("No School");
    }
    return initial;
  });

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) {
      return pathname === item.href || pathname?.startsWith(item.href + "/");
    }
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive = isItemActive(item);

    if (hasChildren) {
      return (
        <div key={`parent-${item.label}`}>
          <button
            type="button"
            onClick={() => toggleExpand(item.label)}
            className={cn(
              "group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
              isActive
                ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                : "text-white/60 hover:bg-white/10 hover:text-white",
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-yellow-400" : "text-white/50")} />
              {open && <span>{item.label}</span>}
            </div>
            {open && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )
            )}
          </button>
          {open && isExpanded && item.children && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                return (
                  <Link
                    key={child.href}
                    href={child.href || "#"}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isChildActive
                        ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                        : "text-white/50 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <ChildIcon className={cn("h-4 w-4 shrink-0", isChildActive ? "text-yellow-400" : "text-white/40")} />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Debug pour l'item IA
    if (item.label === "IA") {
      console.log("[SuperAdminSidebar] Rendering IA Link:", { href: item.href, isActive, open });
    }

    return (
      <Link
        key={item.href || item.label}
        href={item.href || "#"}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
          isActive
            ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
            : "text-white/60 hover:bg-white/10 hover:text-white",
        )}
        data-testid={`nav-item-${item.label.toLowerCase()}`}
      >
        <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-yellow-400" : "text-white/50")} />
        {open && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-white/10 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] text-white transition-all duration-300",
        open ? "w-[280px]" : "w-[88px]",
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
          aria-label={open ? "Fermer" : "Ouvrir"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {open ? (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wide text-white">Super Admin</span>
              <span className="text-[10px] text-yellow-400/80 uppercase tracking-[0.3em]">Accès Global</span>
            </div>
          </div>
        ) : (
          <Shield className="h-5 w-5 text-yellow-400" />
        )}
      </div>

      <nav className="mt-4 space-y-1 px-3 overflow-y-auto flex-1" key="nav-items-v2">
        {NAV_ITEMS.map((item, index) => {
          // Force render pour debug
          if (item.label === "IA") {
            console.log("[SuperAdminSidebar] Rendering IA item at index", index);
          }
          return (
            <div key={`nav-item-${index}-${item.label}-${Date.now()}`}>
              {renderNavItem(item)}
            </div>
          );
        })}
      </nav>

      <div className={cn("mt-auto border-t border-white/10 px-4 py-4", open ? "" : "px-2")}>
        {open ? (
          <div className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-3">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-[0.3em]">Accès Complet</p>
            <p className="mt-1 text-[10px] text-white/60">Toutes les données sont accessibles</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
        )}
      </div>
    </aside>
  );
}

