"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Euro, Users, Heart, Home, Baby, Coffee, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { InternalLinks } from "@/components/jessica-contentin/internal-links";
import Script from "next/script";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const CABINET_VIDEO_URL = "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Jessica%20CONTENTIN/video_cabinet.MOV";

export default function ConsultationsPage() {
  const consultations = [
    {
      title: "Première consultation",
      price: "90 €",
      description: "Première consultation à 90€.",
    },
    {
      title: "Consultation de suivi",
      price: "75 €",
      description: "Consultation de suivi à 75€.",
    },
    {
      title: "Bilans",
      price: "Selon les besoins",
      description: "Bilans en fonction des besoins.",
      ctaLabel: "Découvrez le bilan qui vous correspond",
      ctaHref: BOOKING_URL,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-20 mx-4 mb-4">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-bold text-[#2F2A25] mb-4 leading-tight"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Les consultations au cabinet
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg md:text-xl text-[#2F2A25]/80 max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Consultations Psychopédagogiques - Tarifs et Modalités
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-lg text-[#2F2A25]/70 mt-3 leading-relaxed"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Bretteville sur Odon (Caen)
            </motion.p>
          </div>
        </div>
      </section>

      {/* Présentation du Cabinet */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E6D9C6]"
          >
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Vidéo du cabinet */}
              <div className="relative h-[420px] md:h-[520px] lg:h-full min-h-[520px] bg-black">
                <video
                  src={CABINET_VIDEO_URL}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => {
                    console.error("[Consultations] Erreur lors du chargement de la vidéo du cabinet:", e);
                  }}
                />
              </div>
              
              {/* Texte de présentation */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-[#E6D9C6]/30 rounded-full">
                    <Home className="h-6 w-6 text-[#C6A664]" />
                  </div>
                  <h2
                    className="text-3xl font-bold text-[#2F2A25]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Bienvenue dans mon cabinet
                  </h2>
                </div>
                <p
                  className="text-lg text-[#2F2A25]/80 leading-relaxed mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Mon cabinet est un espace chaleureux et accueillant, conçu pour vous mettre à l'aise dès votre arrivée. 
                  C'est un lieu où vous pouvez vous sentir en sécurité, écouté et compris.
                </p>
                <p
                  className="text-lg text-[#2F2A25]/80 leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Chaque détail a été pensé pour créer une atmosphère apaisante et bienveillante, propice à l'échange et à la confiance.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Espace enfant */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#E6D9C6]/50 to-[#C6A664]/20 rounded-2xl p-8 lg:p-12 border border-[#E6D9C6]"
          >
            <div className="flex items-start gap-6">
              <div className="p-4 bg-white rounded-full shadow-md">
                <Baby className="h-8 w-8 text-[#C6A664]" />
              </div>
              <div className="flex-1">
                <h2
                  className="text-3xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  L'espace enfant
                </h2>
                <p
                  className="text-lg text-[#2F2A25]/80 leading-relaxed mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Un espace spécialement aménagé pour les enfants, où le jeu devient un outil précieux d'expression et de communication.
                </p>
                <p
                  className="text-lg text-[#2F2A25]/80 leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <strong className="text-[#C6A664]">Avec les enfants, on met en place des activités ludiques pour libérer la parole et les émotions.</strong> 
                  Le jeu permet de créer un lien de confiance, de faciliter l'expression des ressentis et d'aborder les difficultés 
                  de manière naturelle et ludique. C'est un moyen privilégié pour les enfants de s'exprimer sans contrainte.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Salle d'attente */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-[#E6D9C6]"
          >
            <h2
              className="text-3xl font-bold text-[#2F2A25] mb-8 text-center"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              La salle d'attente
            </h2>
            <p
              className="text-lg text-[#2F2A25]/80 leading-relaxed mb-8 text-center max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Un espace convivial où vous pouvez vous détendre avant votre consultation. 
              Prenez le temps de vous installer confortablement.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-center"
              >
                <div className="p-4 bg-[#E6D9C6]/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-[#C6A664]" />
                </div>
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Café
                </h3>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-center"
              >
                <div className="p-4 bg-[#E6D9C6]/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-[#C6A664]" />
                </div>
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Chocolat
                </h3>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-center"
              >
                <div className="p-4 bg-[#E6D9C6]/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Coffee className="h-8 w-8 text-[#C6A664]" />
                </div>
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Thé
                </h3>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-center"
              >
                <div className="p-4 bg-[#E6D9C6]/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-[#C6A664]" />
                </div>
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Lecture
                </h3>
              </motion.div>
              
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl font-bold text-[#2F2A25] mb-12 text-center"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Tarifs des consultations
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {consultations.map((consultation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="border border-white/40 bg-white/60 backdrop-blur-md hover:shadow-xl transition-all h-full">
                    <CardHeader>
                      <CardTitle
                        className="text-lg font-semibold text-[#2F2A25]"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {consultation.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <Euro className="h-5 w-5 text-[#b09f85]" />
                        <span
                          className="text-2xl font-bold text-[#2F2A25]"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {consultation.price}
                        </span>
                      </div>
                      <p
                        className="text-[#2F2A25]/80"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {consultation.description}
                      </p>
                      {consultation.ctaLabel && consultation.ctaHref ? (
                        <a
                          href={consultation.ctaHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold text-[#b09f85] hover:underline"
                        >
                          {consultation.ctaLabel}
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                asChild
                size="lg"
                className="bg-[#b09f85] hover:bg-[#9b8a72] text-white rounded-full px-8 py-6 text-lg shadow-xl"
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

      {/* Informations pratiques */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#E6D9C6]/30 rounded-2xl p-8 lg:p-12"
          >
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Clock className="h-8 w-8 text-[#b09f85] mx-auto mb-4" />
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Durée des séances
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  40 minutes
                </p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-[#b09f85] mx-auto mb-4" />
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Public concerné
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Enfants, adolescents, adultes et parents
                </p>
              </div>
              <div className="text-center">
                <Heart className="h-8 w-8 text-[#b09f85] mx-auto mb-4" />
                <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Approche bienveillante
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Accompagnement personnalisé et adapté à chaque situation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Maillage interne SEO */}
      <InternalLinks currentPage="consultations" />

      {/* Structured Data */}
      <Script
        id="structured-data-local-business"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Cabinet de Psychopédagogie Jessica CONTENTIN",
            "description": "Cabinet de psychopédagogie spécialisé dans l'accompagnement des troubles du neurodéveloppement, harcèlement scolaire et phobie scolaire.",
            "url": "https://jessicacontentin.fr",
            "telephone": "+33683477174",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "134 rue Elise Deroche",
              "addressLocality": "Bretteville sur Odon",
              "postalCode": "14760",
              "addressRegion": "Normandie",
              "addressCountry": "FR",
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "49.1478",
              "longitude": "-0.3756",
            },
            "priceRange": "€€",
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "09:30",
                "closes": "18:00",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
