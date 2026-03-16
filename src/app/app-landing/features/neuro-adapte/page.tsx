"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Mic, Sparkles } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
};

export default function NeuroAdaptePage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>IA pour TDAH, Dys et TSA | Apprentissage Neuro-inclusif | nevo.</title>
        <meta
          name="description"
          content="Enfin une plateforme d'apprentissage conçue pour la neuro-diversité. Découvrez comment nevo. adapte son interface pour le TDAH et la Dyslexie."
        />
      </Head>

      <section className="relative overflow-hidden min-h-screen flex items-center justify-center text-center">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20">
          <motion.h1
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-4xl md:text-6xl font-semibold leading-tight mb-6 text-white"
          >
            Un outil qui s'adapte à votre cerveau, pas l'inverse.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            L'éducation n'a pas été pensée pour tout le monde. nevo. a été conçu pour briser les barrières
            cognitives et offrir à chaque profil atypique la prothèse numérique qu'il mérite.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Découvrir l'expérience nevo.
            </a>
            <a
              href="#engagements"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Nos engagements
            </a>
          </div>

          <motion.div
            id="engagements"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-56 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center text-sm text-white/70">
              [MOCKUP CENTRAL]
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-6 text-white"
        >
          Pourquoi les outils classiques vous épuisent.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          La surcharge cognitive est le premier facteur d'échec pour les cerveaux atypiques. Un menu trop
          complexe, des notifications incessantes ou un texte trop dense peuvent provoquer un blocage
          immédiat. Chez nevo., nous avons supprimé le "bruit" pour ne laisser que l'essentiel : votre
          savoir.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Compenser les fonctions exécutives.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Planifier, organiser, hiérarchiser : ce qui est simple pour certains est un défi quotidien pour les
          profils TDAH.{" "}
          <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
            Neo
          </Link>{" "}
          agit comme un assistant personnel qui structure vos pensées et vos cours en temps réel.
        </motion.p>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl font-semibold mb-10 text-white"
          >
            Un design fondé sur les neurosciences.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                key: "zen",
                icon: Sparkles,
                title: "Interface Zen",
                desc: "Zéro distraction, des contrastes doux et une hiérarchie visuelle stricte pour protéger votre attention.",
              },
              {
                key: "pilotage",
                icon: Mic,
                title: (
                  <>
                    Pilotage Vocal{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>
                  </>
                ),
                desc: (
                  <>
                    Parlez à votre bibliothèque. Demandez à{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    de lire, résumer ou organiser vos dossiers sans toucher au clavier.
                  </>
                ),
              },
              {
                key: "dyslexie",
                icon: Brain,
                title: "Adaptation Dyslexie",
                desc: "Polices spécifiques, espacement des caractères ajustable et mise en gras des concepts clés automatique.",
              },
            ].map(({ key, icon: Icon, title, desc }) => (
              <motion.div
                key={key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white/15 border border-white/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] backdrop-blur"
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-6 text-white"
        >
          Réduisez le décrochage scolaire par l'innovation.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Les centres de formation et les universités ont l'obligation d'accompagner la diversité. nevo.
          est la solution clé en main pour les référents handicap : un outil moderne, non-stigmatisant, qui
          redonne de l'autonomie aux apprenants en situation de handicap cognitif.
        </motion.p>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-8 text-white"
        >
          Questions sur l'approche neuro-adaptée.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Est-ce que nevo. est réservé aux profils diagnostiqués ?",
              a: "Absolument pas. Si vous vous sentez facilement distrait ou épuisé par la lecture, nevo. vous aidera, diagnostic ou non. L'accessibilité profite à tout le monde.",
            },
            {
              q: "Comment l'IA aide-t-elle spécifiquement le TDAH ?",
              a: "En automatisant les tâches d'organisation (titres, résumés, rappels) qui coûtent le plus d'énergie mentale au démarrage d'une session de travail.",
            },
            {
              q: "Puis-je tester les différentes polices d'accessibilité ?",
              a: "Oui, dans vos paramètres, vous pouvez basculer entre plusieurs styles de lecture et niveaux de contraste en un clic.",
            },
          ].map((item) => (
            <motion.details
              key={item.q}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className={glassFaqClass}
            >
              <summary className="cursor-pointer font-semibold text-white">{item.q}</summary>
              <p className="text-white/80 text-sm leading-relaxed mt-3">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Découvrir d'autres outils</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/app-landing/features/mode-focus"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Mode Focus
            </Link>
            <Link
              href="/app-landing/features/notes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Notes intelligentes
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
