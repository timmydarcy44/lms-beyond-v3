"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_REVIEW_COUNT } from "@/lib/jessica-contentin/google-reviews-data";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export function JessicaFinalSocialProof() {
  return (
    <section className="border-t border-[#E6D9C6]/70 bg-[#F8F5F0] py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="mx-auto max-w-3xl px-4 text-center md:px-8"
      >
        <div className="mb-4 inline-flex items-center gap-1" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-[#C6A664] text-[#C6A664]" />
          ))}
        </div>
        <p className="text-xl font-semibold tracking-tight text-[#2F2A25] md:text-2xl">
          Plus de {GOOGLE_REVIEW_COUNT} familles nous ont déjà accordé leur confiance.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 rounded-full bg-[#C4704B] px-8 py-6 text-base text-white shadow-[0_12px_32px_-12px_rgba(196,112,75,0.55)] hover:bg-[#A85A38] md:text-lg"
        >
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
            Prendre rendez-vous
          </a>
        </Button>
      </motion.div>
    </section>
  );
}
