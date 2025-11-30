"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PillarsSlider } from "@/components/jessica-contentin/pillars-slider";
import { VideoHero } from "@/components/jessica-contentin/video-hero";
import { ResourcesSection } from "@/components/jessica-contentin/resources-section";
import { GoogleReviewsSlider } from "@/components/jessica-contentin/google-reviews-slider";
import { FeaturesSlider } from "@/components/jessica-contentin/features-slider";
import { ContactForm } from "@/components/jessica-contentin/contact-form";
import { InternalLinks } from "@/components/jessica-contentin/internal-links";
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

// Photo de Jessica - depuis Supabase Storage
const JESSICA_PHOTO_PATH = "Jessica contentin re.jpg";
const BUCKET_NAME = "Jessica CONTENTIN";

export default function JessicaContentinHomePage() {
  const photoUrl = getSupabaseStorageUrl(BUCKET_NAME, JESSICA_PHOTO_PATH) || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80";

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Pillars Slider */}
      <PillarsSlider />

      {/* Vidéo Hero - Entre le slider et les avis */}
      <VideoHero />

      {/* Section Ressources - Sous la vidéo */}
      <ResourcesSection />

      {/* Avis Google - Slider moderne avec cartes */}
      <GoogleReviewsSlider />

      {/* Présentation Section avec photo */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-20 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Texte à gauche */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h1
                  className="text-4xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation à Fleury-sur-Orne (Caen)
                </h1>
                <p
                  className="text-xl text-[#2F2A25]/80 mb-8"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Accompagnement personnalisé pour troubles DYS, TDA-H, harcèlement scolaire et phobie scolaire. Cabinet à Fleury-sur-Orne, près de Caen en Normandie.
                </p>
              </div>

              <div
                className="prose prose-lg max-w-none text-[#2F2A25] leading-relaxed space-y-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Diplômée d'un <strong>Master en Ingénierie des Politiques Sanitaires et Sociales (IAE de Caen)</strong> et d'un <strong>Master MEEF (mention Très Bien)</strong>, je suis également <strong>professeure certifiée en Santé, titulaire d'un concours national de l'Éducation nationale</strong>.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Ce parcours universitaire et professionnel m'a permis de développer une compréhension fine et concrète des enjeux éducatifs, émotionnels et sociaux rencontrés par les jeunes et leurs familles.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  J'ai également acquis une solide expérience au sein d'institutions spécialisées, notamment :
                </motion.p>
                <motion.ul
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="list-disc list-inside space-y-2 text-[#2F2A25] ml-4"
                >
                  <li><strong>2 ans au CRA de Basse-Normandie</strong>, en tant que stagiaire cadre socio-éducatif (accompagnement des familles, compréhension des diagnostics TND, travail pluridisciplinaire)</li>
                  <li>Une expérience à la <strong>MDPH du Calvados</strong>, au cœur de l'orientation des jeunes et du suivi des dossiers</li>
                </motion.ul>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="mt-4"
                >
                  À cela s'ajoute une <strong>certification en psychopédagogie et neuroéducation</strong>, renforçant mon expertise dans l'accompagnement cognitif et émotionnel.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  Passionnée par la <strong>psychologie de l'éducation</strong>, j'adopte une approche globale intégrant les dimensions cognitive, émotionnelle et comportementale de chaque enfant ou adolescent. Je suis formée à l'accompagnement des <Link href="/specialites/tnd" className="text-[#C6A664] hover:underline font-semibold">TND (troubles DYS, TDAH, TSA, HPI, TOP)</Link>, ainsi qu'aux problématiques telles que le <Link href="/specialites/harcelement" className="text-[#C6A664] hover:underline font-semibold">harcèlement scolaire</Link>, la <strong>phobie scolaire</strong>, les difficultés émotionnelles et la perte de confiance.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                >
                  La <strong>gestion des émotions</strong> constitue le fil conducteur de mon travail, car elle est essentielle à la réussite scolaire et au bien-être. Mon objectif est de révéler les forces de chaque jeune, renforcer leur <Link href="/specialites/confiance-en-soi" className="text-[#C6A664] hover:underline font-semibold">confiance</Link>, apaiser les tensions et favoriser leur inclusion tout en accompagnant les familles avec douceur.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="pt-8"
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

            {/* Photo à droite */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
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
                      target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80";
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Slider Features style Tony Robbins */}
      <FeaturesSlider />

      {/* Formulaire de contact */}
      <ContactForm />

      {/* Maillage interne SEO */}
      <InternalLinks currentPage="home" />

      {/* Structured Data Schema.org */}
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Jessica CONTENTIN - Psychopédagogue",
            "description": "Psychopédagogue certifiée en neuroéducation. Accompagnement personnalisé pour troubles DYS, TDA-H, harcèlement scolaire, phobie scolaire.",
            "url": "https://jessicacontentin.fr",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "41 C",
              "addressLocality": "Fleury-sur-Orne",
              "postalCode": "14123",
              "addressRegion": "Normandie",
              "addressCountry": "FR",
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "49.1478",
              "longitude": "-0.3756",
            },
            "telephone": "+33683477174",
            "email": "contentin.cabinet@gmail.com",
            "priceRange": "€€",
            "areaServed": {
              "@type": "City",
              "name": "Caen",
            },
            "serviceType": [
              "Psychopédagogie",
              "Accompagnement TND",
              "Neuroéducation",
              "Orientation scolaire",
              "Gestion des émotions",
            ],
          }),
        }}
      />
      <Script
        id="structured-data-person"
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
          }),
        }}
      />
    </div>
  );
}

