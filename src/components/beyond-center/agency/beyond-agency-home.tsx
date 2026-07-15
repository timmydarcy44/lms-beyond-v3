"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  BEYOND_AGENCY_FONT,
  CASE_STUDIES,
  CONTACT_MAIL,
  PRESTATIONS,
} from "@/lib/beyond-center/agency-constants";

import { BeyondAgencyHeader } from "./beyond-agency-header";
import { BeyondAgencyHero } from "./beyond-agency-hero";

export function BeyondAgencyHome() {
  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: BEYOND_AGENCY_FONT }}>
      <BeyondAgencyHeader />
      <BeyondAgencyHero />

      {/* Prestations — aperçu */}
      <section id="prestations" className="border-t border-neutral-100 px-6 py-28 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Expertise</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.03em] text-black">
            Des solutions pour vendre plus et mieux piloter.
          </h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRESTATIONS.map((item, i) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="rounded-[20px] border border-neutral-100 bg-neutral-50/50 p-7 transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.08)]"
              >
                <p className="text-[15px] font-semibold tracking-[-0.02em]">{item.title}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-500">{item.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Études de cas */}
      <section id="etudes-de-cas" className="bg-neutral-50 px-6 py-28 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Réalisations</p>
          <h2 className="mt-4 max-w-xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold tracking-[-0.03em] text-black">
            Études de cas
          </h2>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {CASE_STUDIES.map((project, i) => (
              <motion.a
                key={project.name}
                href={project.href}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                className="group overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white transition-shadow hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)]"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                  <Image
                    src={project.image}
                    alt={project.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-8">
                  <p className="text-[20px] font-semibold tracking-[-0.02em]">{project.name}</p>
                  <p className="mt-2 text-[15px] text-neutral-500">{project.problem}</p>
                  <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    {project.tech}
                  </p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-32 md:px-10 lg:px-16">
        <div className="mx-auto max-w-[1400px] text-center">
          <h2 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold tracking-[-0.04em] text-black">
            Un projet en tête ?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-[17px] text-neutral-500">
            Parlons de vos enjeux. Nous concevons des solutions sur mesure, de l&apos;idée au déploiement.
          </p>
          <a
            href={CONTACT_MAIL}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-[15px] font-medium text-white transition-all hover:bg-neutral-800"
          >
            Parler de votre projet
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-neutral-100 px-6 py-12 md:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 text-[13px] text-neutral-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Beyond</p>
          <Link href="mailto:contact@beyondcenter.fr" className="transition-colors hover:text-black">
            contact@beyondcenter.fr
          </Link>
        </div>
      </footer>
    </div>
  );
}
