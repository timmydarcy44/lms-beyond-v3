import type { Metadata } from "next";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import { BeyondCenterPricingSection } from "@/components/beyond-center/pricing-section";
import { BeyondCenterMarketingFooter, DarkAmbientBackground } from "@/components/beyond-center/beyond-center-shared";

export const metadata: Metadata = {
  title: "Tarifs | Beyond Center",
  description:
    "Une tarification claire pour lancer un pilote Beyond Center : diagnostic, activation et progression durable des équipes.",
};

export default function PricingPage() {
  return (
    <div
      className="min-h-screen bg-[#030712] font-sans text-slate-100 antialiased"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <BeyondCenterHeader />
      <section className="relative overflow-hidden pb-10 pt-10">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-8">
          <h1 className="text-[clamp(2rem,4.8vw,3.1rem)] font-semibold tracking-[-0.04em] text-white">
            Tarifs
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-400">
            Une grille simple. Une décision rapide. Un pilote activable immédiatement.
          </p>
        </div>
      </section>

      <BeyondCenterPricingSection id="pricing" variant="dark" />
      <BeyondCenterMarketingFooter />
    </div>
  );
}

