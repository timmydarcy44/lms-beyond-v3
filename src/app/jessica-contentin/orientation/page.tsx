"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Target, GraduationCap, FileText, Briefcase, CheckCircle2, UserCheck, Search, PenTool, FileCheck, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import { InternalLinks } from "@/components/jessica-contentin/internal-links";
import Script from "next/script";
import Link from "next/link";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const processSteps = [
  {
    step: 1,
    icon: UserCheck,
    title: "Premier rendez-vous",
    description: "Un premier échange pour comprendre vos questionnements, vos aspirations et vos besoins spécifiques en matière d'orientation. Ce moment permet d'établir une relation de confiance et de définir ensemble les objectifs de l'accompagnement.",
  },
  {
    step: 2,
    icon: Award,
    title: "Test des soft skills",
    description: "Évaluation approfondie de vos compétences comportementales et transversales. Ce test permet d'identifier vos forces, vos talents naturels et vos axes de développement pour mieux orienter vos choix professionnels.",
  },
  {
    step: 3,
    icon: Briefcase,
    title: "Travail sur les perspectives métiers",
    description: "Exploration approfondie des différents secteurs d'activité et des métiers en lien avec votre profil. Nous analysons ensemble les opportunités, les débouchés et les parcours de formation possibles pour chaque piste identifiée.",
  },
  {
    step: 4,
    icon: FileText,
    title: "Rédaction d'un projet d'orientation",
    description: "Élaboration d'un projet d'orientation structuré et personnalisé qui synthétise vos aspirations, vos compétences identifiées et les pistes métiers retenues. Ce document servira de fil conducteur pour vos choix futurs.",
  },
  {
    step: 5,
    icon: FileCheck,
    title: "Mise en place de Parcoursup",
    description: "Accompagnement complet dans la construction de votre dossier Parcoursup. Nous travaillons ensemble sur la sélection des formations, l'ordre des vœux et la stratégie d'inscription pour maximiser vos chances d'admission.",
  },
  {
    step: 6,
    icon: PenTool,
    title: "Travail sur la lettre de motivation et le CV",
    description: "Rédaction et optimisation de votre lettre de motivation et de votre CV. Le classement des soft skills identifiés lors du test facilite la mise en valeur de vos compétences et de votre personnalité, rendant vos candidatures plus impactantes et authentiques.",
  },
];

