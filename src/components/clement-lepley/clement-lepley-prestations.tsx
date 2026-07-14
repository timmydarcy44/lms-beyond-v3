"use client";

import Image from "next/image";

import { COPPER, PRESTATIONS, SF_PRO } from "@/lib/clement-lepley/constants";

export function ClementLepleyPrestations() {
  return (
    <section id="prestations" className="bg-[#0a0a0a] px-6 py-24 lg:px-16">
      <div className="mx-auto max-w-6xl" style={{ fontFamily: SF_PRO }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: COPPER }}>
          Nos prestations
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Des solutions sur mesure pour chaque projet
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PRESTATIONS.map((item, i) => (
            <article
              key={`${item.title}-${i}`}
              className="group overflow-hidden rounded-sm bg-[#141414] ring-1 ring-white/10 transition hover:ring-white/25"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <h3 className="absolute bottom-4 left-4 text-xl font-semibold text-white">
                  {item.title}
                </h3>
              </div>
              <p className="p-5 text-sm leading-relaxed text-white/65">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
