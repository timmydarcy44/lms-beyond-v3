"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, BookOpen, Network, GraduationCap, Play, Music } from "lucide-react";

type EcosystemItem = {
  id: string;
  icon: typeof Heart;
  title: string;
  description: string;
  screenContent: {
    title: string;
    subtitle: string;
    image?: string;
    features: string[];
  };
};

const ecosystemItems: EcosystemItem[] = [
  {
    id: "beyond-center",
    icon: GraduationCap,
    title: "Beyond Center",
    description: "Titres professionnels, ateliers, formations, certifications.",
    screenContent: {
      title: "Beyond Center",
      subtitle: "Votre centre de formation",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
      features: [
        "Formations certifiantes",
        "Titres professionnels",
        "Accompagnement expert",
        "Réseau d'entreprises"
      ]
    }
  },
  {
    id: "beyond-care",
    icon: Heart,
    title: "Beyond Care",
    description: "Accompagnement émotionnel, psychopédagogie, gestion du stress, développement personnel.",
    screenContent: {
      title: "Beyond Care",
      subtitle: "Votre bien-être mental",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop",
      features: [
        "Questionnaires intelligents",
        "Suivi personnalisé",
        "Analyses prédictives",
        "Accompagnement 24/7"
      ]
    }
  },
  {
    id: "beyond-no-school",
    icon: BookOpen,
    title: "Beyond No School",
    description: "Plateforme de formation type Netflix, développement des compétences.",
    screenContent: {
      title: "Beyond No School",
      subtitle: "Apprenez à votre rythme",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
      features: [
        "Formations en ligne",
        "Contenu interactif",
        "Certifications",
        "Suivi de progression"
      ]
    }
  },
  {
    id: "beyond-connect",
    icon: Network,
    title: "Beyond Connect",
    description: "Système de matching pour le recrutement (IA).",
    screenContent: {
      title: "Beyond Connect",
      subtitle: "Trouvez votre emploi",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
      features: [
        "Matching intelligent",
        "Offres personnalisées",
        "CV optimisé",
        "Conseils carrière"
      ]
    }
  },
  {
    id: "beyond-play",
    icon: Play,
    title: "Beyond Play",
    description: "Gamification et apprentissage ludique.",
    screenContent: {
      title: "Beyond Play",
      subtitle: "Apprendre en jouant",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
      features: [
        "Badges et récompenses",
        "Défis personnalisés",
        "Progression gamifiée",
        "Apprentissage ludique"
      ]
    }
  },
  {
    id: "beyond-note",
    icon: Music,
    title: "Beyond Note",
    description: "Prise de notes intelligente et organisation.",
    screenContent: {
      title: "Beyond Note",
      subtitle: "Organisez vos notes",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
      features: [
        "Organisation intelligente",
        "Recherche avancée",
        "Partage facile",
        "Synchronisation"
      ]
    }
  }
];

export function EcosystemIPhone() {
  const [selectedItem, setSelectedItem] = useState<EcosystemItem>(ecosystemItems[0]);
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      {/* Left Side - Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
      >
        {/* Small gray header */}
        <div 
          className="text-xs font-light text-gray-400 uppercase tracking-widest"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
          }}
        >
          ÉCOSYSTÈME BEYOND
        </div>

        {/* Main heading */}
        <h3 
          className="text-6xl md:text-7xl font-bold leading-tight text-black"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            letterSpacing: '-0.03em',
            fontWeight: 700
          }}
        >
          {selectedItem.title}
        </h3>

        {/* Description */}
        <p 
          className="text-lg font-light text-gray-500 leading-relaxed"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
          }}
        >
          {selectedItem.description}
        </p>

        {/* CTA Button */}
        <div>
          <button
            className="px-8 py-4 rounded-full bg-black text-white font-light text-base hover:bg-gray-900 transition-colors"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
            }}
          >
            Découvrir {selectedItem.title}
          </button>
        </div>

        {/* Ecosystem Buttons - Horizontal row */}
        <div className="flex flex-wrap gap-3 pt-2">
          {ecosystemItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedItem.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 flex items-center gap-2 ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 bg-white text-black hover:border-gray-400'
                }`}
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-light">{item.title}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Right Side - Mobile Screens Carousel */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative w-full overflow-hidden"
      >
        {/* Phones Container - Horizontal scroll */}
        <div className="relative h-[500px] overflow-hidden">
          <motion.div
            className="flex items-center h-full"
            animate={{
              x: `-${ecosystemItems.findIndex(item => item.id === selectedItem.id) * (100 / ecosystemItems.length)}%`
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ width: `${ecosystemItems.length * 100}%` }}
          >
            {ecosystemItems.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 flex justify-center items-center px-8"
                style={{ width: `${100 / ecosystemItems.length}%` }}
              >
                <div className="relative w-[240px] h-[480px] rounded-[2.5rem] overflow-hidden shadow-2xl"
                  style={{ backgroundColor: "#000" }}
                >
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 pt-3 z-20">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-white rounded-sm" />
                      <div className="w-1 h-1 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="absolute inset-0 pt-12">
                    {/* App Header */}
                    <div className="px-5 pt-4 pb-3">
                      <h3 
                        className="text-2xl font-semibold text-white mb-1"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                        }}
                      >
                        {item.screenContent.title}
                      </h3>
                      <p 
                        className="text-sm text-gray-400 font-light"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                        }}
                      >
                        {item.screenContent.subtitle}
                      </p>
                    </div>

                    {/* Image */}
                    {item.screenContent.image && (
                      <div className="relative w-full h-44 mx-4 mt-3 rounded-xl overflow-hidden">
                        <Image
                          src={item.screenContent.image}
                          alt={item.screenContent.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Features List */}
                    <div className="px-5 mt-5 space-y-3">
                      {item.screenContent.features.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3"
                        >
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: blue }}
                          />
                          <span 
                            className="text-sm font-light"
                            style={{ 
                              color: blue,
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom CTA */}
                    <Link href={
                      item.id === "beyond-care" ? "/beyond-care" :
                      item.id === "beyond-no-school" ? "/beyond-no-school" :
                      item.id === "beyond-connect" ? "/beyond-connect" :
                      item.id === "beyond-play" ? "/beyond-play" :
                      item.id === "beyond-note" ? "/beyond-note" :
                      item.id === "beyond-center" ? "/beyond-center" :
                      "#"
                    }>
                      <div className="absolute bottom-6 left-5 right-5">
                        <div 
                          className="w-full py-3.5 rounded-xl text-center cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: blue }}
                        >
                          <span 
                            className="text-white text-sm font-medium"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            Découvrir
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mt-8">
          {ecosystemItems.map((item, index) => {
            const isActive = item.id === selectedItem.id;
            return (
              <button
                key={index}
                onClick={() => setSelectedItem(item)}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-8 h-2 bg-black'
                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

