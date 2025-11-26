"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronDown, GraduationCap, Heart, Network, Play, Music, Sparkles } from "lucide-react";

const ecosystemItems = [
  {
    id: "center",
    name: "Beyond Center",
    description: "Centre de formation",
    presentation: "Écosystème complet : formations certifiantes et certifications reconnues.",
    icon: Sparkles,
    href: "/beyond-center",
    color: "#FF00FF"
  },
  {
    id: "no-school",
    name: "Beyond No School",
    description: "Formations en ligne",
    presentation: "Catalogue complet de formations interactives adaptées à tous les niveaux.",
    icon: GraduationCap,
    href: "/beyond-no-school",
    color: "#006CFF"
  },
  {
    id: "care",
    name: "Beyond Care",
    description: "Accompagnement psychopédagogique",
    presentation: "Accompagnement personnalisé par des experts pour votre développement.",
    icon: Heart,
    href: "/beyond-care",
    color: "#FF6B6B"
  },
  {
    id: "connect",
    name: "Beyond Connect",
    description: "Optimisation du recrutement",
    presentation: "Matching intelligent pour trouver stage, alternance, CDI ou CDD.",
    icon: Network,
    href: "/beyond-connect",
    color: "#4ECDC4"
  },
  {
    id: "play",
    name: "Beyond Play",
    description: "Gamification et apprentissage",
    presentation: "Apprenez en vous amusant grâce à la gamification de votre parcours.",
    icon: Play,
    href: "/beyond-play",
    color: "#FFE66D"
  },
  {
    id: "note",
    name: "Beyond Note",
    description: "Prise de notes intelligente",
    presentation: "Organisez et structurez vos notes efficacement avec une solution intelligente.",
    icon: Music,
    href: "/beyond-note",
    color: "#A8E6CF"
  }
];

export function EcosystemDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const blue = "#006CFF";
  const white = "#FFFFFF";

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors font-light"
      >
        Écosystème
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[900px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
            }}
          >
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {ecosystemItems.map((item, index) => {
                  const Icon = item.icon;
                  const colIndex = Math.floor(index / 2);
                  const rowIndex = index % 2;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: (colIndex * 0.05) + (rowIndex * 0.03) }}
                        className="flex flex-col items-start gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 mt-0.5"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <Icon 
                              className="h-5 w-5" 
                              style={{ color: item.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div 
                              className="text-sm font-light text-white mb-1 group-hover:text-white transition-colors"
                              style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                              }}
                            >
                              {item.name}
                            </div>
                            <div 
                              className="text-xs font-light text-white/50 group-hover:text-white/70 transition-colors mb-2"
                              style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                              }}
                            >
                              {item.description}
                            </div>
                            <div 
                              className="text-xs font-light text-white/60 group-hover:text-white/80 transition-colors leading-relaxed"
                              style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                              }}
                            >
                              {item.presentation}
                            </div>
                          </div>
                        </div>
                        <div 
                          className="h-px w-0 group-hover:w-full transition-all duration-300"
                          style={{ backgroundColor: item.color }}
                        />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Ligne bleue en bas */}
            <div 
              className="h-px mx-4 mb-2"
              style={{ backgroundColor: blue, opacity: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

