"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ScanLine, Brain, Layers3 } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function FichesRevisionPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Générateur de Fiches de Révision IA | Études & TDAH | nevo.</title>
        <meta
          name="description"
          content="Transformez vos cours denses en fiches structurées. Une IA conçue pour la clarté mentale et la réussite des étudiants neuro-atypiques."
        />
      </Head>

      {/* HERO SECTION */}
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
            Transformez vos cours denses en fiches de révision intelligentes.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Ne passez plus des heures à synthétiser. L'IA de nevo. analyse vos documents et extrait
            l'essentiel dans un format conçu pour la mémorisation active.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Générer ma première fiche gratuitement
            </a>
            <a
              href="#exemple"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Voir un exemple
            </a>
          </div>

          <div id="exemple" className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8">
            <div className="h-56 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center text-sm text-white/70">
              [PLACEHOLDER PHOTO/MOCKUP]
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D'AUTORITÉ */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-6 text-white"
        >
          Pourquoi la prise de notes classique freine votre réussite.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          La majorité des étudiants passent 80 % de leur temps à organiser l'information et seulement 20
          % à l'apprendre. Pour un profil TDAH ou Dys, cette phase de tri est une montagne insurmontable
          qui mène souvent au découragement. nevo. automatise la structure pour libérer votre potentiel.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Extraction sémantique haute précision.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Notre IA ne se contente pas de résumer. Elle utilise le NLP (Natural Language Processing) pour
          isoler les définitions, les dates clés, et les formules mathématiques.
        </motion.p>
      </section>

      {/* SECTION FONCTIONNALITÉS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-3xl font-semibold mb-10 text-white"
          >
            Une technologie conçue pour la clarté mentale.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ScanLine,
                title: "Analyse Multi-Format",
                desc: (
                  <>
                    Importez PDF, Word, ou photos de vos notes manuscrites.{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    s'occupe de la numérisation (OCR).
                  </>
                ),
              },
              {
                icon: Brain,
                title: "Neuro-Ergonomie",
                desc: "Polices adaptées (OpenDyslexic), espacement optimisé et hiérarchie visuelle stricte pour réduire la fatigue oculaire.",
              },
              {
                icon: Layers3,
                title: "Écosystème Connecté",
                desc: "Transformez vos fiches en Flashcards ou en Quiz en un clic.",
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

      {/* SECTION EXPERTISE */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-6 text-white"
        >
          Le compagnon idéal des cerveaux atypiques (et des autres).
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Que vous soyez en école de médecine, en droit, ou en alternance en CFA, nevo. s'adapte à votre
          charge cognitive. En éliminant le "bruit" visuel et textuel, nous permettons une immersion
          totale. C'est la différence entre lire un cours et le posséder. C'est l'outil indispensable pour
          compenser les fonctions exécutives.
        </motion.p>
      </section>

      {/* FAQ */}
      <section className="py-20 max-w-4xl mx-auto px-6">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-3xl font-semibold mb-8 text-white"
        >
          Tout savoir sur le générateur de fiches nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "L'IA peut-elle se tromper dans le résumé ?",
              a: (
                <>
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  travaille exclusivement sur la base de vos documents (Source-grounding) pour garantir une
                  fidélité totale à votre cours.
                </>
              ),
            },
            {
              q: "Puis-je exporter mes fiches ?",
              a: "Bien sûr. Exportez en PDF pour l'impression, en Markdown pour Notion, ou transformez-les en Flashcards.",
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
              href="/app-landing/features/quiz"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Quiz interactif
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
