"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Store, Library, X, Menu, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useBranding } from "@/components/super-admin/branding-provider";

type CatalogSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  onCategorySelect: (category: string | null) => void;
  selectedCategory: string | null;
};

export function CatalogSidebar({
  isOpen,
  onToggle,
  onCategorySelect,
  selectedCategory,
}: CatalogSidebarProps) {
  const pathname = usePathname();
  const { branding } = useBranding();
  const [currentTime, setCurrentTime] = useState<string>("");

  // Couleurs chaudes du branding
  const bgColor = branding?.background_color || '#F5F0E8';
  const surfaceColor = branding?.surface_color || '#F5F0E8';
  const textColor = branding?.text_primary_color || '#5D4037';
  const textSecondaryColor = branding?.text_secondary_color || '#8B6F47';
  const primaryColor = branding?.primary_color || '#8B6F47';
  const accentColor = branding?.accent_color || '#D4AF37';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Rechercher", icon: Search, href: "/dashboard/catalogue/search" },
    { label: "Accueil", icon: Home, href: "/dashboard/catalogue" },
    { label: "BEYOND", icon: Shield, href: "/dashboard/catalogue", badge: true },
  ];

  const categories = [
    "Leadership",
    "Neurosciences",
    "Management",
    "Vente",
    "Communication",
    "Développement personnel",
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar avec couleurs chaudes */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 transform backdrop-blur-xl transition-transform duration-300 md:translate-x-0 shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "rounded-r-2xl border-r"
        )}
        style={{
          backgroundColor: surfaceColor,
          borderColor: `${primaryColor}20`,
        }}
      >
        {/* Header avec toggle */}
        <div 
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`,
              }}
            >
              <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>C</span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textColor }}>Utilisateur</p>
              <p className="text-xs" style={{ color: textSecondaryColor }}>{currentTime}</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="md:hidden rounded-lg p-2 transition-colors"
            style={{ 
              color: textColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation principale */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.label === "Accueil") {
                    onCategorySelect(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                )}
                style={{
                  backgroundColor: isActive ? `${primaryColor}15` : 'transparent',
                  color: isActive ? textColor : textSecondaryColor,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                    e.currentTarget.style.color = textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = textSecondaryColor;
                  }
                }}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span 
                    className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    style={{ 
                      backgroundColor: accentColor,
                      color: '#FFFFFF',
                    }}
                  >
                    CATALOGUE
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Section Catégories */}
        <div 
          className="border-t p-4"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <p 
            className="px-4 text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: textSecondaryColor }}
          >
            Catégories
          </p>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className="w-full text-left flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors"
                style={{
                  backgroundColor: selectedCategory === category ? `${primaryColor}15` : 'transparent',
                  color: selectedCategory === category ? textColor : textSecondaryColor,
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = `${primaryColor}10`;
                    e.currentTarget.style.color = textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== category) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = textSecondaryColor;
                  }
                }}
              >
                <Store className="h-4 w-4" />
                <span>{category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bibliothèque (contenu acheté) */}
        <div 
          className="border-t p-4 mt-auto"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <Link
            href="/dashboard/catalogue/library"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
            style={{ color: textSecondaryColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${primaryColor}10`;
              e.currentTarget.style.color = textColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = textSecondaryColor;
            }}
          >
            <Library className="h-5 w-5" />
            <span>Bibliothèque</span>
          </Link>
        </div>
      </aside>

      {/* Toggle button pour mobile */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-40 rounded-lg p-2 shadow-lg md:hidden"
          style={{ 
            backgroundColor: surfaceColor,
            color: textColor,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

