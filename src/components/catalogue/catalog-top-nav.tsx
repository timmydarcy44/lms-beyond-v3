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
  
  // Couleurs du branding - Style Netflix (fond noir par défaut)
  // Détecter si c'est contentin (beige) ou tim (noir)
  const isContentin = branding?.background_color === '#F5F0E8' || branding?.background_color === '#F8F9FB';
  const bgColor = isContentin ? (branding?.background_color || '#F5F0E8') : (branding?.background_color || '#000000');
  const textColor = isContentin ? (branding?.text_primary_color || '#5D4037') : (branding?.text_primary_color || '#ffffff');
  const textSecondaryColor = isContentin ? (branding?.text_secondary_color || '#8B6F47') : (branding?.text_secondary_color || '#b3b3b3');
  const primaryColor = isContentin ? (branding?.primary_color || '#8B6F47') : (branding?.primary_color || '#e50914'); // Rouge Netflix
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
      {/* Barre de navigation horizontale en haut - Style Netflix (transparent) */}
      <nav 
        className="absolute top-0 left-0 right-0 z-50 w-full transition-all duration-300"
        style={{ 
          backgroundColor: isContentin ? `${bgColor}E6` : 'rgba(0, 0, 0, 0.4)',
          color: textColor,
          backdropFilter: isContentin ? 'blur(10px)' : 'blur(10px)',
        }}
      >
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex h-[44px] items-center justify-center relative">
            {/* Logo Beyond agrandi à gauche - Style Netflix */}
            <Link 
              href="/dashboard/catalogue" 
              className="absolute left-6"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <span 
                className="text-[28px] font-semibold tracking-tight leading-none"
                style={{ color: '#ffffff' }}
              >
                Beyond
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
                    color: '#ffffff', // Toujours blanc pour les onglets
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
                        backgroundColor: '#e50914', // Rouge Netflix
                        color: '#FFFFFF',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f40612';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#e50914';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      Se connecter
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/dashboard/catalogue/account"
                        className="px-4 py-1.5 text-[12px] font-medium rounded-full transition-all flex items-center gap-1.5"
                        style={{
                          backgroundColor: '#e50914', // Rouge Netflix
                          color: '#ffffff',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f40612';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#e50914';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <User className="h-3.5 w-3.5" />
                        Mon compte
                      </Link>
                      
                      {/* Beyond Connect CTA - Bordures bleues, fond transparent */}
                      <Link
                        href="/dashboard/catalogue/connect"
                        className="px-4 py-1.5 text-[12px] font-medium rounded-full transition-all ml-2"
                        style={{
                          backgroundColor: 'transparent',
                          border: '2px solid #3b82f6',
                          color: '#3b82f6',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.color = '#3b82f6';
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Beyond Connect
                      </Link>
                    </>
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
