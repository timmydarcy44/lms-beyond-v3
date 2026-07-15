"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  BEYOND_AGENCY_FONT,
  CONTACT_MAIL,
  HERO_IMAGE_URL,
} from "@/lib/beyond-center/agency-constants";

export function BeyondAgencyHero() {
  return (
    <section
      id="hero"
      className="relative min-h-[100svh] bg-white"
      style={{ fontFamily: BEYOND_AGENCY_FONT }}
    >
      <div className="mx-auto grid min-h-[100svh] max-w-[1400px] lg:grid-cols-2">
        {/* Left — copy */}
        <div className="flex flex-col justify-center px-6 pb-16 pt-32 md:px-10 lg:px-16 lg:pb-24 lg:pt-28">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400"
          >
            Optimisation de la performance commerciale
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-xl text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.04em] text-black"
          >
            Nous développons les outils qui{" "}
            <span className="font-bold">accélèrent votre performance</span> commerciale.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-md text-[17px] leading-relaxed text-neutral-500"
          >
            CRM, pipeline, automatisation et IA au service de vos équipes commerciales —
            pour convertir plus, mieux et plus vite.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <a
              href={CONTACT_MAIL}
              className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-[14px] font-medium text-white transition-all hover:bg-neutral-800"
            >
              Parler de votre projet commercial
            </a>
            <Link
              href="#etudes-de-cas"
              className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-600 transition-colors hover:text-black"
            >
              Découvrir nos réalisations
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Right — visual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative hidden min-h-[50vh] lg:block lg:min-h-[100svh]"
        >
          <Image
            src={HERO_IMAGE_URL}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
        </motion.div>
      </div>

      {/* Mobile hero image */}
      <div className="relative mx-6 mb-8 aspect-[4/3] overflow-hidden rounded-[20px] lg:hidden">
        <Image src={HERO_IMAGE_URL} alt="" fill sizes="100vw" className="object-cover" priority />
      </div>
    </section>
  );
}
