"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Heart, Users, BookOpen, Shield, Target, Lightbulb, Baby, GraduationCap, BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { InternalLinks } from "@/components/jessica-contentin/internal-links";
import Script from "next/script";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialites = [
  {
    id: "confiance-en-soi",
    title: "Gestion de la confiance en soi",
    icon: Heart,
    description: "Renforcement de l'estime de soi et développement de la confiance personnelle.",
    presentation: "Un accompagnement personnalisé pour identifier vos forces, surmonter vos doutes et développer une image positive de vous-même. Ensemble, nous travaillons sur la valorisation de vos réussites et le renforcement de votre assertivité.",
  },
  {
    id: "gestion-stress",
    title: "Gestion du stress",
    icon: Brain,
    description: "Techniques et stratégies pour mieux gérer le stress au quotidien.",
    presentation: "Apprenez à identifier les sources de votre stress et développez des outils concrets pour y faire face. Techniques de relaxation, gestion du temps et stratégies d'adaptation pour retrouver sérénité et équilibre dans votre vie quotidienne.",
  },
  {
    id: "tnd",
    title: "Accompagnement TND",
    icon: Users,
    description: "Accompagnement spécialisé pour les troubles du neurodéveloppement (DYS, TDA-H).",
    presentation: "Un accompagnement adapté aux besoins spécifiques des enfants et adolescents présentant des troubles DYS ou TDA-H. Stratégies d'apprentissage personnalisées, soutien à l'inclusion scolaire et collaboration avec les équipes éducatives pour favoriser la réussite.",
  },
  {
    id: "guidance-parentale",
    title: "Guidance parentale",
    icon: Baby,
    description: "Soutien et conseils pour les parents dans leur rôle éducatif.",
    presentation: "Un espace d'écoute et de conseils pour vous accompagner dans votre rôle de parent. Stratégies éducatives adaptées, gestion des conflits familiaux et renforcement du lien parent-enfant pour créer un environnement familial épanouissant.",
  },
  {
    id: "tests",
    title: "Tests de connaissance de soi",
    icon: BookOpen,
    description: "Évaluations et bilans pour mieux se connaître et identifier ses forces.",
    presentation: "Des bilans psychopédagogiques approfondis pour mieux comprendre vos compétences, identifier vos forces et vos axes d'amélioration. Des recommandations personnalisées pour orienter votre parcours et développer votre potentiel.",
  },
  {
    id: "harcelement",
    title: "Harcèlement Scolaire",
    icon: Shield,
    description: "Accompagnement et soutien face au harcèlement scolaire.",
    presentation: "Un accompagnement bienveillant et sécurisant pour les enfants et adolescents confrontés au harcèlement. Écoute, soutien psychologique et stratégies de protection pour retrouver confiance et sérénité, avec une collaboration étroite avec l'école et la famille.",
  },
  {
    id: "orientation",
    title: "Orientation scolaire",
    icon: Target,
    description: "Aide à l'orientation et au choix de parcours scolaire et professionnel.",
    presentation: "Un bilan d'orientation personnalisé pour identifier vos intérêts, compétences et aspirations. Exploration des métiers et formations, aide à la décision et accompagnement dans vos démarches pour construire un projet d'avenir qui vous correspond.",
  },
  {
    id: "therapie",
    title: "Thérapie psycho-émotionnelle",
    icon: Lightbulb,
    description: "Accompagnement thérapeutique pour la gestion des émotions.",
    presentation: "Un accompagnement thérapeutique pour mieux comprendre et gérer vos émotions. Techniques de régulation émotionnelle, gestion de l'anxiété et travail sur les traumatismes pour développer votre résilience et retrouver un équilibre émotionnel.",
  },
  {
    id: "neuroeducation",
    title: "Neuroéducation",
    icon: GraduationCap,
    description: "Approche basée sur les neurosciences pour optimiser les apprentissages.",
    presentation: "Une approche innovante qui s'appuie sur les dernières découvertes en neurosciences pour optimiser les processus d'apprentissage. Comprendre comment fonctionne le cerveau pour développer des stratégies d'apprentissage efficaces et adaptées à chacun.",
  },
  {
    id: "strategie-apprentissage",
    title: "Stratégie d'apprentissage",
    icon: BookMarked,
    description: "Développement de méthodes et techniques d'apprentissage personnalisées.",
    presentation: "Des méthodes et techniques d'apprentissage adaptées à votre profil et à vos besoins. Organisation du travail, mémorisation, concentration et gestion du temps pour développer votre autonomie et améliorer vos performances scolaires ou professionnelles.",
  },
];

