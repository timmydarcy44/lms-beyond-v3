"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, User, Building2, Search, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

type BeyondConnectHeaderProps = {
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
};

export function BeyondConnectHeader({ user }: BeyondConnectHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Vérifier si on est dans la section entreprises (pas clients)
  const isCompaniesSection = pathname?.startsWith("/beyond-connect-app/companies");

  // Navigation différente selon si on est dans la section entreprises ou candidat
  const navItems = isCompaniesSection
    ? [
        { label: "Rechercher un candidat", href: "/beyond-connect-app/companies/candidates", icon: Search },
        { label: "Offres d'emploi", href: "/beyond-connect-app/jobs", icon: Briefcase },
      ]
    : [
        { label: "Mon CV", href: "/beyond-connect-app", icon: User },
        { label: "Offres d'emploi", href: "/beyond-connect-app/jobs", icon: Briefcase },
        { label: "Mes candidatures", href: "/beyond-connect-app/applications", icon: Briefcase },
      ];

  // Afficher "Entreprises" seulement si l'utilisateur est membre d'une organisation
  // TODO: Vérifier si l'utilisateur a des organisations
  // if (hasOrganizations) {
  //   navItems.push({ label: "Entreprises", href: "/beyond-connect-app/companies", icon: Building2 });
  // }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/beyond-connect-app" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003087] text-white font-bold">
              BC
            </div>
            <span className="text-xl font-bold text-gray-900">Beyond Connect</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#003087] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex text-gray-700 hover:bg-gray-100">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex text-gray-700 hover:bg-gray-100">
              <Bell className="h-4 w-4" />
            </Button>
            <Link
              href="/beyond-connect-app/profile"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-[#003087] flex items-center justify-center text-white text-xs font-semibold">
                {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline">{user.fullName || user.email}</span>
            </Link>
            {/* CTA Beyond Care - Tout à droite - Uniquement dans la section entreprises */}
            {isCompaniesSection && (
              <Link
                href="/dashboard/beyond-care"
                className="hidden md:block group"
              >
                <div
                  className="relative overflow-hidden rounded-xl bg-[#c91459] px-5 py-2.5 text-center transition-all duration-300 hover:bg-[#b0124d] hover:shadow-[0_8px_30px_rgba(201,20,89,0.35)] hover:scale-[1.02]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  {/* Effet de brillance animé */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  
                  {/* Contenu */}
                  <span className="relative text-white font-semibold text-sm tracking-tight">
                    Beyond Care
                  </span>
                </div>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#003087] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              {/* CTA Beyond Care Mobile - Uniquement dans la section entreprises */}
              {isCompaniesSection && (
                <Link
                  href="/dashboard/beyond-care"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block group"
                >
                  <div
                    className="relative overflow-hidden rounded-xl bg-[#c91459] px-5 py-3 text-center transition-all duration-300 active:scale-[0.98] active:bg-[#b0124d]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {/* Effet de brillance animé */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-active:translate-x-full transition-transform duration-1000 ease-in-out" />
                    
                    {/* Contenu */}
                    <span className="relative text-white font-semibold text-sm tracking-tight">
                      Beyond Care
                    </span>
                  </div>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

