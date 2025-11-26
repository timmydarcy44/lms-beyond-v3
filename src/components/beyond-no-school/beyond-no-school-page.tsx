"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Clock, Award, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";

// Mock formations data - Style Netflix
const formations = [
  {
    id: "1",
    title: "Développement Web Full Stack",
    category: "Informatique",
    duration: "40h",
    level: "Intermédiaire",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop",
    rating: 4.8
  },
  {
    id: "2",
    title: "Marketing Digital Avancé",
    category: "Marketing",
    duration: "30h",
    level: "Avancé",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
    rating: 4.9
  },
  {
    id: "3",
    title: "Gestion de Projet Agile",
    category: "Management",
    duration: "25h",
    level: "Débutant",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    rating: 4.7
  },
  {
    id: "4",
    title: "Data Science & IA",
    category: "Informatique",
    duration: "50h",
    level: "Avancé",
    image: "https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=2032&auto=format&fit=crop",
    rating: 4.9
  },
  {
    id: "5",
    title: "Communication Interpersonnelle",
    category: "Soft Skills",
    duration: "20h",
    level: "Tous niveaux",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    rating: 4.6
  },
  {
    id: "6",
    title: "Finance pour Non-Financiers",
    category: "Finance",
    duration: "35h",
    level: "Débutant",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    rating: 4.8
  }
];

export function BeyondNoSchoolPage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black">
      <EcosystemHeader ecosystem="no-school" title="Beyond No School" />
      {/* Hero Section - Style Netflix */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
            alt="Beyond No School"
            fill
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 
              className="text-7xl md:text-9xl font-bold leading-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.04em',
                fontWeight: 700
              }}
            >
              Beyond No School
            </h1>
            <p 
              className="text-2xl md:text-3xl font-light mb-12 text-white/90 max-w-3xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Apprenez à votre rythme, où vous voulez, quand vous voulez
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/catalogue">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: white,
                    color: black
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Commencer à apprendre
                </Button>
              </Link>
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  size="lg"
                  variant="outline"
                  className="rounded-full px-10 py-7 text-lg font-light border-2 border-white/30 text-white hover:bg-white/10"
                >
                  En savoir plus
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Section - Style Netflix */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h2 
              className="text-3xl md:text-4xl font-light text-white mb-2"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Formations populaires
            </h2>
          </motion.div>

          {/* Horizontal Scroll Container */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {formations.map((formation, index) => (
                <motion.div
                  key={formation.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredCard(formation.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="flex-shrink-0 w-[300px] group cursor-pointer"
                >
                  <Link href={`/dashboard/catalogue/module/${formation.id}`}>
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                      <Image
                        src={formation.image}
                        alt={formation.title}
                        fill
                        className={`object-cover transition-transform duration-500 ${
                          hoveredCard === formation.id ? 'scale-110' : 'scale-100'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      
                      {/* Play Button Overlay */}
                      {hoveredCard === formation.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div 
                            className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/30"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                          >
                            <Play className="h-10 w-10 text-white ml-1" fill="white" />
                          </div>
                        </motion.div>
                      )}

                      {/* Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="text-xs font-light text-white/80 px-2 py-1 rounded"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                          >
                            {formation.category}
                          </span>
                          <span className="text-xs text-white/60">•</span>
                          <span className="text-xs text-white/60">{formation.duration}</span>
                        </div>
                        <h3 
                          className="text-lg font-medium text-white mb-1 line-clamp-2"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          {formation.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/80">⭐ {formation.rating}</span>
                          <span className="text-xs text-white/60">•</span>
                          <span className="text-xs text-white/60">{formation.level}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Sections - Style Netflix */}
      {["Informatique", "Marketing", "Soft Skills"].map((category, catIndex) => (
        <section key={category} className="py-12 bg-black">
          <div className="max-w-7xl mx-auto px-6">
            <h3 
              className="text-2xl font-light text-white mb-6"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              {category}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-6">
              {formations
                .filter(f => f.category === category)
                .map((formation) => (
                  <motion.div
                    key={formation.id}
                    whileHover={{ scale: 1.05, y: -8 }}
                    className="flex-shrink-0 w-[250px] cursor-pointer"
                  >
                    <Link href={`/dashboard/catalogue/module/${formation.id}`}>
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                        <Image
                          src={formation.image}
                          alt={formation.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="text-sm font-medium text-white line-clamp-2">{formation.title}</h4>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA Section */}
      <section className="py-32 bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 
              className="text-4xl md:text-6xl font-light mb-6 text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Prêt à développer<br />
              vos compétences ?
            </h2>
            <Link href="/dashboard/catalogue">
              <Button 
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-light"
                style={{ 
                  backgroundColor: white,
                  color: black
                }}
              >
                Explorer le catalogue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
