"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/super" },
  { label: "Organisations", icon: Building2, href: "/super/organisations" },
  { label: "Créer Organisation", icon: Building2, href: "/super/organisations/new" },
  { label: "Utilisateurs", icon: Users, href: "/super/utilisateurs" },
  { label: "Créer Utilisateur", icon: UserPlus, href: "/super/utilisateurs/new" },
  { label: "Chiffre d'affaires", icon: DollarSign, href: "/super/chiffre-affaires" },
  { label: "Statistiques", icon: BarChart3, href: "/super/statistiques" },
  { label: "Paramètres", icon: Settings, href: "/super/parametres" },
];

type SuperAdminSidebarCleanProps = {
  open?: boolean;
  onToggle?: () => void;
};

export function SuperAdminSidebarClean({ open: controlledOpen, onToggle }: SuperAdminSidebarCleanProps = {}) {
  const [internalOpen, setInternalOpen] = useState(true);
  const pathname = usePathname();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300",
        isOpen ? "w-[260px]" : "w-[80px]",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-5">
        <button
          type="button"
          onClick={handleToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
          aria-label={isOpen ? "Fermer" : "Ouvrir"}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {isOpen ? (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-900" />
            <span className="text-sm font-semibold text-gray-900">Super Admin</span>
          </div>
        ) : (
          <Shield className="h-5 w-5 text-gray-900" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-gray-500")} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-gray-200 px-4 py-4", isOpen ? "" : "px-2")}>
        {isOpen ? (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-900">Accès Complet</p>
            <p className="mt-1 text-[10px] text-gray-600">Toutes les données accessibles</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
        )}
      </div>
    </aside>
  );
}

