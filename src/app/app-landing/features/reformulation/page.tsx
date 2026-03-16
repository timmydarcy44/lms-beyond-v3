"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, TextQuote, ListChecks, Type } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function ReformulationPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Reformulation de Texte IA | Simplifiez vos Cours Complexes | nevo.</title>
        <meta
          name="description"
          content="Un texte trop difficile ? nevo. reformule vos supports de cours pour les rendre accessibles. Idéal pour dyslexie, TDAH et clarté mentale."
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
            Simplifiez n'importe quel texte complexe avec l'IA.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Un cours trop abstrait ? Un jargon illisible ? nevo. reformule vos supports pour les rendre
            clairs, fluides et accessibles, sans jamais perdre l'essence pédagogique.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Reformuler mon texte gratuitement
            </a>
            <a
              href="#modes"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Découvrir les modes de lecture
            </a>
          </div>

          <motion.div
            id="modes"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.7 }}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-56 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center text-sm text-white/70">
              [PLACEHOLDER MOCKUP]
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
          La clarté au service de la compréhension.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Certains supports de cours sont inutilement complexes. Pour les profils dyslexiques ou les
          étudiants souffrant de fatigue attentionnelle, lire devient un obstacle physique. La surcharge
          cognitive liée à un vocabulaire trop dense empêche l'assimilation des concepts. nevo. brise cette
          barrière.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Ne subissez plus le jargon académique.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Notre outil de reformulation déconstruit les structures de phrases alambiquées pour proposer un
          texte qui parle à votre cerveau, quel que soit votre mode de fonctionnement.
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
            Personnalisez votre niveau de lecture.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Niveau de langue ajustable",
                desc: "Passez du résumé ultra-rapide à l'explication détaillée selon votre besoin du moment.",
              },
              {
                icon: Type,
                title: "Vocabulaire Simplifié",
                desc: "Remplacement automatique des termes obscurs par des synonymes courants pour une lecture sans dictionnaire.",
              },
              {
                icon: ListChecks,
                title: "Structure par Puces",
                desc: "Transformation des blocs de texte massifs en listes à puces digestes et structurées.",
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
          Une prothèse cognitive pour la lecture.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Contrairement aux reformulateurs classiques, nevo. permet d'appliquer des filtres de lecture :
          espacement des lettres, polices spécifiques pour dyslexiques et mise en gras des concepts clés.
          C'est l'outil indispensable pour les parents d'élèves et les étudiants qui veulent retrouver le
          plaisir d'apprendre sans la migraine.
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
          Tout savoir sur la reformulation IA.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "La reformulation change-t-elle le sens de mon cours ?",
              a: "Non. L'IA de nevo. est entraînée pour conserver 100% de la valeur pédagogique. Elle change la forme (la syntaxe) pour rendre le fond (le savoir) accessible.",
            },
            {
              q: "Est-ce considéré comme de la triche ?",
              a: "Absolument pas. C'est un outil d'accessibilité et de compréhension, au même titre qu'un dictionnaire ou qu'un tuteur qui expliquerait un concept avec des mots plus simples.",
            },
            {
              q: "Puis-je reformuler des documents entiers ?",
              a: "Oui, importez vos PDF ou scans de livres, Neo s'occupe de réécrire les chapitres dont vous avez besoin.",
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
              href="/app-landing/features/schemas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Schémas visuels
            </Link>
            <Link
              href="/app-landing/features/traduction"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Traduction
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
