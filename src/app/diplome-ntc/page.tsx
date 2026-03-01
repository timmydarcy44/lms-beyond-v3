"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  viewport: { once: true, margin: "-160px" },
};

const titleStyle = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  fontWeight: 900 as const,
  letterSpacing: "-0.04em",
};

export default function DiplomeNtcPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* HERO */}
      <section className="bg-black py-32 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <motion.div {...fadeUp} className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black" style={titleStyle}>
              TITRE NTC : VOTRE SYSTÈME D’EXPLOITATION BUSINESS.
            </h1>
            <p className="text-lg text-white/75">
              Un diplôme d’État Niveau 5. Une puissance de frappe illimitée. 100% Alternance.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
            <div className="relative h-72 md:h-[420px] overflow-hidden rounded-3xl border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
                alt="Mécanisme de précision"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* SPECS */}
      <section className="bg-white py-32">
        <div className="mx-auto max-w-6xl px-6 space-y-12">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            LES SPÉCIFICATIONS TECHNIQUES.
          </motion.h2>
          <div className="grid gap-8 md:grid-cols-2">
            {[
              {
                title: "ARCHITECTURE STRATÉGIQUE.",
                text: "Veille, prospection ciblée, analyse de marché.",
              },
              {
                title: "NÉGOCIATION HAUTE PRÉCISION.",
                text: "Vente complexe, gestion de grands comptes, fidélisation.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.06 * index }}
                className="rounded-3xl border border-black/5 bg-white p-8 shadow-[0_20px_60px_-50px_rgba(0,0,0,0.15)]"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Bloc de compétences
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{item.title}</h3>
                <div className="my-6 h-px bg-black/5" />
                <p className="text-sm text-black/60">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENCE */}
      <section className="bg-[#F5F5F7] py-32">
        <div className="mx-auto max-w-6xl px-6 space-y-8">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            PLUS QU&apos;UN DIPLÔME, UN ARSENAL.
          </motion.h2>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="text-lg text-black/70">
            Le référentiel NTC est notre base. Nous y injectons l’intelligence comportementale, la neuro-éducation et la
            validation par les plus grands clubs sportifs (Ligue 1, Pro A). Vous ne passez pas un examen, vous validez
            une expertise.
          </motion.p>
        </div>
      </section>

      {/* FINANCEMENT */}
      <section className="bg-white py-32">
        <div className="mx-auto max-w-6xl px-6 space-y-10">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-black" style={titleStyle}>
            FINANCEMENT & STATUT.
          </motion.h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "0€ de frais", text: "Aucun coût de scolarité." },
              { title: "Apprenti", text: "Un vrai salaire, une vraie place en entreprise." },
              { title: "Certification", text: "Délivrée par le Ministère du Travail." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 * index }}
                className="rounded-3xl border border-black/10 bg-white p-8"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-black/50">{item.title}</div>
                <p className="mt-4 text-sm text-black/70">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black py-28 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-6">
          <motion.div {...fadeUp}>
            <Link
              href="/beyond-center/pre-inscription"
              className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-black"
            >
              LANCER MA CANDIDATURE
            </Link>
          </motion.div>
          <motion.p {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }} className="text-sm text-white/70">
            Rejoignez l’élite de Rouen pour la rentrée 2026.
          </motion.p>
        </div>
      </section>
    </main>
  );
}

