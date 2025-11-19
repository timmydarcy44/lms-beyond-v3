"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex overflow-hidden">
      {/* Côté gauche - Formes abstraites style Revolut */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Formes arrondies abstraites flottantes */}
        <div className="absolute inset-0">
          {/* Grande forme bleue en haut à droite */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-400/20 blur-3xl"
          />
          
          {/* Forme violette en bas à gauche */}
          <motion.div
            animate={{
              y: [0, 15, 0],
              x: [0, -10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-400/20 blur-3xl"
          />
          
          {/* Forme moyenne cyan au centre */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/2 left-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-400/15 blur-2xl"
          />
          
          {/* Petites formes décoratives */}
          <motion.div
            animate={{
              y: [0, 20, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-1/4 h-32 w-32 rounded-[3rem] bg-gradient-to-br from-blue-500/20 to-purple-400/15 blur-xl"
          />
          
          <motion.div
            animate={{
              y: [0, -25, 0],
              rotate: [0, -5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
            className="absolute bottom-1/3 right-1/3 h-40 w-40 rounded-[4rem] bg-gradient-to-br from-purple-500/25 to-pink-400/15 blur-xl"
          />
        </div>
        
        {/* Logo Beyond centré */}
        <div className="relative z-10 flex h-full w-full items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <h1 
              className="text-7xl font-bold tracking-tight text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
                letterSpacing: '-0.03em',
              }}
            >
              Beyond
            </h1>
            <p className="mt-4 text-lg font-light text-white/70 tracking-wide">
              L&apos;apprentissage réinventé
            </p>
          </motion.div>
        </div>
      </div>

      {/* Côté droit - Formulaire */}
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 lg:w-1/2">
        {/* Formes subtiles sur mobile */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 w-full max-w-md px-6 py-12">
          {children}
        </div>
      </div>
    </div>
  );
}

