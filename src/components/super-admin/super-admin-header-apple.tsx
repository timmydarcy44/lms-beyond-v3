"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  MessageSquare,
  LogOut,
  Bell,
  BookOpen,
  Route,
  FileText,
  ClipboardList,
  Plus,
  Sparkles,
  Store,
  Gamepad2,
  Crown,
  Brain,
  TrendingUp,
  Globe,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AlertsBadge } from "./alerts-badge";

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
  icon?: string;
  isSubItem?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/super" },
  {
      label: "Studio",
      href: "/super/studio",
      children: [
        { label: "Modules", href: "/super/studio/modules/new/choose", icon: "modules" },
      { label: "Parcours", href: "/super/studio/parcours/new", icon: "parcours" },
      { label: "Ressources", href: "/super/studio/ressources/new", icon: "ressources" },
      { label: "Tests", href: "/super/studio/tests/new", icon: "tests" },
      { label: "Voir tous les modules", href: "/super/studio/modules", isSubItem: true },
      { label: "Voir tous les parcours", href: "/super/studio/parcours", isSubItem: true },
      { label: "Voir toutes les ressources", href: "/super/studio/ressources", isSubItem: true },
      { label: "Voir tous les tests", href: "/super/studio/tests", isSubItem: true },
    ],
  },
  {
    label: "Utilisateurs",
    href: "/super/utilisateurs",
    children: [
      { label: "Organisations", href: "/super/organisations" },
      { label: "Formateurs", href: "/super/utilisateurs?role=instructor" },
      { label: "Apprenants", href: "/super/utilisateurs?role=learner" },
      { label: "Tuteurs", href: "/super/utilisateurs?role=tutor" },
      { label: "B2C", href: "/super/utilisateurs?role=btoc" },
    ],
  },
  { label: "IA", href: "/super/ia" },
  {
    label: "No School",
    href: "/super/catalogue",
    children: [
      { label: "Voir No School", href: "/super/catalogue/preview" },
      { label: "Voir les contenus", href: "/super/catalogue" },
    ],
  },
  { label: "Chiffre d'affaires", href: "/super/chiffre-affaires" },
  { label: "Statistiques", href: "/super/statistiques" },
  {
    label: "Premium",
    href: "/super/premium",
    children: [
      { label: "Analyse avancée", href: "/super/premium/analyse-avancee" },
      { label: "Beyond Care", href: "/super/premium/beyond-care" },
      { label: "Beyond Play", href: "/super/premium/beyond-play" },
      { label: "Beyond Note", href: "/super/premium/beyond-note" },
    ],
  },
  { label: "Paramètres", href: "/super/parametres", icon: "settings" },
  { label: "CMS", href: "/super/pages", icon: "globe" },
];

