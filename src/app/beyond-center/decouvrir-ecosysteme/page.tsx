"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { GraduationCap, Heart, Network, Play, Music, Sparkles } from "lucide-react";
import Image from "next/image";

const ECOSYSTEMS = [
  {
    id: "no-school",
    name: "Beyond No School",
    icon: GraduationCap,
    href: "/beyond-no-school",
    color: "#006CFF",
    delay: 0,
  },
  {
    id: "care",
    name: "Beyond Care",
    icon: Heart,
    href: "/beyond-care",
    color: "#FF6B6B",
    delay: 0.2,
  },
  {
    id: "connect",
    name: "Beyond Connect",
    icon: Network,
    href: "/beyond-connect",
    color: "#4ECDC4",
    delay: 0.4,
  },
  {
    id: "play",
    name: "Beyond Play",
    icon: Play,
    href: "/beyond-play",
    color: "#FFE66D",
    delay: 0.6,
  },
  {
    id: "note",
    name: "Beyond Note",
    icon: Music,
    href: "/beyond-note",
    color: "#A8E6CF",
    delay: 0.8,
  },
  {
    id: "center",
    name: "Beyond Center",
    icon: Sparkles,
    href: "/beyond-center",
    color: "#006CFF",
    delay: 1.0,
  },
];

export default function DecouvrirEcosystemePage() {
  const [visibleLogos, setVisibleLogos] = useState<Set<string>>(new Set());
  const [allVisible, setAllVisible] = useState(false);

  useEffect(() => {
    // Afficher les logos les uns après les autres
    ECOSYSTEMS.forEach((ecosystem) => {
      setTimeout(() => {
        setVisibleLogos((prev) => new Set(prev).add(ecosystem.id));
      }, ecosystem.delay * 1000);
    });

    // Marquer tous comme visibles après le dernier
    setTimeout(() => {
      setAllVisible(true);
    }, (ECOSYSTEMS[ECOSYSTEMS.length - 1].delay + 0.5) * 1000);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Fond avec effet de particules subtil */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 
            className="text-5xl md:text-7xl font-light text-white mb-4"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              letterSpacing: '-0.03em'
            }}
          >
            Découvrez l'écosystème
          </h1>
          <p 
            className="text-xl text-white/60 font-light"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
            }}
          >
            Cliquez sur un logo pour explorer
          </p>
        </motion.div>

        {/* Grille des logos */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          {ECOSYSTEMS.map((ecosystem) => {
            const Icon = ecosystem.icon;
            const isVisible = visibleLogos.has(ecosystem.id);

            return (
              <Link key={ecosystem.id} href={ecosystem.href}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 50 }}
                  animate={
                    isVisible
                      ? {
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }
                      : {
                          opacity: 0,
                          scale: 0.5,
                          y: 50,
                        }
                  }
                  transition={{
                    duration: 0.6,
                    delay: ecosystem.delay,
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{
                    scale: 1.1,
                    y: -10,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center justify-center cursor-pointer group"
                >
                  {/* Cercle avec icône */}
                  <div
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-2xl"
                    style={{
                      backgroundColor: `${ecosystem.color}20`,
                      border: `2px solid ${ecosystem.color}40`,
                    }}
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon
                        className="h-16 w-16 md:h-20 md:w-20"
                        style={{ color: ecosystem.color }}
                      />
                    </motion.div>
                  </div>

                  {/* Nom */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={
                      allVisible
                        ? {
                            opacity: 1,
                          }
                        : {
                            opacity: 0,
                          }
                    }
                    transition={{ delay: ecosystem.delay + 0.3 }}
                    className="text-center"
                  >
                    <p
                      className="text-lg md:text-xl font-light text-white group-hover:text-white transition-colors"
                      style={{
                        fontFamily:
                          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      {ecosystem.name}
                    </p>
                  </motion.div>

                  {/* Ligne de soulignement animée */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={
                      allVisible
                        ? {
                            width: "100%",
                          }
                        : {
                            width: 0,
                          }
                    }
                    transition={{ delay: ecosystem.delay + 0.5, duration: 0.5 }}
                    className="h-px mt-2"
                    style={{ backgroundColor: ecosystem.color }}
                  />
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Message d'invitation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={
            allVisible
              ? {
                  opacity: 1,
                }
              : {
                  opacity: 0,
                }
          }
          transition={{ delay: 1.5 }}
          className="text-center mt-16"
        >
          <p
            className="text-white/40 font-light text-sm"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            Cliquez sur un écosystème pour en savoir plus
          </p>
        </motion.div>
      </div>
    </div>
  );
}

