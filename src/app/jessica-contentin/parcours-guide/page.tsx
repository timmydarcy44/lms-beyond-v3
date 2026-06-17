import type { Metadata } from "next";
import Link from "next/link";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import { PARCOURS_GUIDES, jessicaParcoursGuideHref } from "@/lib/jessica-contentin/parcours-guide-catalog";

export const metadata: Metadata = {
  title: "Parcours guidés en Neuroéducation : Accompagnement structuré",
  description:
    "Parcours parentaux digitalisés : repères clairs, outils concrets et accompagnement personnalisé.",
};

export default function ParcoursGuideIndexPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      <section className="mx-auto max-w-4xl px-4 py-14 md:px-8 md:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9A7B52]">Parcours guidés</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">
          Accompagnements digitalisés
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#5C5348]">
          Des parcours structurés pour avancer à votre rythme, avec des contenus pédagogiques, des outils
          pratiques et un entretien expérientiel pour adapter chaque étape à votre situation.
        </p>

        <div className="mt-12 grid gap-6">
          {PARCOURS_GUIDES.map((parcours) => (
            <Link
              key={parcours.slug}
              href={jessicaParcoursGuideHref(parcours.slug)}
              className="group relative overflow-hidden rounded-2xl bg-[#2a2218] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="relative min-h-[280px] sm:min-h-[320px]">
                <JessicaRemoteImage
                  src={parcours.imageUrl}
                  alt={parcours.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1510]/95 via-[#3d2e24]/60 to-[#8b6914]/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#F0E4D4]">
                    {parcours.kicker}
                  </p>
                  <h2 className="mt-3 max-w-2xl text-xl font-bold leading-snug text-white md:text-2xl">
                    {parcours.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-[#FAF0E6]/90">{parcours.cardTag}</p>
                  <span className="mt-5 inline-flex text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8D5B5] underline-offset-4 group-hover:underline">
                    Découvrir le parcours
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
