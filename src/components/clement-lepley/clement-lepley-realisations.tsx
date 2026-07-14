"use client";

import Image from "next/image";

import { COPPER, REALISATIONS, SF_PRO } from "@/lib/clement-lepley/constants";

export function ClementLepleyRealisations() {
  return (
    <section id="realisations" className="bg-[#111111] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-6xl" style={{ fontFamily: SF_PRO }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COPPER }}>
          Portfolio
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Nos réalisations
        </h2>
        <p className="mt-4 max-w-2xl text-base text-white/60">
          Chaque chantier est unique. Découvrez quelques projets réalisés en Normandie.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REALISATIONS.map((item) => (
            <figure
              key={item.title}
              className="group relative aspect-[3/4] overflow-hidden rounded-sm"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, 25vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/60">{item.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
