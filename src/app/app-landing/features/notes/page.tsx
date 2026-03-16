"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { FilePenLine, Link2, Mic, Sparkles } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function NotesPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Prise de Notes IA | Organisez vos pensées avec Neo | nevo.</title>
        <meta
          name="description"
          content="Une prise de notes qui réfléchit avec vous. Structurez vos idées en temps réel et laissez l'IA organiser votre bibliothèque de connaissances."
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
            Une prise de notes qui réfléchit avec vous.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Ne vous contentez pas d'écrire, structurez. nevo. transforme vos notes de cours en une base de
            connaissances organisée, hiérarchisée et connectée grâce à l'IA.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Créer ma première note
            </a>
            <a
              href="#organisation"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Voir l'organisation intelligente
            </a>
          </div>

          <motion.div
            id="organisation"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-64 rounded-2xl border border-white/30 bg-white/20 p-6 relative shadow-[0_0_24px_rgba(255,255,255,0.15)]">
              <div className="text-left text-white/80 text-sm">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  [MOCKUP CENTRAL]
                </motion.span>
              </div>
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "60%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4 }}
                className="mt-6 h-2 rounded-full bg-white/40"
              />
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
          Libérez votre charge mentale.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Prendre des notes en plein cours est souvent un chaos. Pour un profil TDAH, l'effort de mise en
          page tue la concentration sur le fond. nevo. agit comme un secrétaire intelligent : pendant que
          vous notez l'essentiel,{" "}
          <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
            Neo
          </Link>{" "}
          nettoie la structure et suggère des titres pertinents en temps réel.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          La fin des notes perdues.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Grâce à la recherche sémantique, ne cherchez plus vos notes par titre, mais par concept.
          Demandez à{" "}
          <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
            Neo
          </Link>{" "}
          : "Qu'est-ce que j'ai noté sur la mitose le mois dernier ?" et il vous y emmène.
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
            Votre bibliothèque de savoirs augmentée.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                key: "auto-format",
                icon: Sparkles,
                title: "Auto-Formatage",
                desc: "L'IA détecte l'importance des phrases pour appliquer automatiquement le bon niveau de titre et de style.",
              },
              {
                key: "maillage",
                icon: Link2,
                title: "Maillage Interne IA",
                desc: (
                  <>
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    suggère des connexions entre vos notes actuelles et vos cours passés pour une vision
                    d'ensemble.
                  </>
                ),
              },
              {
                key: "dictee",
                icon: Mic,
                title: (
                  <>
                    Mode Dictée{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>
                  </>
                ),
                desc: (
                  <>
                    Prenez des notes à la voix.{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    transcrit, ponctue et structure votre pensée sans aucune faute.
                  </>
                ),
              },
            ].map(({ key, icon: Icon, title, desc }) => (
              <motion.div
                key={key}
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
          L'organisation sans l'effort.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          L'organisation est une fonction exécutive coûteuse. nevo. la prend à sa charge. Pour les
          étudiants Dyspraxiques ou TDAH, notre éditeur minimaliste élimine les distractions visuelles pour
          ne laisser que le plaisir de la pensée et de la création.
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
          Questions sur les notes nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Puis-je importer mes anciennes notes ?",
              a: (
                <>
                  Oui, importez vos fichiers Word, Markdown ou PDF.{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  les analysera pour les intégrer intelligemment dans votre nouvelle structure.
                </>
              ),
            },
            {
              q: "Mes notes sont-elles accessibles hors-ligne ?",
              a: (
                <>
                  Absolument. Prenez vos notes même sans connexion, elles se synchroniseront dès que vous
                  retrouverez le réseau pour vos{" "}
                  <Link href="/fiches-revision" className="underline underline-offset-4 hover:text-white/80">
                    révisions
                  </Link>
                  .
                </>
              ),
            },
            {
              q: "Est-ce compatible avec le Markdown ?",
              a: "Oui, nevo. supporte pleinement le langage Markdown pour les utilisateurs avancés qui aiment garder le contrôle.",
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
              href="/app-landing/features/fiches-revision"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Fiches de révision
            </Link>
            <Link
              href="/app-landing/features/flashcards"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Flashcards IA
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