export default function OrientationPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-[#E6D9C6]/20 to-[#F8F5F0]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C6A664]/10 rounded-full mb-6">
              <GraduationCap className="h-5 w-5 text-[#C6A664]" />
              <span
                className="text-sm font-semibold text-[#C6A664]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Orientation scolaire et professionnelle
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Orientation Scolaire et Professionnelle - Accompagnement Parcoursup | Psychopédagogue Caen
            </h1>
            <p
              className="text-xl md:text-2xl text-[#2F2A25]/80 max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Accompagnement personnalisé à l'<strong>orientation scolaire et professionnelle</strong> à Caen. <strong>Test soft skills</strong>, travail sur perspectives métiers, rédaction projet orientation, aide <strong>Parcoursup</strong>, CV et lettre de motivation. Cabinet Jessica CONTENTIN, Fleury-sur-Orne.
            </p>
          </motion.div>
          </div>
      </section>

      {/* Présentation de l'expérience */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-[#E6D9C6] bg-white shadow-lg">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-[#E6D9C6]/30 rounded-lg">
                    <GraduationCap className="h-8 w-8 text-[#C6A664]" />
                      </div>
                  <div>
                    <h2
                      className="text-2xl md:text-3xl font-bold text-[#2F2A25] mb-4"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                      Mon expérience
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-[#2F2A25]/80 leading-relaxed space-y-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      <p>
                        En qualité de <strong>professeure certifiée</strong>, j'ai développé une solide expérience dans l'accompagnement des jeunes dans le choix de leur orientation, notamment pour l'orientation post-bac et la plateforme Parcoursup.
                      </p>
                      <p>
                        Mon expertise pédagogique et ma connaissance approfondie du système éducatif français me permettent d'accompagner les lycéens et étudiants dans cette étape cruciale de leur parcours. Je comprends les enjeux, les contraintes et les opportunités du système d'orientation actuel, ce qui me permet d'offrir un accompagnement à la fois personnalisé et stratégique.
                      </p>
                      <p>
                        Mon approche combine une écoute attentive, une analyse approfondie du profil de chaque jeune et une méthodologie structurée pour les guider vers des choix éclairés et épanouissants.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Processus d'accompagnement */}
      <section className="py-16 md:py-20 bg-white/50">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Mon processus d'accompagnement
            </h2>
            <p
              className="text-lg text-[#2F2A25]/70 max-w-2xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Un parcours structuré en 6 étapes pour vous accompagner vers une orientation réussie
            </p>
          </motion.div>

          <div className="space-y-8">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Ligne de connexion (sauf pour le dernier) */}
                  {index < processSteps.length - 1 && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-[#E6D9C6] hidden md:block" />
                  )}
                  
                  <div className="flex gap-6 md:gap-8">
                    {/* Numéro et icône */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#C6A664] to-[#B88A44] flex items-center justify-center shadow-lg z-10 relative">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[#E6D9C6] flex items-center justify-center">
                          <span
                            className="text-sm font-bold text-[#2F2A25]"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {step.step}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 pt-2">
                      <Card className="border-[#E6D9C6] bg-white shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 md:p-8">
                          <h3
                            className="text-xl md:text-2xl font-bold text-[#2F2A25] mb-3"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {step.title}
                          </h3>
                          <p
                            className="text-[#2F2A25]/80 leading-relaxed"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {step.description}
                    </p>
                  </CardContent>
                </Card>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section Avantages */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Pourquoi choisir cet accompagnement ?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: "Approche personnalisée",
                description: "Chaque accompagnement est adapté à votre profil unique, vos aspirations et vos contraintes.",
              },
              {
                icon: CheckCircle2,
                title: "Méthodologie éprouvée",
                description: "Un processus structuré et testé qui vous guide étape par étape vers vos objectifs.",
              },
              {
                icon: Search,
                title: "Connaissance du système",
                description: "Maîtriser Parcoursup et les parcours de formation pour optimiser vos candidatures.",
              },
            ].map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="border-[#E6D9C6] bg-white h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="p-3 bg-[#E6D9C6]/30 rounded-lg w-fit mb-4">
                        <Icon className="h-6 w-6 text-[#C6A664]" />
                      </div>
                      <h3
                        className="text-xl font-bold text-[#2F2A25] mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {advantage.title}
                      </h3>
                    <p
                        className="text-[#2F2A25]/70"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                        {advantage.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#E6D9C6]/30 to-[#F8F5F0] rounded-3xl p-8 md:p-12 text-center"
          >
            <CheckCircle2 className="h-16 w-16 text-[#C6A664] mx-auto mb-6" />
            <h2
              className="text-3xl md:text-4xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Prêt à construire votre projet d'orientation ?
            </h2>
            <p
              className="text-lg md:text-xl text-[#2F2A25]/80 mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Prenez rendez-vous pour un premier échange et découvrez comment je peux vous accompagner dans cette étape importante de votre parcours.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg transition-transform hover:scale-105"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Maillage interne SEO */}
      <InternalLinks currentPage="orientation" />

      {/* Structured Data */}
      <Script
        id="structured-data-educational-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOccupationalProgram",
            "name": "Accompagnement à l'orientation scolaire et professionnelle",
            "description": "Accompagnement personnalisé pour l'orientation scolaire et professionnelle avec test soft skills, aide Parcoursup, rédaction CV et lettre de motivation.",
            "provider": {
              "@type": "Person",
              "name": "Jessica CONTENTIN",
            },
            "programType": "EducationalOccupationalProgram",
            "occupationalCategory": "Orientation scolaire",
            "areaServed": {
              "@type": "City",
              "name": "Caen",
            },
          }),
        }}
      />
    </div>
  );
}
