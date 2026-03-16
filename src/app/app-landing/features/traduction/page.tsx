"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Languages, Layers3, BookOpenCheck, AudioLines } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function TraductionPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Traduction Pédagogique IA | Comprenez vos cours en 100 langues | nevo.</title>
        <meta
          name="description"
          content="Plus qu'une traduction, une adaptation. nevo. traduit vos supports de cours en conservant le sens technique et académique."
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
            La barrière de la langue n'est plus un obstacle à votre réussite.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Plus qu'une simple traduction, une adaptation pédagogique. nevo. traduit vos supports de cours
            en conservant la précision technique et le contexte académique.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Traduire mon premier document
            </a>
            <a
              href="#langues"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              100+ langues disponibles
            </a>
          </div>

          <motion.div
            id="langues"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-[shimmer_2.4s_infinite]" />
            <div className="h-56 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center text-sm text-white/70 relative">
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
          Pourquoi les traducteurs classiques échouent en éducation.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Traduire un cours de neurosciences ou un traité de droit constitutionnel ne s'improvise pas.
          Les outils génériques font du mot-à-mot, perdant souvent la nuance scientifique. nevo. utilise
          des modèles d'IA entraînés sur des corpus académiques pour garantir une fidélité totale à
          l'enseignement original.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          L'outil indispensable des étudiants internationaux.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Que vous suiviez un cursus Erasmus ou que vous consultiez des sources étrangères pour votre
          thèse, accédez à une connaissance fluide, naturelle et immédiate.
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
            Une précision chirurgicale pour vos études.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Layers3,
                title: "Préservation de la mise en page",
                desc: (
                  <>
                    Importez un PDF ou un schéma :{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    traduit le texte sans jamais casser la structure visuelle de votre document.
                  </>
                ),
              },
              {
                icon: BookOpenCheck,
                title: "Glossaire Technique",
                desc: "L'IA identifie et respecte les termes propres à votre domaine (Droit, Médecine, Ingénierie, Business).",
              },
              {
                icon: AudioLines,
                title: "Transcription Audio Bilingue",
                desc: "Transformez vos fichiers audio de conférences étrangères en textes traduits et structurés.",
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
          Apprenez dans la langue qui vous ressemble.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Pour les étudiants Dyslexiques ou TDAH, la fatigue cognitive est doublée lors de la lecture dans
          une langue étrangère. En traduisant instantanément vos supports dans votre langue maternelle (ou
          une langue plus confortable), nevo. libère de l'espace mental pour la compréhension réelle du
          sujet.
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
          Questions sur la traduction nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Quelles sont les langues supportées ?",
              a: "Plus de 100 langues sont disponibles, incluant le Français, l'Anglais, l'Espagnol, l'Allemand, l'Arabe, le Mandarin et le Japonais.",
            },
            {
              q: "L'IA peut-elle traduire des notes manuscrites ?",
              a: (
                <>
                  Oui, grâce à notre technologie OCR, prenez en photo un tableau ou vos notes, et{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  les traduit instantanément.
                </>
              ),
            },
            {
              q: "Puis-je discuter avec le texte traduit ?",
              a: (
                <>
                  C'est la force de nevo. Vous pouvez poser des questions sur le contenu traduit directement
                  à{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  pour approfondir un point.
                </>
              ),
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

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Découvrir d'autres outils</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/app-landing/features/audio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Audio immersif
            </Link>
            <Link
              href="/app-landing/features/schemas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Schémas visuels
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
