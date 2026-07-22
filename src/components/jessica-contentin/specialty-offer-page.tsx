"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SPECIALTY_FOR_WHO,
  type SpecialtyOfferContent,
} from "@/lib/jessica-contentin/specialty-offer-content";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";
const textColor = "#2F2A25";
const primaryColor = "#8B6F47";
const bgColor = "#F8F5F0";
const surfaceColor = "#FFFFFF";

type SpecialtyOfferPageProps = {
  content: SpecialtyOfferContent;
};

export function SpecialtyOfferPage({ content }: SpecialtyOfferPageProps) {
  const forWho = content.forWho ?? SPECIALTY_FOR_WHO;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <section className="border-b border-[#E6D9C6]/50 bg-gradient-to-b from-[#FFFCF9] to-[#F8F5F0] px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl" style={{ color: textColor }}>
              {content.title}
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-xl font-medium md:text-2xl" style={{ color: primaryColor }}>
              {content.subtitle}
            </p>
            <div className="mx-auto mt-8 max-w-3xl space-y-4 text-left text-base leading-relaxed md:text-lg" style={{ color: `${textColor}cc` }}>
              {content.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
              {content.situationsTitle}
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {content.situations.map((item) => (
                <li key={item} className="rounded-xl border border-[#E6D9C6]/80 bg-[#FFFCF9] px-4 py-3 text-sm leading-snug" style={{ color: textColor }}>
                  {item}
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm"
          >
            <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
              {content.outcomesTitle}
            </h2>
            <ul className="mt-6 space-y-3">
              {content.outcomes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed md:text-base" style={{ color: textColor }}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8" style={{ backgroundColor: surfaceColor }}>
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-[#E6D9C6] bg-[#FFFCF9] p-8 md:p-10"
          >
            <h2 className="text-2xl font-semibold" style={{ color: textColor }}>
              Mon approche
            </h2>
            <p className="mt-4 text-base leading-relaxed md:text-lg" style={{ color: `${textColor}cc` }}>
              {content.approach}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: textColor }}>
              Pour qui ?
            </h2>
            <p className="mt-3 text-center text-base" style={{ color: `${textColor}99` }}>
              Cet accompagnement s&apos;adresse notamment :
            </p>
            <ul className="mt-8 space-y-3">
              {forWho.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#E6D9C6] bg-white px-5 py-4 shadow-sm"
                  style={{ color: textColor }}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm leading-relaxed md:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 text-center">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
                asChild
              >
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
