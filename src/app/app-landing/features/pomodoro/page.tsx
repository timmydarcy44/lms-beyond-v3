"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Shield, LineChart } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function PomodoroPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Minuteur Pomodoro IA & Mode Focus | Concentration TDAH | nevo.</title>
        <meta
          name="description"
          content="Boostez votre productivité avec le Pomodoro neuro-ergonomique de nevo. Éliminez les distractions et gérez votre énergie, pas seulement votre temps."
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
            Domptez votre temps, protégez votre énergie.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Bien plus qu'un simple minuteur. Le Mode Focus de nevo. combine la méthode Pomodoro avec une IA
            neuro-ergonomique pour vous aider à entrer en état de "Flow" et à y rester.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Lancer ma session focus
            </a>
            <a
              href="#method"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Découvrir la méthode
            </a>
          </div>

          <motion.div
            id="method"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-60 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center relative overflow-hidden">
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 6 }}
                className="h-40 w-40 rounded-full border border-white/40 flex items-center justify-center"
              >
                <motion.div
                  initial={{ strokeDashoffset: 314 }}
                  whileInView={{ strokeDashoffset: 120 }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.4 }}
                  className="absolute"
                >
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="60" stroke="rgba(255,255,255,0.3)" strokeWidth="8" fill="none" />
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      stroke="white"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="377"
                      strokeDashoffset="140"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
                <span className="text-white text-xl font-semibold">25:00</span>
              </motion.div>
              <span className="absolute bottom-6 text-white/70 text-sm">[MOCKUP CENTRAL]</span>
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
          Pourquoi les listes de tâches ne suffisent pas.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Pour un cerveau atypique, démarrer une tâche est souvent le plus grand défi. C'est ce qu'on
          appelle la "paralysie de l'analyse". Le Mode Focus de nevo. réduit la friction en découpant vos
          objectifs en micro-étapes gérables, tout en protégeant votre attention des distractions numériques.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Gérez votre énergie, pas seulement vos minutes.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Le Pomodoro classique (25/5) n'est pas universel.{" "}
          <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
            Neo
          </Link>{" "}
          apprend de vos cycles de fatigue pour vous suggérer des pauses au moment exact où votre
          concentration fléchit.
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
            Un environnement de travail pur.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Minuteur Adaptatif",
              desc: (
                <>
                  Choisissez entre le mode classique, le mode intensif ou laissez{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  ajuster les cycles selon votre historique de focus.
                </>
              ),
              },
              {
                icon: Shield,
                title: "Blocage de Distractions",
                desc: "Une fois le mode activé, nevo. crée une bulle de concentration en simplifiant l'interface au maximum (Mode Zen).",
              },
              {
                icon: LineChart,
                title: "Statistiques de Flow",
                desc: "Visualisez vos moments de productivité maximale et comprenez enfin comment fonctionne votre cerveau au fil de la journée.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className={glassCardClass}
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
          Conçu pour la concentration TDAH.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Le TDAH ne manque pas d'attention, il a du mal à la diriger. Notre interface utilise des signaux
          visuels doux et des rappels sonores non-agressifs pour vous ramener à votre tâche sans provoquer
          d'anxiété. C'est l'outil ultime pour transformer la procrastination en accomplissement.
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
          Questions sur le Mode Focus.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Est-ce que le minuteur est lié à mes notes ?",
              a: "Oui, vous pouvez lancer une session de travail directement sur une note ou un cours spécifique pour suivre le temps passé sur chaque matière.",
            },
            {
              q: "Peut-on personnaliser les sons d'ambiance ?",
              a: "Absolument. nevo. propose des bruits blancs, des sons de la nature ou des fréquences de concentration (Binaural beats) pour isoler vos oreilles du bruit extérieur.",
            },
            {
              q: "Le mode Focus fonctionne-t-il sur mobile ?",
              a: "Oui, l'expérience est totalement synchronisée pour vous permettre de rester concentré, que vous soyez sur votre bureau ou en bibliothèque.",
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
              href="/app-landing/features/neuro-adapte"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Neuro adapté
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
