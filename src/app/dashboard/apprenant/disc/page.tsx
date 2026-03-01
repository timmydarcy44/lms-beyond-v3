"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, MessageCircle, Lock, Search } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function DiscIntroPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>

      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 font-['Inter']">
          <div className="text-[14px] font-semibold tracking-[0.3em] text-white">BEYOND</div>
          <button className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[12px] text-white/90 hover:bg-white/20">
            Essai gratuit
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-16 font-['Inter']">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                Découvrez Votre Super-Pouvoir Relationnel.
              </span>
            </h1>
            <p className="text-[15px] text-white/60">
              Le test comportemental mesure vos styles communicatifs et sociaux, un outil précis pour améliorer l&apos;efficacité de vos interactions.
            </p>
            <Link
              href="/dashboard/apprenant/disc/test"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFA500] px-6 py-3 text-[13px] font-semibold text-black shadow-[0_0_30px_rgba(255,165,0,0.3)] transition hover:shadow-[0_0_50px_rgba(255,165,0,0.55)]"
            >
              Démarrer l&apos;expérience
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Réunion d'équipe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 flex gap-2 text-[11px] text-white/70">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 backdrop-blur-xl">Communication</span>
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 backdrop-blur-xl">Leadership</span>
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 backdrop-blur-xl">Test comportemental</span>
            </div>
          </motion.div>
        </section>

        <section className="space-y-8">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <h2 className="text-2xl font-semibold">Qu&apos;est-ce que les 4 dimensions ?</h2>
            <p className="mt-2 text-[13px] text-white/60">
              Comprendre les moteurs comportementaux vous aide à ajuster votre communication et à gagner en efficacité relationnelle.
            </p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2">
              {[
                { title: "Dominance", desc: "Décision rapide, focus résultat.", icon: ArrowUpRight, color: "text-red-300/80" },
                { title: "Influence", desc: "Énergie sociale et persuasion.", icon: MessageCircle, color: "text-yellow-300/80" },
                { title: "Stabilité", desc: "Calme, constance, coopération.", icon: Lock, color: "text-green-300/80" },
                { title: "Conformité", desc: "Précision, rigueur, structure.", icon: Search, color: "text-blue-300/80" },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
                  whileHover={{ y: -8 }}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <div className="mt-3 text-[14px] font-semibold text-white">{item.title}</div>
                  <p className="mt-2 text-[12px] text-white/60">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
            >
              <div className="text-[13px] font-semibold text-white">Pourquoi c&apos;est important ?</div>
              <ul className="mt-4 space-y-3 text-[12px] text-white/60">
                <li>Améliorer sa communication.</li>
                <li>Résoudre les conflits plus rapidement.</li>
                <li>Développer le leadership.</li>
              </ul>
            </motion.div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-4">
            <h2 className="text-3xl font-semibold">Transformez vos compétences quotidiennes.</h2>
            <p className="text-[13px] text-white/60">
              Une approche personnalisée pour traduire vos comportements en leviers concrets de performance relationnelle.
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="text-[12px] uppercase tracking-[0.2em] text-white/50">Notre méthode unique</div>
              <div className="mt-4 space-y-3 text-[12px] text-white/70">
                <div>1. Votre test comportemental</div>
                <div>2. Analyse des moteurs</div>
                <div>3. Suivi dynamique</div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-[12px] text-white/60 backdrop-blur-md">
              Déployez votre potentiel au quotidien, avec des repères simples et actionnables.
            </div>
            <Link
              href="/dashboard/apprenant/disc/test"
              className="inline-flex w-fit items-center justify-center rounded-full bg-[#FFA500] px-6 py-3 text-[13px] font-semibold text-black shadow-[0_0_30px_rgba(255,165,0,0.3)] transition hover:shadow-[0_0_50px_rgba(255,165,0,0.55)]"
            >
              Démarrer l&apos;expérience
            </Link>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5"
          >
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Équipe en interaction"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 text-[12px] text-white/40">
          <div>© 2026 Beyond Connect. Tous droits réservés.</div>
        </div>
      </footer>
    </div>
  );
}
