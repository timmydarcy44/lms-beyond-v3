"use client";

import { ClementLepleyContact } from "@/components/clement-lepley/clement-lepley-contact";
import { ClementLepleyHero } from "@/components/clement-lepley/clement-lepley-hero";
import { ClementLepleyNav } from "@/components/clement-lepley/clement-lepley-nav";
import { ClementLepleyPrestations } from "@/components/clement-lepley/clement-lepley-prestations";
import { ClementLepleyRealisations } from "@/components/clement-lepley/clement-lepley-realisations";
import {
  ClementLepleySimulationWizard,
  scrollToSimulation,
} from "@/components/clement-lepley/clement-lepley-simulation-wizard";

function scrollToContact() {
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
}

export function ClementLepleyPage() {
  return (
    <>
      <ClementLepleyNav onSimulateClick={scrollToSimulation} />
      <main>
        <ClementLepleyHero onDevisClick={scrollToContact} onSimulateClick={scrollToSimulation} />
        <ClementLepleySimulationWizard />
        <ClementLepleyPrestations />
        <ClementLepleyRealisations />
        <ClementLepleyContact />
      </main>
      <footer className="border-t border-white/10 bg-[#0a0a0a] px-6 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Clément Lepley — Valorise votre maison
      </footer>
    </>
  );
}
