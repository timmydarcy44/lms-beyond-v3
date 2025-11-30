"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Brain, Users, BookOpen, Shield, Target, Lightbulb, Baby, GraduationCap, BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";
import { env } from "@/lib/env";
import Script from "next/script";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

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

const BUCKET_NAME = "Jessica CONTENTIN";
const JESSICA_PHOTO_PATH = "Jessica contentin re.jpg";

const specialites = [
  {
    id: "confiance-en-soi",
    title: "Gestion de la confiance en soi",
    icon: Heart,
    description: "Renforcement de l'estime de soi et développement de la confiance personnelle.",
  },
  {
    id: "gestion-stress",
    title: "Gestion du stress",
    icon: Brain,
    description: "Techniques et stratégies pour mieux gérer le stress au quotidien.",
  },
  {
    id: "tnd",
    title: "Accompagnement TND",
    icon: Users,
    description: "Accompagnement spécialisé pour les troubles du neurodéveloppement (DYS, TDA-H).",
  },
  {
    id: "guidance-parentale",
    title: "Guidance parentale",
    icon: Baby,
    description: "Soutien et conseils pour les parents dans leur rôle éducatif.",
  },
  {
    id: "tests",
    title: "Tests de connaissance de soi",
    icon: BookOpen,
    description: "Évaluations et bilans pour mieux se connaître et identifier ses forces.",
  },
  {
    id: "harcelement",
    title: "Harcèlement Scolaire",
    icon: Shield,
    description: "Accompagnement et soutien face au harcèlement scolaire.",
  },
  {
    id: "orientation",
    title: "Orientation scolaire",
    icon: Target,
    description: "Aide à l'orientation et au choix de parcours scolaire et professionnel.",
  },
  {
    id: "therapie",
    title: "Thérapie psycho-émotionnelle",
    icon: Lightbulb,
    description: "Accompagnement thérapeutique pour la gestion des émotions.",
  },
  {
    id: "neuroeducation",
    title: "Neuroéducation",
    icon: GraduationCap,
    description: "Approche basée sur les neurosciences pour optimiser les apprentissages.",
  },
  {
    id: "strategie-apprentissage",
    title: "Stratégie d'apprentissage",
    icon: BookMarked,
    description: "Développement de méthodes et techniques d'apprentissage personnalisées.",
  },
];

export default function AProposPage() {
  const photoUrl = getSupabaseStorageUrl(BUCKET_NAME, JESSICA_PHOTO_PATH) || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80";

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              À propos de Jessica CONTENTIN
            </h1>
            <p
              className="text-xl md:text-2xl text-[#2F2A25]/80 max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Psychopédagogue certifiée en neuroéducation à Fleury-sur-Orne (Caen)
            </p>
            <p
              className="text-lg text-[#2F2A25]/70 max-w-2xl mx-auto mt-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Accompagnement personnalisé pour troubles DYS, TDA-H, harcèlement scolaire et phobie scolaire. Cabinet à Fleury-sur-Orne, près de Caen en Normandie.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contenu Principal */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Photo */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={photoUrl}
                  alt="Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation"
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('unsplash')) {
                      target.src = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>

            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <p
                  className="text-lg text-[#2F2A25] leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Diplômée d'un <strong>Master en Ingénierie des Politiques Sanitaires et Sociales (IAE de Caen)</strong> et d'un <strong>Master MEEF (mention Très Bien)</strong>, je suis également <strong>professeure certifiée en Santé, titulaire d'un concours national de l'Éducation nationale</strong>.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p
                  className="text-lg text-[#2F2A25] leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Ce parcours universitaire et professionnel m'a permis de développer une compréhension fine et concrète des enjeux éducatifs, émotionnels et sociaux rencontrés par les jeunes et leurs familles.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-[#E6D9C6]/30 rounded-2xl p-6"
              >
                <h2
                  className="text-2xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Expérience dans des institutions spécialisées
                </h2>
                <ul className="space-y-3 text-[#2F2A25]">
                  <li className="flex items-start gap-3">
                    <span className="text-[#C6A664] font-bold mt-1">•</span>
                    <span><strong>2 ans au CRA de Basse-Normandie</strong>, en tant que stagiaire cadre socio-éducatif (accompagnement des familles, compréhension des diagnostics TND, travail pluridisciplinaire)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#C6A664] font-bold mt-1">•</span>
                    <span>Une expérience à la <strong>MDPH du Calvados</strong>, au cœur de l'orientation des jeunes et du suivi des dossiers</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <p
                  className="text-lg text-[#2F2A25] leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  À cela s'ajoute une <strong>certification en psychopédagogie et neuroéducation</strong>, renforçant mon expertise dans l'accompagnement cognitif et émotionnel.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <p
                  className="text-lg text-[#2F2A25] leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Passionnée par la <strong>psychologie de l'éducation</strong>, j'adopte une approche globale intégrant les dimensions cognitive, émotionnelle et comportementale de chaque enfant ou adolescent. Je suis formée à l'accompagnement des <strong>TND (troubles DYS, TDAH, TSA, HPI, TOP)</strong>, ainsi qu'aux problématiques telles que le <strong>harcèlement scolaire</strong>, la <strong>phobie scolaire</strong>, les difficultés émotionnelles et la perte de confiance.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <p
                  className="text-lg text-[#2F2A25] leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  La <strong>gestion des émotions</strong> constitue le fil conducteur de mon travail, car elle est essentielle à la réussite scolaire et au bien-être. Mon objectif est de révéler les forces de chaque jeune, renforcer leur confiance, apaiser les tensions et favoriser leur inclusion tout en accompagnant les familles avec douceur.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="pt-4"
              >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section Spécialités */}
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
              Mes Spécialités
            </h2>
            <p
              className="text-lg text-[#2F2A25]/80 max-w-2xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Découvrez les domaines dans lesquels je peux vous accompagner
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Link href={`/specialites/${specialite.id}`}>
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

      {/* Structured Data */}
      <Script
        id="structured-data-person-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Jessica CONTENTIN",
            "jobTitle": "Psychopédagogue certifiée en neuroéducation",
            "description": "Psychopédagogue certifiée en neuroéducation, spécialisée dans l'accompagnement des troubles du neurodéveloppement (DYS, TDA-H), harcèlement scolaire et phobie scolaire.",
            "url": "https://jessicacontentin.fr",
            "email": "contentin.cabinet@gmail.com",
            "telephone": "+33683477174",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Fleury-sur-Orne",
              "addressRegion": "Normandie",
              "postalCode": "14123",
              "addressCountry": "FR",
            },
            "alumniOf": [
              {
                "@type": "EducationalOrganization",
                "name": "IAE de Caen",
              },
              {
                "@type": "EducationalOrganization",
                "name": "INSPE",
              },
            ],
            "hasCredential": [
              {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": "Certification",
                "name": "Certification en neuroéducation",
              },
              {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": "Diplôme",
                "name": "CAPES",
              },
            ],
          }),
        }}
      />
    </div>
  );
}

