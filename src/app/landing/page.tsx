import { HeroSection } from "@/components/landing/hero-section";
import { PhilosophySection } from "@/components/landing/philosophy-section";
import { ExperiencesSection } from "@/components/landing/experiences-section";
import { HumanCenteredSection } from "@/components/landing/human-centered-section";
import { ScienceSection } from "@/components/landing/science-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { Navigation } from "@/components/landing/navigation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navigation />
      <HeroSection />
      <PhilosophySection />
      <ExperiencesSection />
      <HumanCenteredSection />
      <ScienceSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
