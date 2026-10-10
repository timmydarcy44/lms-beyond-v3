"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  ChevronDown,
  MessageSquare,
  LogOut,
  Globe,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { AlertsBadge } from "./alerts-badge";

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
  icon?: string;
  isSubItem?: boolean;
  exact?: boolean;
  activePrefixes?: string[];
};

function itemIsActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  if (item.activePrefixes?.length) {
    return item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/super" },
  {
    label: "Gestion",
    href: "/super/formations",
    children: [
      { label: "Gestion des formations", href: "/super/formations" },
      { label: "Formation Byound", href: "/super/formations-byound" },
      { label: "Référentiel métier", href: "/super/metiers" },
      { label: "Experts / Formateurs", href: "/super/experts" },
      { label: "Open badge", href: "/super/open-badges/badgeclasses" },
    ],
  },
  {
    label: "CFA",
    href: "/super/crm/cfa",
    activePrefixes: ["/super/crm/cfa", "/super/experts"],
    children: [
      { label: "CRM Apprenant", href: "/super/crm/cfa", exact: true },
      { label: "CRM Entreprise", href: "/super/crm/cfa/entreprises" },
      { label: "Formateurs", href: "/super/experts" },
    ],
  },
  {
    label: "Business",
    href: "/super/crm/pipeline",
    activePrefixes: ["/super/crm/pipeline", "/super/utilisateurs", "/super/organisations", "/super/crm/emails"],
    children: [
      { label: "Pipeline", href: "/super/crm/pipeline" },
      { label: "Contacts", href: "/super/utilisateurs", exact: true },
      { label: "Organisations", href: "/super/organisations" },
      { label: "Emails", href: "/super/crm/emails" },
    ],
  },
  { label: "IA", href: "/super/ia" },
  { label: "Chiffre d'affaires", href: "/super/chiffre-affaires" },
  { label: "Statistiques", href: "/super/statistiques" },
  { label: "Paramètres", href: "/super/parametres" },
];

export function SuperAdminHeaderApple() {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  const openMenu = (label: string) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setHoveredItem(label);
  };

  const closeMenuSoon = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHoveredItem(null), 220);
  };

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
        // Dashboard spécifique pour Jessica
        { label: "Dashboard", href: "/super/jessica-dashboard" },
        ...NAV_ITEMS.filter((item) => {
          // Masquer uniquement les items spécifiques à Beyond
          const hiddenLabels = [
            "Dashboard", // Remplacé par le dashboard Jessica
            "No School",
            "Open Badges",
            "Premium",
            "Chiffre d'affaires",
            "Statistiques",
            "CRM",
            "CFA",
            "Business",
            "Utilisateurs",
            "IA",
          ];
          return !hiddenLabels.includes(item.label);
        }),
        // Ajouter les onglets spécifiques pour Jessica
        { label: "Catalogue", href: "/super/catalogue-jessica" },
        {
          label: "Gestion client",
          href: "/super/gestion-client",
          children: [
            { label: "Liste des clients", href: "/super/gestion-client" },
            { label: "Créer un compte", href: "/super/gestion-client/new" },
          ],
        },
      ]
    : NAV_ITEMS;

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-xl",
      isContentin 
        ? "border-[#D2B48C]/50 bg-[#F5F5DC]/80" 
        : "super-glass-header border-white/10 bg-[#071225]/80"
    )}>
      <nav className="mx-auto max-w-[1440px] px-6">
        <div className="flex h-12 items-center justify-between">
          {/* Logo - "Beyond" en petit */}
          <Link href="/super" className="flex items-center">
            <span className={cn(
              "text-[11px] font-medium tracking-tight",
              isContentin ? "text-[#8B4513]" : "text-gray-900"
            )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              BYOUND <span className="ml-1 text-[9px] font-semibold tracking-[0.18em] text-indigo-300">CONTROL</span>
            </span>
          </Link>

          {/* Navigation Items - Centré */}
          <div className="flex items-center gap-0 flex-1 justify-center">
            {filteredNavItems.map((item) => {
              const isActive = itemIsActive(item, pathname);
              const hasChildren = item.children && item.children.length > 0;
              const isHovered = hoveredItem === item.label;
              const iconName = item.icon;

              if (hasChildren) {
                return (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={closeMenuSoon}
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
                    {isHovered && item.children && (
                      <div className="absolute left-1/2 top-full z-[80] -translate-x-1/2 pt-2">
                      <div 
                        className={cn(
                          item.label === "Gestion"
                            ? "w-[min(720px,calc(100vw-2rem))] rounded-2xl border p-4 shadow-xl"
                            : "min-w-[220px] rounded-lg border py-1.5 shadow-lg",
                          isContentin
                            ? "border-[#D2B48C]/50 bg-[#E8E8D3]/95"
                            : "super-nav-dropdown border-white/15"
                        )}
                        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
                      >
                        {item.label === "Gestion" ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {item.children.map((child) => {
                              const isChildActive = itemIsActive(child, pathname);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "group rounded-xl border px-4 py-3 transition",
                                    isContentin
                                      ? "border-[#D2B48C]/40 bg-white/60 hover:bg-white"
                                      : "border-white/10 bg-[#16325c] hover:bg-[#1c3d6e]",
                                  )}
                                  onClick={() => setHoveredItem(null)}
                                >
                                  <p
                                    className={cn(
                                      "text-[13px] font-semibold",
                                      isContentin
                                        ? isChildActive
                                          ? "text-[#D4AF37]"
                                          : "text-[#2F2A25]"
                                        : isChildActive
                                          ? "text-gray-900"
                                          : "text-gray-900",
                                    )}
                                  >
                                    {child.label}
                                  </p>
                                  <p className={cn("mt-1 text-[12px]", isContentin ? "text-[#2F2A25]/70" : "text-gray-600")}>
                                    Accès rapide
                                  </p>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          item.children.map((child) => {
                            const isChildActive = itemIsActive(child, pathname);
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
                          })
                        )}
                      </div>
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

          {/* Right side - Gestion client (pour Jessica) et autres */}
          <div className="flex items-center gap-3">
            {/* CTA Gestion client - uniquement pour Jessica */}
            {isContentin && (
              <Link
                href="/super/gestion-client"
                className={cn(
                  "px-4 py-2 text-[13px] font-medium transition-colors rounded-lg",
                  pathname === "/super/gestion-client" || pathname?.startsWith("/super/gestion-client/")
                    ? "text-white"
                    : "text-[#A0522D] hover:text-white",
                  pathname === "/super/gestion-client" || pathname?.startsWith("/super/gestion-client/")
                    ? "bg-[#C6A664]"
                    : "bg-[#E6D9C6] hover:bg-[#C6A664]",
                )}
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                Gestion client
              </Link>
            )}
            {/* Badge Alertes */}
            <AlertsBadge />
            
            {/* Icône Messagerie */}
            <Link
              href="/dashboard/student/community"
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
