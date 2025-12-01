"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Brain, BarChart3, Calendar, Users, Shield, TrendingUp } from "lucide-react";
import Image from "next/image";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";
import { env } from "@/lib/env";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Beyond Center";

export function BeyondCarePage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";

  return (
    <div className="min-h-screen bg-white">
      <EcosystemHeader ecosystem="care" title="Beyond Care" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#FF6B6B]/10 via-white to-white">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop"
            alt="Beyond Care"
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
                className="text-sm font-light text-[#FF6B6B] uppercase tracking-wider"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Santé mentale et bien-être
              </div>
              <h1 
                className="text-6xl md:text-7xl font-light leading-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Beyond Care
              </h1>
              <p 
                className="text-xl font-light text-gray-700 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Accompagnez votre bien-être mental avec des outils intelligents et un suivi personnalisé. 
                Questionnaires propriétaires, analyses prédictives et conseils psychopédagogiques pour votre développement personnel.
              </p>
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: black,
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
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=2070&auto=format&fit=crop"
                alt="Beyond Care"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* iPhone Screens Section */}
      <section className="py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div 
                className="text-sm font-light text-[#FF6B6B] uppercase tracking-wider"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Application Mobile
              </div>
              
              <h2 
                className="text-5xl md:text-6xl font-light leading-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Suivez votre bien-être<br />
                en temps réel
              </h2>
              
              <p 
                className="text-xl font-light text-gray-700 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Accédez à votre espace de bien-être mental où que vous soyez. Répondez aux questionnaires, consultez vos analyses et recevez des conseils personnalisés directement depuis votre smartphone.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${blue}15` }}>
                    <Heart className="w-4 h-4" style={{ color: blue }} />
                  </div>
                  <div>
                    <h3 
                      className="text-lg font-medium text-black mb-1"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Questionnaires intelligents
                    </h3>
                    <p 
                      className="text-gray-600 font-light"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Évaluez votre état mental en quelques minutes avec notre questionnaire propriétaire basé sur les dernières recherches.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${blue}15` }}>
                    <BarChart3 className="w-4 h-4" style={{ color: blue }} />
                  </div>
                  <div>
                    <h3 
                      className="text-lg font-medium text-black mb-1"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Analyses détaillées
                    </h3>
                    <p 
                      className="text-gray-600 font-light"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Visualisez vos progrès avec des graphiques de tendances et des insights personnalisés pour mieux comprendre votre évolution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${blue}15` }}>
                    <Brain className="w-4 h-4" style={{ color: blue }} />
                  </div>
                  <div>
                    <h3 
                      className="text-lg font-medium text-black mb-1"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Accompagnement 24/7
                    </h3>
                    <p 
                      className="text-gray-600 font-light"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      Recevez des conseils et recommandations adaptés à votre profil, disponibles à tout moment pour votre bien-être.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/beyond-center/pre-inscription">
                  <Button 
                    size="lg"
                    className="rounded-full px-8 py-6 text-base font-light"
                    style={{ 
                      backgroundColor: black,
                      color: white
                    }}
                  >
                    Télécharger l'application
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Side - iPhone Screens */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-8 items-center"
            >
              {/* iPhone 1 - Questionnaire Screen */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative"
              >
                <div className="relative w-[280px] h-[560px] rounded-[3rem] overflow-hidden shadow-2xl bg-black p-2">
                  <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#FF6B6B]/10 via-white to-white">
                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 pt-3 z-20 bg-white/80 backdrop-blur-sm">
                      <span className="text-black text-xs font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 border border-black rounded-sm" />
                        <div className="w-1 h-1 bg-black rounded-full" />
                      </div>
                    </div>

                    {/* Screen Content - Questionnaire UI */}
                    <div className="relative w-full h-full pt-12 bg-gradient-to-br from-[#FF6B6B]/5 to-white">
                      <div className="px-6 pt-8 pb-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${blue}20` }}>
                            <Heart className="w-6 h-6" style={{ color: blue }} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-black">Questionnaire</h3>
                            <p className="text-xs text-gray-500">État mental</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full" style={{ width: '60%' }} />
                          </div>
                          <p className="text-sm text-gray-600">Question 6 sur 10</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                          <p className="text-base font-medium text-black mb-4">
                            Comment vous sentez-vous aujourd'hui ?
                          </p>
                          <div className="space-y-3">
                            {['Très bien', 'Bien', 'Moyen', 'Pas bien'].map((option, i) => (
                              <div key={i} className="p-3 rounded-xl border border-gray-200 hover:border-[#FF6B6B] transition-colors cursor-pointer">
                                <p className="text-sm text-gray-700">{option}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* iPhone 2 - Analytics Screen */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative"
              >
                <div className="relative w-[280px] h-[560px] rounded-[3rem] overflow-hidden shadow-2xl bg-black p-2">
                  <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-white via-white to-[#FF6B6B]/5">
                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 pt-3 z-20 bg-white/80 backdrop-blur-sm">
                      <span className="text-black text-xs font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 border border-black rounded-sm" />
                        <div className="w-1 h-1 bg-black rounded-full" />
                      </div>
                    </div>

                    {/* Screen Content - Analytics UI */}
                    <div className="relative w-full h-full pt-12 bg-white">
                      <div className="px-6 pt-8 pb-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-semibold text-black">Mes Analyses</h3>
                            <p className="text-xs text-gray-500">Évolution sur 30 jours</p>
                          </div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${blue}20` }}>
                            <BarChart3 className="w-5 h-5" style={{ color: blue }} />
                          </div>
                        </div>

                        {/* Chart Area */}
                        <div className="bg-gradient-to-br from-[#FF6B6B]/10 to-white rounded-2xl p-6 mb-4">
                          <div className="h-32 flex items-end justify-between gap-2 mb-4">
                            {[40, 55, 45, 60, 50, 65, 70].map((height, i) => (
                              <div key={i} className="flex-1 flex flex-col items-center">
                                <div 
                                  className="w-full rounded-t-lg mb-2"
                                  style={{ 
                                    height: `${height}%`,
                                    background: `linear-gradient(to top, ${blue}, ${blue}80)`
                                  }}
                                />
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Lun</span>
                            <span>Mer</span>
                            <span>Ven</span>
                            <span>Dim</span>
                          </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="space-y-3">
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Bien-être moyen</p>
                                <p className="text-2xl font-semibold text-black">72%</p>
                              </div>
                              <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Progression</p>
                                <p className="text-2xl font-semibold text-black">+12%</p>
                              </div>
                              <Heart className="w-5 h-5" style={{ color: '#FF6B6B' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
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
              Vos outils de bien-être
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Brain, 
                title: "Questionnaire d'état mental naturel", 
                description: "Évaluez votre état mental avec notre questionnaire propriétaire basé sur les dernières recherches en psychologie." 
              },
              { 
                icon: Calendar, 
                title: "Questionnaire hebdomadaire", 
                description: "Suivez votre évolution semaine après semaine avec des questionnaires réguliers pour détecter les tendances." 
              },
              { 
                icon: BarChart3, 
                title: "Suivi analytique", 
                description: "Visualisez vos progrès avec des analyses détaillées et des graphiques de tendances sur le long terme." 
              },
              { 
                icon: Users, 
                title: "Conseils personnalisés", 
                description: "Recevez des recommandations adaptées à votre profil et à votre situation personnelle." 
              },
              { 
                icon: Heart, 
                title: "Psychopédagogie", 
                description: "Bénéficiez d'un accompagnement psychopédagogique pour développer vos compétences émotionnelles." 
              },
              { 
                icon: Shield, 
                title: "Confidentialité garantie", 
                description: "Vos données sont protégées et votre intimité respectée dans un environnement sécurisé." 
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
                  className="p-8 rounded-2xl border border-gray-200 hover:border-[#FF6B6B] hover:shadow-lg transition-all"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${blue}15` }}
                  >
                    <Icon className="h-8 w-8" style={{ color: blue }} />
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
              Prenez soin de votre<br />
              bien-être mental
            </h2>
            <p 
              className="text-xl text-white/70 font-light mb-12"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Commencez votre parcours vers un meilleur équilibre mental
            </p>
            <Link href="/beyond-center/pre-inscription">
              <Button 
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-light"
                style={{ 
                  backgroundColor: white,
                  color: black
                }}
              >
                Découvrir Beyond Care
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
