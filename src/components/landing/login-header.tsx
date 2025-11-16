"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, Gamepad2, Timer, Focus, Accessibility, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    href: "#beyond-play",
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
    href: "#pomodoro",
    color: "from-blue-500 to-purple-500",
  },
  {
    id: "focus",
    icon: Focus,
    title: "Mode Focus",
    description: "Apprendre dans le calme, sans distractions",
    href: "#focus",
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "accessibility",
    icon: Accessibility,
    title: "Accessibilité DYS",
    description: "Un apprentissage sans friction ni fatigue visuelle",
    href: "#accessibility",
    color: "from-emerald-500 to-teal-500",
  },
];

export function LoginHeader() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Force re-render pour éviter les problèmes de cache
  if (typeof window !== 'undefined') {
    console.log('[LoginHeader] Component rendered');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/95 backdrop-blur-xl">
      <nav className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center">
            <span className="text-lg font-semibold tracking-tight text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Beyond
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-0">
            <Link
              href="/pages/pourquoi-beyond"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              Pourquoi Beyond
            </Link>

            <Link
              href="/pages/lms"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              La plateforme
            </Link>

            <Link
              href="/pages/catalogue"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              No School
            </Link>

            {/* Fonctionnalités avec menu déroulant */}
            <div
              className="relative"
              onMouseEnter={() => setHoveredItem("fonctionnalites")}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors",
                  hoveredItem === "fonctionnalites"
                    ? "text-gray-900"
                    : "text-gray-700 hover:text-gray-900"
                )}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
              >
                Fonctionnalités
                <ChevronDown className={cn("h-4 w-4 transition-transform", hoveredItem === "fonctionnalites" && "rotate-180")} />
              </button>

              {/* Dropdown Menu - Style 360Learning */}
              {hoveredItem === "fonctionnalites" && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[800px] rounded-xl border border-gray-200 bg-white shadow-2xl p-6">
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

            <Link
              href="/pages/fonctionnalites"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              Fonctionnalités
            </Link>

            <Link
              href="#tarifs"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              Tarif
            </Link>

            <Link
              href="#blog"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              Blog
            </Link>
          </div>

          {/* Right side - CTA Connexion */}
          <div className="flex items-center gap-4">
            <Button
              asChild
              className="bg-gray-900 text-white hover:bg-gray-800 text-sm px-6 py-2 h-auto rounded-full font-medium"
              style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}
            >
              <Link href="/login">
                Connexion →
              </Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}

