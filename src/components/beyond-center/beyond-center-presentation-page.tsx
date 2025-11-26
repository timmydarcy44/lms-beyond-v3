"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Award, FileCheck, Users, Target, Building2, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";

export function BeyondCenterPresentationPage() {
  const centerColor = "#FF00FF";
  const white = "#FFFFFF";
  const black = "#000000";

  return (
    <div className="min-h-screen bg-white">
      <EcosystemHeader ecosystem="center" title="Beyond Center" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FF00FF]/10 via-white to-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
            alt="Beyond Center"
            fill
            className="object-cover opacity-20"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div 
                className="text-sm font-light uppercase tracking-wider"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  color: centerColor
                }}
              >
                Centre de formation
              </div>
              <h1 
                className="text-6xl md:text-7xl font-light leading-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Beyond Center
              </h1>
              <p 
                className="text-xl font-light text-gray-700 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Développez vos compétences avec un écosystème complet de formation. 
                Titres professionnels reconnus, certifications ministérielles, Open Badges et accompagnement expert pour votre réussite professionnelle.
              </p>
              <Link href="/beyond-center/login">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: centerColor,
                    color: white
                  }}
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                alt="Beyond Center"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Votre parcours de formation
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Award, 
                title: "Titres professionnels", 
                description: "Obtenez des titres professionnels reconnus par le ministère du Travail (niveaux 2, 3 et 4) pour valoriser vos compétences." 
              },
              { 
                icon: FileCheck, 
                title: "Open Badges", 
                description: "Certifiez vos compétences avec des Open Badges numériques reconnus et partageables sur vos réseaux professionnels." 
              },
              { 
                icon: GraduationCap, 
                title: "Formations certifiantes", 
                description: "Suivez des parcours de formation complets avec certification à la clé pour booster votre carrière." 
              },
              { 
                icon: Users, 
                title: "Accompagnement expert", 
                description: "Bénéficiez d'un suivi personnalisé par des formateurs experts tout au long de votre parcours." 
              },
              { 
                icon: Building2, 
                title: "Réseau d'entreprises", 
                description: "Accédez à notre réseau d'entreprises partenaires pour vos stages, alternances et opportunités d'emploi." 
              },
              { 
                icon: Target, 
                title: "Orientation personnalisée", 
                description: "Trouvez le parcours qui correspond à vos objectifs professionnels grâce à notre accompagnement sur mesure." 
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 rounded-2xl border border-gray-200 hover:border-[#FF00FF] hover:shadow-lg transition-all"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${centerColor}15` }}
                  >
                    <Icon className="h-8 w-8" style={{ color: centerColor }} />
                  </div>
                  <h3 
                    className="text-xl font-light mb-3 text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p 
                    className="text-gray-600 font-light leading-relaxed"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black">
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
            <p 
              className="text-xl text-white/70 font-light mb-12"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Rejoignez Beyond Center et transformez votre avenir professionnel
            </p>
            <Link href="/beyond-center/login">
              <Button 
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-light"
                style={{ 
                  backgroundColor: white,
                  color: centerColor
                }}
              >
                Découvrir Beyond Center
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

