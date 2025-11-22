"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PillarsSlider } from "@/components/jessica-contentin/pillars-slider";
import { VideoHero } from "@/components/jessica-contentin/video-hero";
import { ResourcesSection } from "@/components/jessica-contentin/resources-section";
import { TrustIndex } from "@/components/jessica-contentin/trust-index";
import { ContactForm } from "@/components/jessica-contentin/contact-form";
import { motion } from "framer-motion";
import { env } from "@/lib/env";

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

// Photo de Jessica - à remplacer par la vraie photo depuis Supabase Storage
const JESSICA_PHOTO_PATH = "jessica-photo.jpg"; // À ajuster selon le nom du fichier dans Supabase
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

      {/* Trust Index - Juste en dessous de la section ressources */}
      <TrustIndex />

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
                <h2
                  className="text-4xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Jessica CONTENTIN
                </h2>
                <p
                  className="text-xl text-[#2F2A25]/80 mb-8"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Psychopédagogue certifiée en neuroéducation.
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
                  Diplômée d'un Master en Ingénierie et Management de l'Intervention Sociale (IAE de Caen) ainsi que d'un Master en Éducation, Enseignement et Formation (MEEF) à l'INSPE, je suis également professeure certifiée dans le domaine de la santé depuis 2015. Cette double expertise m'a permis de développer une solide expérience dans l'accompagnement éducatif et l'inclusion scolaire.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Passionnée par la psychologie de l'éducation et la psychopédagogie, j'adopte une approche globale qui intègre les dimensions cognitive, émotionnelle et comportementale de chaque individu. Afin de répondre aux besoins spécifiques, j'ai suivi plusieurs formations certifiantes me permettant d'accompagner des jeunes présentant des troubles du neurodéveloppement (troubles DYS, TDA-H) ou confrontés à des défis tels que le harcèlement ou la phobie scolaire.
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  La gestion des émotions constitue un pilier central de mon travail, car elle est essentielle à la réussite scolaire et au bien-être. Mon objectif est de valoriser les forces de chaque élève, de renforcer leur confiance en eux et de favoriser leur inclusion, tout en révélant leur plein potentiel.
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

      {/* Formulaire de contact */}
      <ContactForm />
    </div>
  );
}

