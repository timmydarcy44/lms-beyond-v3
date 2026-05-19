"use client";

import { VideoHero } from "@/components/jessica-contentin/video-hero";
import { JessicaHomePresentation } from "@/components/jessica-contentin/jessica-home-presentation";
import { JessicaParcoursProgramCards, type ParcoursProgramCard } from "@/components/jessica-contentin/jessica-parcours-program-cards";
import { PROGRAMMES, programmePresentationHref } from "@/lib/jessica-contentin/programmes-catalog";
import { GoogleReviewsSlider } from "@/components/jessica-contentin/google-reviews-slider";
import { ObjectivesAccordion, type ObjectiveItem } from "@/components/jessica-contentin/objectives-accordion";
import { JessicaHomeAccompagnementSection } from "@/components/jessica-contentin/jessica-home-accompagnement-section";
import { motion } from "framer-motion";
import Script from "next/script";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const VIDEO_SOUS_PARCOURS =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Design%20sans%20titre.mp4";

const KEYWORD_OBJECTIVES: ObjectiveItem[] = [
  {
    id: "apprendre",
    title: "Apprendre",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "comprendre",
    title: "Comprendre",
    imageUrl:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/levee%20de%20soleil.mp4",
  },
  {
    id: "reguler",
    title: "Se réguler",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80",
  },
  {
    id: "structurer",
    title: "Se structurer",
    imageUrl: "https://images.unsplash.com/photo-1504151932400-72d4384f04b3?w=1600&q=80",
  },
  {
    id: "developper",
    title: "Se développer",
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80",
  },
  {
    id: "epanouir",
    title: "S'épanouir",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
  },
];

const PARCOURS_CARDS: ParcoursProgramCard[] = PROGRAMMES.map((p) => {
  const base: ParcoursProgramCard = {
    headline: p.headline,
    tag: p.tag,
    href: programmePresentationHref(p.slug),
  };
  if (p.promoVideoUrl) {
    return {
      ...base,
      videoUrl: p.promoVideoUrl,
      ...(p.promoPosterUrl ? { posterUrl: p.promoPosterUrl } : {}),
    };
  }
  return { ...base, imageUrl: p.heroImageUrl };
});

export default function JessicaContentinHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <VideoHero />

      <JessicaParcoursProgramCards
        cards={PARCOURS_CARDS}
        featuredVideoUrl={VIDEO_SOUS_PARCOURS}
        featuredVideoTitle="Un accompagnement personnalisé pour comprendre, ajuster et progresser."
        belowProgramCards={
          <ObjectivesAccordion
            embedded
            title="Objectifs des programmes"
            subtitle="Sélectionnez un axe pour voir le visuel associé."
            objectives={KEYWORD_OBJECTIVES}
          />
        }
      />

      <JessicaHomeAccompagnementSection />

      <JessicaHomePresentation />

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-2xl font-semibold text-[#2F2A25] md:text-3xl">Témoignages & avis</h2>
          <GoogleReviewsSlider />
        </div>
      </motion.section>

      {/* Méthode */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.07 }}
        className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <h2 className="text-3xl font-semibold text-[#2F2A25] md:text-4xl">Une approche basée sur la neuroéducation</h2>
          <ul className="grid gap-3 text-base leading-relaxed text-[#2F2A25]/85 md:grid-cols-2 md:text-lg">
            {[
              "Compréhension du fonctionnement cognitif",
              "Identification des besoins réels",
              "Outils concrets et personnalisés",
              "Accompagnement progressif",
            ].map((line) => (
              <li key={line} className="flex gap-2 py-2">
                <span className="font-semibold text-[#C6A664]">→</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Crédibilité */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-3xl font-semibold text-[#2F2A25] md:text-4xl">Une expertise reconnue</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "+ de 100 jeunes accompagnés",
              "10 ans d’expérience en éducation",
              "Spécialisée troubles du neurodéveloppement",
              "Enseignante certifiée",
            ].map((it) => (
              <div key={it} className="p-4 text-center text-sm font-semibold text-[#2F2A25] md:text-base">
                {it}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#2F2A25]/70">
            Découvrez aussi les retours détaillés dans la section témoignages ci-dessus.
          </p>
        </div>
      </motion.section>

      {/* Structured Data Schema.org */}
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Jessica CONTENTIN - Psychopédagogue",
            "description": "Professeure en santé et psychopédagogue. Accompagnement structuré et individualisé pour comprendre le fonctionnement cognitif et émotionnel, réguler les émotions et structurer les apprentissages.",
            "url": "https://jessicacontentin.fr",
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
              "addressLocality": "Bretteville sur Odon",
              "addressRegion": "Normandie",
              "postalCode": "14760",
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

