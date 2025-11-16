"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, ShoppingBag, ChevronDown, Heart, Gamepad2, Timer, Focus, Accessibility, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "beyond-care",
    icon: Heart,
    title: "Beyond Care",
    description: "Suivre son équilibre mental grâce à des questionnaires intelligents",
    href: "/pages/beyond-care",
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "beyond-play",
    icon: Gamepad2,
    title: "Beyond Play",
    description: "Apprendre par immersion, émotions et scénarios",
    href: "/pages/fonctionnalites#beyond-play",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "beyond-note",
    icon: FileText,
    title: "Beyond Note",
    description: "Scanner et transformer vos documents avec l'IA",
      href: "/pages/beyond-note",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "pomodoro",
    icon: Timer,
    title: "Méthode Pomodoro",
    description: "Trouver le bon rythme entre effort et récupération",
    href: "/pages/fonctionnalites#pomodoro",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "focus",
    icon: Focus,
    title: "Mode Focus",
    description: "Apprendre dans le calme, sans distractions",
    href: "/pages/fonctionnalites#focus",
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    title: "Accessibilité DYS",
    description: "Un apprentissage sans friction ni fatigue visuelle",
    href: "/pages/fonctionnalites#accessibility",
    color: "from-emerald-500 to-teal-500",
  },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Pourquoi Beyond", href: "/pages/pourquoi-beyond" },
    { label: "La plateforme", href: "/pages/lms" },
    { label: "Fonctionnalités", href: "/pages/fonctionnalites", hasDropdown: true },
    { label: "Tarif", href: "#tarifs" },
    { label: "Blog", href: "#blog" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm"
          : "bg-transparent"
      }`}
      style={{
        color: isScrolled ? undefined : "white",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo Beyond - Style Apple */}
              <Link href="/landing" className="flex items-center">
                <div 
                  className={`text-lg font-semibold tracking-tight transition-colors ${isScrolled ? "text-gray-900" : "text-white"}`}
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                >
                  Beyond
                </div>
              </Link>

          {/* Desktop Navigation - Centré comme Apple */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <div
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setHoveredItem("fonctionnalites")}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <button
                        className={cn(
                          "flex items-center gap-1 text-sm transition-colors font-medium",
                          isScrolled 
                            ? "text-gray-700 hover:text-gray-900" 
                            : "text-white/80 hover:text-white"
                        )}
                        style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                      >
                        {item.label}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", hoveredItem === "fonctionnalites" && "rotate-180")} />
                      </button>

                      {/* Dropdown Menu - Style 360Learning */}
                      {hoveredItem === "fonctionnalites" && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[800px] rounded-xl border border-gray-200 bg-white shadow-2xl p-6 z-50">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Left Column - Features List */}
                            <div className="space-y-1">
                              {features.map((feature) => {
                                const Icon = feature.icon;
                                return (
                                  <Link
                                    key={feature.id}
                                    href={feature.href}
                                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                    onClick={() => setHoveredItem(null)}
                                  >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                      <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                        {feature.title}
                                      </h3>
                                      <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                        {feature.description}
                                      </p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>

                            {/* Right Column - Featured Feature Details */}
                            <div className="border-l border-gray-200 pl-6">
                              <div className="mb-4">
                                <Link
                                  href="/pages/fonctionnalites"
                                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                                  onClick={() => setHoveredItem(null)}
                                >
                                  Découvrir toutes les fonctionnalités →
                                </Link>
                              </div>
                              <div className="space-y-4">
                                <Link
                                  href="/pages/suivi-sante-mentale"
                                  className="block group"
                                  onClick={() => setHoveredItem(null)}
                                >
                                  <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    Suivi de santé mentale
                                  </h4>
                                  <ul className="space-y-1.5 text-xs text-gray-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    <li>• Questionnaires intelligents</li>
                                    <li>• Analyse des tendances</li>
                                    <li>• Alertes préventives</li>
                                    <li>• Tableaux de bord personnalisés</li>
                                  </ul>
                                </Link>
                                <Link
                                  href="/pages/apprentissage-immersif"
                                  className="block group"
                                  onClick={() => setHoveredItem(null)}
                                >
                                  <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    Apprentissage immersif
                                  </h4>
                                  <ul className="space-y-1.5 text-xs text-gray-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    <li>• Simulations réalistes</li>
                                    <li>• Scénarios interactifs</li>
                                    <li>• Feedback en temps réel</li>
                                    <li>• Gamification avancée</li>
                                  </ul>
                                </Link>
                                <Link
                                  href="/pages/productivite"
                                  className="block group"
                                  onClick={() => setHoveredItem(null)}
                                >
                                  <h4 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide group-hover:text-blue-600 transition-colors" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    Productivité
                                  </h4>
                                  <ul className="space-y-1.5 text-xs text-gray-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                    <li>• Méthode Pomodoro</li>
                                    <li>• Mode Focus</li>
                                    <li>• Accessibilité DYS</li>
                                    <li>• Neuro-adaptation</li>
                                  </ul>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-sm transition-colors font-medium ${
                      isScrolled 
                        ? "text-gray-700 hover:text-gray-900" 
                        : "text-white/80 hover:text-white"
                    }`}
                    style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Icons - Style Apple */}
          <div className="hidden md:flex items-center space-x-6">
            {/* No School - Icône à droite */}
            <Link
              href="/pages/catalogue"
              className={`transition-colors ${
                isScrolled 
                  ? "text-gray-700 hover:text-gray-900" 
                  : "text-white/80 hover:text-white"
              }`}
              aria-label="No School"
              title="No School"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <button
              className={`transition-colors ${
                isScrolled 
                  ? "text-gray-700 hover:text-gray-900" 
                  : "text-white/80 hover:text-white"
              }`}
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/login"
              className={`text-sm transition-colors font-medium ${
                isScrolled 
                  ? "text-gray-700 hover:text-gray-900" 
                  : "text-white/80 hover:text-white"
              }`}
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              Connexion
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100"
          >
            <div className="px-6 py-6 space-y-4">
              {navItems.map((item) => {
                if (item.hasDropdown) {
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {item.label}
                      </div>
                      <div className="pl-4 space-y-2">
                        {features.map((feature) => {
                          const Icon = feature.icon;
                          return (
                            <Link
                              key={feature.id}
                              href={feature.href}
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-xs font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                  {feature.title}
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                                  {feature.description}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/pages/catalogue"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium pt-2"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                <ShoppingBag className="h-4 w-4" />
                No School
              </Link>
              <Link
                href="/login"
                className="block text-gray-700 hover:text-gray-900 transition-colors text-sm font-medium pt-4 border-t border-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                Connexion
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
