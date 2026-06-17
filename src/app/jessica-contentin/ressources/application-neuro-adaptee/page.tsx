import type { Metadata } from "next";
import { JessicaNevoPresentation } from "@/components/jessica-contentin/jessica-nevo-presentation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Application de performance cognitive & Neuroéducation",
  description:
    "Nevo — 11 fonctionnalités de révision (schéma, audio, quiz…) et mode neuro adapté pour les apprenants DYS. Performance cognitive au quotidien.",
};

export default function ApplicationNeuroAdapteePage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-20">
      <section className="mx-auto max-w-5xl px-6 pb-4 pt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Outils et ressources</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">Application</h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#5C5348] md:text-lg">
          Nevo transforme vos cours en fiches, schémas, audio et quiz — avec un mode neuro adapté pour les
          profils DYS. Découvrez les 11 fonctionnalités ci-dessous.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-full border-[#C6A664]/50 text-[#2F2A25]">
          <Link href="/jessica-contentin/ressources">← Tous les outils</Link>
        </Button>
      </section>
      <JessicaNevoPresentation />
    </div>
  );
}
