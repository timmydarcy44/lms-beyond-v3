"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { BeyondCareSidebarWrapper } from "@/components/beyond-care/beyond-care-sidebar-wrapper";

import {
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  PenTool,
  Store,
  Users,
  Route,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CheckSquare,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Parcours", icon: Route, href: "/admin/parcours" },
  { label: "Formations", icon: GraduationCap, href: "/admin/formations" },
  { label: "Mes tests", icon: PenTool, href: "/admin/tests" },
  { label: "Mes ressources", icon: Library, href: "/admin/ressources" },
  { label: "Mes apprenants", icon: Users, href: "/admin/apprenants" },
  { label: "Mes groupes", icon: Layers, href: "/admin/groupes" },
  { label: "To-Do List", icon: CheckSquare, href: "/admin/todo" },
  { label: "No School", icon: Store, href: "/admin/catalogue" },
];

type AdminSidebarProps = {
  open: boolean;
  onToggle: () => void;
  organizationLogo?: string | null;
};

export const AdminSidebar = ({ open, onToggle, organizationLogo }: AdminSidebarProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.setProperty("--sidebar-width", "272px");
    } else {
      document.body.style.setProperty("--sidebar-width", "88px");
    }
  }, [open]);

  const sidebarWidth = open ? "272px" : "88px";

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 flex h-screen flex-col bg-transparent text-white transition-all duration-300",
        open ? "w-[272px]" : "w-[88px]",
      )}
      style={{
        backgroundColor: 'transparent',
        borderRight: 'none',
      }}
      onTransitionEnd={() => {
        // Forcer la mise à jour du marginLeft après la transition
        const main = document.querySelector('main[style*="marginLeft"]');
        if (main) {
          const currentWidth = open ? "272px" : "88px";
          (main as HTMLElement).style.marginLeft = `var(--sidebar-width, ${currentWidth})`;
        }
      }}
    >
      <div className="relative flex items-center justify-center px-4 py-5">
        {open ? (
          <div className="flex flex-col items-center gap-2 w-full">
            {organizationLogo ? (
              <div className="relative h-16 w-16">
                <Image
                  src={organizationLogo}
                  alt="Logo organisation"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded bg-white/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-white/60">ORG</span>
              </div>
            )}
            <span className="text-[10px] text-white/50">Powered by Beyond</span>
          </div>
        ) : (
          organizationLogo && (
            <div className="relative h-12 w-12">
              <Image
                src={organizationLogo}
                alt="Logo organisation"
                fill
                className="object-contain"
              />
            </div>
          )
        )}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "absolute top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20",
            open ? "right-4" : "right-2"
          )}
          aria-label={open ? "Fermer la navigation" : "Ouvrir la navigation"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition",
                "hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-5 w-5 text-white/50 group-hover:text-white" />
              {open ? <span className="ml-3">{item.label}</span> : null}
            </Link>
          );
        })}
        {/* Beyond Care - conditionnel */}
        <BeyondCareSidebarWrapper isOpen={open} role="admin" />
      </nav>
      
      {/* Bouton de déconnexion en bas */}
      <div className="border-t border-white/10 px-2 py-4 mt-auto">
        <form action="/logout" method="POST" className="w-full">
          <button
            type="submit"
            className={cn(
              "group flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-white/60 transition",
              "hover:bg-white/10 hover:text-white",
            )}
          >
            <LogOut className="h-5 w-5 text-white/50 group-hover:text-white" />
            {open ? <span className="ml-3">Déconnexion</span> : null}
          </button>
        </form>
      </div>
    </aside>
  );
};