export function SuperAdminHeaderApple() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error("[SuperAdminHeaderApple] Error fetching user email:", error);
      }
    };
    fetchUserEmail();
  }, []);

  const isContentin = userEmail === "contentin.cabinet@gmail.com";

  // Filtrer les items de navigation pour contentin.cabinet@gmail.com
  const filteredNavItems = isContentin
    ? [
        ...NAV_ITEMS.filter((item) => {
          // Masquer "No School", "Premium", "Chiffre d'affaires", "Statistiques"
          // Masquer aussi "Organisations" et "Utilisateurs" car contentin ne gère que son catalogue
          // Masquer "IA" car ce n'est pas nécessaire pour contentin
          const hiddenLabels = [
            "No School",
            "Premium",
            "Chiffre d'affaires",
            "Statistiques",
            "Utilisateurs",
            "IA",
          ];
          return !hiddenLabels.includes(item.label);
        }),
        // Ajouter l'onglet Catalogue pour Jessica
        { label: "Catalogue", href: "/super/catalogue-jessica" },
      ]
    : NAV_ITEMS;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-xl",
      isContentin 
        ? "border-[#D2B48C]/50 bg-[#F5F5DC]/80" 
        : "border-gray-200/50 bg-white/80"
    )}>
      <nav className="mx-auto max-w-[1440px] px-6">
        <div className="flex h-12 items-center justify-between">
          {/* Logo - "Beyond" en petit */}
          <Link href="/super" className="flex items-center">
            <span className={cn(
              "text-[11px] font-medium tracking-tight",
              isContentin ? "text-[#8B4513]" : "text-gray-900"
            )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              Beyond
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-0">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const hasChildren = item.children && item.children.length > 0;
              const isHovered = hoveredItem === item.label;
              const iconName = item.icon;

              if (hasChildren) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setHoveredItem(item.label)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-0.5 px-4 py-2 text-[13px] font-normal transition-colors",
                        isContentin
                          ? isActive || isHovered
                            ? "text-[#D4AF37]"
                            : "text-[#A0522D] hover:text-[#D4AF37]"
                          : isActive || isHovered
                            ? "text-gray-900"
                            : "text-gray-700 hover:text-gray-900",
                      )}
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={cn("ml-0.5 h-[10px] w-[10px] transition-transform", isHovered && "rotate-180")} />
                    </Link>

                    {/* Dropdown Menu - Zone grisée pour les menus normaux */}
                    {isHovered && item.children && item.label !== "Studio" && (
                      <div 
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 top-full mt-1 min-w-[200px] rounded-lg border backdrop-blur-xl shadow-lg py-1.5",
                          isContentin
                            ? "border-[#D2B48C]/50 bg-[#E8E8D3]/95"
                            : "border-gray-200/50 bg-gray-50/95"
                        )}
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                      >
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "block px-3 py-1.5 text-[13px] font-normal transition-colors",
                                isContentin
                                  ? isChildActive
                                    ? "text-[#D4AF37]"
                                    : "text-[#A0522D] hover:text-[#D4AF37]"
                                  : isChildActive
                                    ? "text-gray-900"
                                    : "text-gray-700 hover:text-gray-900",
                              )}
                              onClick={() => setHoveredItem(null)}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown Menu spécial pour "Studio" - Design sombre avec grille */}
                    {isHovered && item.children && item.label === "Studio" && (
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[280px] rounded-xl border border-gray-700/50 bg-black/70 backdrop-blur-md shadow-2xl p-3"
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                        onMouseEnter={() => setHoveredItem(item.label)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {/* Grille 2x2 pour les éléments principaux */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {item.children.filter((child) => !child.isSubItem && child.icon).map((child) => {
                            const IconComponent = 
                              child.icon === "modules" ? BookOpen :
                              child.icon === "parcours" ? Route :
                              child.icon === "ressources" ? FileText :
                              child.icon === "tests" ? ClipboardList :
                              null;
                            
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg text-white hover:bg-white/10 transition-colors"
                                onClick={() => setHoveredItem(null)}
                              >
                                {IconComponent && <IconComponent className="h-6 w-6 text-white" />}
                                <span className="text-xs font-medium text-white">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Séparateur */}
                        <div className="h-px bg-gray-700/50 my-2" />

                        {/* Liens "Voir tous les..." */}
                        <div className="flex flex-col gap-1 mb-2">
                          {item.children.filter((child) => child.isSubItem).map((child) => {
                            const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-[13px] font-normal transition-colors",
                                  isChildActive
                                    ? "text-white bg-white/10"
                                    : "text-gray-300 hover:text-white hover:bg-white/5",
                                )}
                                onClick={() => setHoveredItem(null)}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Séparateur */}
                        <div className="h-px bg-gray-700/50 my-2" />

                        {/* Bouton Créer */}
                        <Link
                          href="/super/studio/modules/new"
                          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                          onClick={() => setHoveredItem(null)}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Créer</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              if (iconName === "globe" || iconName === "settings") {
                const IconComponent = iconName === "globe" ? Globe : Settings;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 flex items-center justify-center transition-colors",
                      isContentin
                        ? isActive
                          ? "text-[#D4AF37]"
                          : "text-[#A0522D] hover:text-[#D4AF37]"
                        : isActive
                          ? "text-gray-900"
                          : "text-gray-700 hover:text-gray-900",
                    )}
                    title={iconName === "globe" ? (isContentin ? "Gérer mon site jessica-contentin.fr" : "Gestion du site") : "Paramètres"}
                  >
                    <IconComponent className="h-4 w-4" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-[13px] font-normal transition-colors",
                    isContentin
                      ? isActive
                        ? "text-[#D4AF37]"
                        : "text-[#A0522D] hover:text-[#D4AF37]"
                      : isActive
                        ? "text-gray-900"
                        : "text-gray-700 hover:text-gray-900",
                  )}
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                >
                  {item.label}
                </Link>
              );
            })}
            {/* Agenda - uniquement pour contentin.cabinet@gmail.com */}
            {isContentin && (
              <Link
                href="/super/agenda"
                className={cn(
                  "px-4 py-2 text-[13px] font-normal transition-colors flex items-center gap-1.5",
                  pathname === "/super/agenda" || pathname?.startsWith("/super/agenda/")
                    ? "text-[#D4AF37]"
                    : "text-[#A0522D] hover:text-[#D4AF37]",
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Agenda</span>
              </Link>
            )}
          </div>

          {/* Right side - Alertes, Messagerie et Déconnexion */}
          <div className="flex items-center gap-3">
            {/* Badge Alertes */}
            <AlertsBadge />
            
            {/* Icône Messagerie */}
            <Link
              href="/dashboard/communaute"
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                isContentin
                  ? "hover:bg-[#E8E8D3]"
                  : "hover:bg-gray-100"
              )}
              title="Messagerie"
            >
              <MessageSquare className={cn(
                "h-4 w-4 transition-colors",
                isContentin
                  ? "text-[#A0522D] hover:text-[#D4AF37]"
                  : "text-gray-700 hover:text-gray-900"
              )} />
            </Link>
            
            {/* Bouton Déconnexion */}
            <form action="/logout" method="POST" className="flex items-center">
              <button
                type="submit"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-normal transition-colors rounded",
                  isContentin
                    ? "text-[#A0522D] hover:text-[#D4AF37] hover:bg-[#E8E8D3]"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </header>
  );
}
