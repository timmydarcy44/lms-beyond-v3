"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Network, Clock, Target, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";

export function BeyondConnectLandingPage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";
  const [showNotification, setShowNotification] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      <EcosystemHeader ecosystem="connect" title="Beyond Connect" />
      {/* Hero Section */}
      <section className="relative py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div 
                className="text-sm font-light text-gray-500 uppercase tracking-wider"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Optimisation du recrutement
              </div>
              <h1 
                className="text-6xl md:text-7xl font-light leading-tight text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Beyond Connect
              </h1>
              <p 
                className="text-xl font-light text-gray-700 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Trouvez le candidat idéal ou le poste de vos rêves grâce à notre système de matching intelligent. 
                Gain de temps, réduction des mauvais recrutements, résultats garantis.
              </p>
              <Link href="/beyond-connect">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: black,
                    color: white
                  }}
                >
                  Découvrir Beyond Connect
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Phone Mockup with Notification */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative flex justify-center items-center"
            >
              <div className="relative w-[280px] h-[560px] rounded-[3rem] overflow-hidden shadow-2xl bg-black p-2">
                {/* Phone Screen */}
                <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white">
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 pt-3 z-20 bg-white">
                    <span className="text-black text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-black rounded-sm" />
                      <div className="w-1 h-1 bg-black rounded-full" />
                    </div>
                  </div>

                  {/* Notification */}
                  {showNotification && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="absolute top-16 left-4 right-4 z-30 bg-white rounded-xl shadow-2xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${blue}15` }}
                        >
                          <Network className="h-6 w-6" style={{ color: blue }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span 
                              className="text-xs font-medium text-black"
                              style={{ 
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                              }}
                            >
                              Beyond Connect
                            </span>
                            <span className="text-xs text-gray-400">Maintenant</span>
                          </div>
                          <p 
                            className="text-sm font-light text-gray-800 leading-relaxed"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            Un nouveau profil match avec votre offre
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <div className="w-6 h-6 rounded-full bg-gray-200" />
                              <span className="text-xs text-gray-600">Marie D.</span>
                            </div>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">95% de compatibilité</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowNotification(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* App Content */}
                  <div className="absolute inset-0 pt-12 bg-gradient-to-b from-gray-50 to-white">
                    <div className="p-6 space-y-6">
                      <div>
                        <h3 
                          className="text-2xl font-light text-black mb-2"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          Vos offres
                        </h3>
                        <p className="text-sm text-gray-600">3 candidats en attente</p>
                      </div>

                      {/* Match Card */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200" />
                          <div className="flex-1">
                            <div className="font-medium text-black text-sm">Marie Dubois</div>
                            <div className="text-xs text-gray-500">Développeuse Full Stack</div>
                          </div>
                          <div 
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${blue}15`, color: blue }}
                          >
                            95%
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="flex-1 py-2 rounded-lg text-sm font-medium border-2"
                            style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                          >
                            Voir
                          </button>
                          <button 
                            className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                            style={{ backgroundColor: blue }}
                          >
                            Contacter
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-gray-50">
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
              Pourquoi Beyond Connect ?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Clock, 
                title: "Gain de temps", 
                description: "Fini les heures passées à trier des CVs. Notre IA fait le matching pour vous en quelques secondes." 
              },
              { 
                icon: Target, 
                title: "Réduction des mauvais recrutements", 
                description: "Notre algorithme analyse la compatibilité réelle entre le profil et le poste pour éviter les erreurs." 
              },
              { 
                icon: TrendingUp, 
                title: "Résultats garantis", 
                description: "Augmentez votre taux de recrutement réussi grâce à des matchs précis et pertinents." 
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-black transition-all"
                >
                  <Icon className="h-12 w-12 mb-6" style={{ color: blue }} />
                  <h3 
                    className="text-xl font-light mb-3 text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {benefit.title}
                  </h3>
                  <p 
                    className="text-gray-600 font-light leading-relaxed"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {benefit.description}
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
              Trouvez votre match<br />
              parfait
            </h2>
            <Link href="/beyond-connect">
              <Button 
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-light"
                style={{ 
                  backgroundColor: white,
                  color: black
                }}
              >
                Découvrir Beyond Connect
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
