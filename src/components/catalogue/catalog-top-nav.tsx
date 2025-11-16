"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useBranding } from "@/components/super-admin/branding-provider";
import { useCatalogAuth } from "@/hooks/use-catalog-auth";

type CatalogTopNavProps = {
  isOpen: boolean;
  onToggle: () => void;
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
  cartButton?: React.ReactNode;
};

export function CatalogTopNav({
  isOpen,
  onToggle,
  onCategorySelect,
  selectedCategory,
  cartButton,
}: CatalogTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { branding } = useBranding();
  const { isAuthenticated, loading: authLoading } = useCatalogAuth();
  
  // Couleurs chaudes du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const textSecondaryColor = branding?.text_secondary_color || '#8B6F47';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const platformName = branding?.platform_name || 'Beyond';

  const categories = [
    "Leadership",
    "Neurosciences",
    "Management",
    "Vente",
    "Communication",
    "Développement personnel",
  ];

  const navLinks = [
    { label: "Store", href: "#" },
    { label: "Modules", href: "/dashboard/catalogue?type=modules" },
    { label: "Parcours", href: "/dashboard/catalogue?type=parcours" },
    { label: "Ressources", href: "/dashboard/catalogue?type=ressources" },
    { label: "Tests", href: "/dashboard/catalogue?type=tests" },
    { label: "Bibliothèque", href: "/dashboard/catalogue/library" },
    { label: "Assistance", href: "/dashboard/catalogue/help" },
  ];

  return (
    <>
      {/* Barre de navigation horizontale en haut - Style Apple (adapté au branding) */}
      <nav 
        className="sticky top-0 z-50 w-full"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex h-[44px] items-center justify-center relative">
            {/* Logo Beyond en petit à gauche - SF Pro */}
            <Link 
              href="/dashboard/catalogue" 
              className="absolute left-6 flex items-center"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <span 
                className="text-[17px] font-normal tracking-tight"
                style={{ color: textColor }}
              >
                {platformName}
              </span>
            </Link>

            {/* Navigation principale centrée - Style Apple */}
            <div className="flex items-center gap-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    if (link.label === "Bibliothèque") {
                      onCategorySelect(null);
                    }
                  }}
                  className={cn(
                    "px-4 py-2 text-[12px] font-normal transition-colors",
                    pathname?.includes(link.href) ? "opacity-100" : "opacity-80"
                  )}
                  style={{ 
                    color: textColor,
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = pathname?.includes(link.href) ? '1' : '0.8';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Icônes à droite - Style Apple */}
            <div className="absolute right-6 flex items-center gap-4">
              {/* Recherche */}
              <button 
                className="transition-colors"
                style={{ 
                  color: textSecondaryColor,
                  opacity: 0.8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = textColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.color = textSecondaryColor;
                }}
              >
                <Search className="h-[17px] w-[17px]" />
              </button>

              {/* Panier */}
              {cartButton ? (
                cartButton
              ) : (
                <button
                  onClick={() => {
                    // Si pas de cartButton, on peut rediriger vers le catalogue
                    router.push("/dashboard/catalogue");
                  }}
                  className="transition-colors"
                  style={{ 
                    color: textSecondaryColor,
                    opacity: 0.8,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = textColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                    e.currentTarget.style.color = textSecondaryColor;
                  }}
                >
                  <ShoppingBag className="h-[17px] w-[17px]" />
                </button>
              )}

              {/* CTAs Se connecter / Mon compte */}
              {!authLoading && (
                <>
                  {!isAuthenticated ? (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(pathname || '/dashboard/catalogue')}`}
                      className="px-4 py-1.5 text-[12px] font-medium rounded-full transition-all"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Se connecter
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/catalogue/account"
                      className="px-4 py-1.5 text-[12px] font-medium rounded-full transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}40`,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                        e.currentTarget.style.color = '#FFFFFF';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                        e.currentTarget.style.color = primaryColor;
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <User className="h-3.5 w-3.5" />
                      Mon compte
                    </Link>
                  )}
                </>
              )}

              {/* Menu mobile */}
              <button
                onClick={onToggle}
                className="md:hidden transition-colors"
                style={{ 
                  color: textSecondaryColor,
                  opacity: 0.8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.color = textColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                  e.currentTarget.style.color = textSecondaryColor;
                }}
              >
                {isOpen ? <X className="h-[17px] w-[17px]" /> : <Menu className="h-[17px] w-[17px]" />}
              </button>
            </div>
          </div>

          {/* Dropdown Catégories - Style chaleureux (si ouvert) */}
          {isOpen && (
            <div 
              className="border-t py-6"
              style={{ 
                borderColor: `${primaryColor}20`,
                backgroundColor: branding?.surface_color || '#F5F0E8',
              }}
            >
              <div className="flex flex-wrap justify-center gap-3">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      onCategorySelect(category);
                      onToggle();
                    }}
                    className={cn(
                      "px-4 py-2 text-[12px] font-normal transition-colors rounded-full"
                    )}
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      backgroundColor: selectedCategory === category ? primaryColor : `${primaryColor}15`,
                      color: selectedCategory === category ? '#FFFFFF' : textColor,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category) {
                        e.currentTarget.style.backgroundColor = `${primaryColor}25`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category) {
                        e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                      }
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
