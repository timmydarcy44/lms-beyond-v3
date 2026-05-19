import type { Metadata } from "next";

import { HeroSection } from "@/components/edge-site/hero-section";
import {
  EdgeOnlineTeaserSection,
  FinalCTASection,
  ParcoursPhareDarkSection,
  ParcoursPhareLightSection,
  TestimonialsHomeSection,
  ValidateursSection,
} from "@/components/edge-site/homepage-sections";

export const metadata: Metadata = {
  title: "EDGE — École de formation professionnelle certifiante | Normandie",
  description:
    "14 parcours certifiants, Open Badge IMS Global. Formez-vous comme les meilleurs performent — Normandie.",
  openGraph: {
    title: "EDGE Business School",
    description: "Formation professionnelle certifiante en Normandie.",
    type: "website",
  },
};

export default function EdgeHomePage() {
  return (
    <>
      <HeroSection />
      <ValidateursSection />
      <ParcoursPhareDarkSection />
      <ParcoursPhareLightSection />
      <EdgeOnlineTeaserSection />
      <TestimonialsHomeSection />
      <section id="candidater" className="scroll-mt-20" aria-hidden />
      <section id="ecole" className="scroll-mt-20" aria-hidden />
      <section id="a-propos" className="scroll-mt-20" aria-hidden />
      <FinalCTASection />
    </>
  );
}