export default function SpecialitesPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-20 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1
              className="text-5xl md:text-6xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Mes Spécialités en Psychopédagogie - Troubles DYS, TDA-H, Harcèlement scolaire | Caen
            </h1>
            <p
              className="text-xl text-[#2F2A25]/80 max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Un accompagnement personnalisé adapté à chaque besoin spécifique. Découvrez mes spécialités : <strong>accompagnement TND (troubles DYS, TDA-H)</strong>, <strong>harcèlement scolaire</strong>, <strong>phobie scolaire</strong>, <strong>gestion des émotions</strong>, <strong>confiance en soi</strong>, <strong>orientation scolaire</strong> et <strong>neuroéducation</strong>. Cabinet à Fleury-sur-Orne, près de Caen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grille des spécialités */}
      <section className="py-8 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {specialites.map((specialite, index) => {
              const Icon = specialite.icon;
              return (
                <motion.div
                  key={specialite.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/jessica-contentin/specialites/${specialite.id}`}>
                    <Card className="border-[#E6D9C6] bg-white hover:shadow-xl transition-all hover:border-[#C6A664] cursor-pointer h-full group">
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="p-3 bg-[#E6D9C6]/30 rounded-xl group-hover:bg-[#C6A664]/20 transition-colors">
                            <Icon className="h-6 w-6 text-[#C6A664]" />
                          </div>
                          <CardTitle
                            className="text-xl font-bold text-[#2F2A25] leading-tight"
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            {specialite.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p
                          className="text-[#2F2A25]/70 text-sm mb-4 leading-relaxed"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {specialite.description}
                        </p>
                        <p
                          className="text-[#2F2A25]/80 text-base leading-relaxed mb-4"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {specialite.presentation}
                        </p>
                        <div className="flex items-center text-[#C6A664] font-medium text-sm group-hover:translate-x-2 transition-transform">
                          <span
                            style={{
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                            }}
                          >
                            En savoir plus
                          </span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-[#E6D9C6]/50 to-[#C6A664]/20 rounded-2xl p-12 border border-[#E6D9C6]">
              <h2
                className="text-3xl font-bold text-[#2F2A25] mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Prêt à commencer votre accompagnement ?
              </h2>
              <p
                className="text-lg text-[#2F2A25]/80 mb-8 max-w-2xl mx-auto"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Chaque parcours est unique. Contactez-moi pour discuter de vos besoins et trouver ensemble la meilleure approche pour vous accompagner.
              </p>
              <Button
                asChild
                size="lg"
                className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg shadow-xl"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Maillage interne SEO */}
      <InternalLinks currentPage="specialites" />

      {/* Structured Data */}
      <Script
        id="structured-data-services"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Psychopédagogie",
            "provider": {
              "@type": "Person",
              "name": "Jessica CONTENTIN",
            },
            "areaServed": {
              "@type": "City",
              "name": "Caen",
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Services de psychopédagogie",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Accompagnement TND",
                    "description": "Accompagnement spécialisé pour troubles du neurodéveloppement (DYS, TDA-H)",
                  },
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Harcèlement scolaire",
                    "description": "Accompagnement et soutien face au harcèlement scolaire",
                  },
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Gestion des émotions",
                    "description": "Accompagnement pour la gestion des émotions",
                  },
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "Orientation scolaire",
                    "description": "Accompagnement à l'orientation scolaire et professionnelle",
                  },
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}
