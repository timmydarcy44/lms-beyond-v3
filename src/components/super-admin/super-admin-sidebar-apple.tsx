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
  DollarSign,
  ChevronDown,
  ChevronUp,
  Palette,
  BookOpen,
  Store,
  Gamepad2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/components/providers/supabase-provider";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  children?: NavItem[];
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/super" },
  {
    label: "Studio de création",
    icon: Palette,
    href: "/super/studio",
    children: [
      { label: "Formations", icon: BookOpen, href: "/super/studio/formations" },
      { label: "Modules", icon: BookOpen, href: "/super/studio/modules" },
    ],
  },
  {
    label: "Organisations",
    icon: Building2,
    href: "/super/organisations",
    children: [
      { label: "Toutes les organisations", icon: Building2, href: "/super/organisations" },
      { label: "Créer une organisation", icon: Building2, href: "/super/organisations/new" },
    ],
  },
  {
    label: "Utilisateurs",
    icon: Users,
    href: "/super/utilisateurs",
    children: [
      { label: "Tous les utilisateurs", icon: Users, href: "/super/utilisateurs" },
      { label: "Créer un utilisateur", icon: UserPlus, href: "/super/utilisateurs/new" },
    ],
  },
  { label: "No School", icon: Store, href: "/super/catalogue" },
  { label: "Voir mon catalogue", icon: Store, href: "/super/catalogue/preview" },
  { label: "Chiffre d'affaires", icon: DollarSign, href: "/super/chiffre-affaires" },
  { label: "Statistiques", icon: BarChart3, href: "/super/statistiques" },
  { label: "Gamification (Demo)", icon: Gamepad2, href: "/super/gamification" },
  { label: "Paramètres", icon: Settings, href: "/super/parametres" },
];

// Agenda uniquement pour contentin.cabinet@gmail.com
const AGENDA_ITEM: NavItem = { label: "Agenda", icon: Calendar, href: "/super/agenda" };

type SuperAdminSidebarAppleProps = {
  open?: boolean;
  onToggle?: () => void;
};

export function SuperAdminSidebarApple({ open: controlledOpen, onToggle }: SuperAdminSidebarAppleProps = {}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, [supabase]);

  const isContentin = userEmail === "contentin.cabinet@gmail.com";

  // Filtrer les items de navigation pour contentin.cabinet@gmail.com
  const filteredNavItems = isContentin
    ? NAV_ITEMS.filter((item) => {
        // Masquer "No School", "Voir mon catalogue", "Chiffre d'affaires", "Statistiques", "Gamification"
        // Masquer aussi "Organisations" et "Utilisateurs" car contentin ne gère que son catalogue
        const hiddenLabels = [
          "No School",
          "Voir mon catalogue",
          "Chiffre d'affaires",
          "Statistiques",
          "Gamification (Demo)",
          "Organisations",
          "Utilisateurs",
        ];
        return !hiddenLabels.includes(item.label);
      })
    : NAV_ITEMS;

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

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

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-800 bg-black transition-all duration-300",
        isOpen ? "w-[280px]" : "w-[80px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-5">
        <button
          type="button"
          onClick={handleToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition hover:bg-gray-900 hover:text-white"
          aria-label={isOpen ? "Fermer" : "Ouvrir"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {isOpen ? (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white">Super Admin</span>
          </div>
        ) : (
          <Shield className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.has(item.label);
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          if (hasChildren && isOpen) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-gray-900 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l border-gray-800 pl-4">
                    {item.children?.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                            isChildActive
                              ? "bg-white/10 text-white"
                              : "text-gray-400 hover:bg-gray-900 hover:text-white",
                          )}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
        {/* Agenda - uniquement pour contentin.cabinet@gmail.com */}
        {isContentin && (
          <Link
            href={AGENDA_ITEM.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              pathname === AGENDA_ITEM.href || pathname?.startsWith(AGENDA_ITEM.href + "/")
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-gray-900 hover:text-white",
            )}
          >
            <Calendar className="h-5 w-5 shrink-0" />
            {isOpen && <span>{AGENDA_ITEM.label}</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-gray-800 px-4 py-4", isOpen ? "" : "px-2")}>
        {isOpen ? (
          <div className="rounded-lg bg-gray-900 p-3">
            <p className="text-xs font-medium text-white">Accès Complet</p>
            <p className="mt-1 text-[10px] text-gray-400">Toutes les données accessibles</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Shield className="h-5 w-5 text-gray-600" />
          </div>
        )}
      </div>
    </aside>
  );
}

