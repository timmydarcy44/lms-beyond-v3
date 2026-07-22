"use client";

import { VideoHero } from "@/components/jessica-contentin/video-hero";
import { JessicaHeroTrustBadges } from "@/components/jessica-contentin/jessica-hero-trust-badges";
import { JessicaHomePresentation } from "@/components/jessica-contentin/jessica-home-presentation";
import { GoogleReviewsSection } from "@/components/jessica-contentin/google-reviews-section";
import { JessicaParcoursProgramCards, type ParcoursProgramCard } from "@/components/jessica-contentin/jessica-parcours-program-cards";
import { PROGRAMMES, programmePresentationHref } from "@/lib/jessica-contentin/programmes-catalog";
import { JessicaHomeAccompagnementSection } from "@/components/jessica-contentin/jessica-home-accompagnement-section";
import { JessicaFullWidthVideoSection } from "@/components/jessica-contentin/jessica-full-width-video-section";
import { JessicaPourquoiConsulterSection } from "@/components/jessica-contentin/jessica-pourquoi-consulter-section";
import { JessicaFinalSocialProof } from "@/components/jessica-contentin/jessica-final-social-proof";
import { motion } from "framer-motion";
import Script from "next/script";

const VIDEO_SOUS_PARCOURS =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Design%20sans%20titre.mp4";

const VIDEO_NEVO =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/video%20nevo.mp4";

const NEVO_HREF = "/ressources/application-neuro-adaptee";

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
      ...(p.promoPosterUrl ? { posterUrl: p.promoPosterUrl } : { posterUrl: p.heroImageUrl }),
    };
  }
  return { ...base, imageUrl: p.heroImageUrl };
});

export default function JessicaContentinHomePage() {
  return (
    <div className="min-h-screen bg-white">
      <VideoHero />
      <JessicaHeroTrustBadges />

      <JessicaHomePresentation />

      <GoogleReviewsSection />

      <JessicaParcoursProgramCards
        cards={PARCOURS_CARDS}
        featuredVideoUrl={VIDEO_SOUS_PARCOURS}
        featuredVideoTitle="Un accompagnement personnalisé pour comprendre, ajuster et progresser"
      />

      <JessicaHomeAccompagnementSection />

      <JessicaPourquoiConsulterSection />

      <JessicaFullWidthVideoSection
        videoUrl={VIDEO_NEVO}
        title="L'accompagnement continue à la maison."
        subtitle="Retrouvez dans Nevo des ressources personnalisées, des exercices et des outils pour poursuivre les stratégies mises en place lors des consultations."
        footnote="Nevo est l'application qui prolonge l'accompagnement en dehors des consultations grâce à des ressources adaptées à chaque profil."
        ctaLabel="Découvrir Nevo"
        ctaHref={NEVO_HREF}
        ariaLabel="NEVO — l'accompagnement continue à la maison"
      />

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
              "Plus de dix ans d'expérience",
              "Spécialisée troubles du neurodéveloppement",
              "Professeure certifiée (CAPES)",
            ].map((it) => (
              <div key={it} className="p-4 text-center text-sm font-semibold text-[#2F2A25] md:text-base">
                {it}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <JessicaFinalSocialProof />

      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Jessica CONTENTIN - Psychopédagogue",
            "description": "Professeure certifiée de l'Éducation nationale (CAPES) et psychopédagogue certifiée en neuroéducation. Accompagnement structuré et individualisé pour comprendre le fonctionnement cognitif et émotionnel, réguler les émotions et structurer les apprentissages.",
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
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5.0",
              "reviewCount": "22",
              "bestRating": "5",
              "worstRating": "1",
            },
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
