"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Waveform, Headphones, Gauge, Highlighter } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function AudioPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Lecteur Immersif & Audio IA | Transformez vos Cours en Podcasts | nevo.</title>
        <meta
          name="description"
          content="Écoutez vos cours avec des voix humaines ultra-réalistes. La solution idéale pour les étudiants dyslexiques et l'apprentissage nomade."
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
            Transformez vos cours en une expérience sonore immersive.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Vos yeux fatiguent ? Laissez vos oreilles prendre le relais. nevo. convertit vos supports écrits
            en podcasts pédagogiques haute fidélité grâce à des voix IA ultra-naturelles.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Écouter mon premier cours
            </a>
            <a
              href="#voix"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Découvrir nos voix
            </a>
          </div>

          <motion.div
            id="voix"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="rounded-2xl border border-white/30 bg-white/20 p-6 text-left">
              <div className="flex items-center justify-between text-sm text-white/80 mb-4">
                <span>Podcast · Neurosciences</span>
                <span>12:34</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="h-12 w-12 rounded-full bg-white/30 border border-white/40 flex items-center justify-center"
                >
                  <Play className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <p className="text-white font-semibold">Cours 4 · Synapses</p>
                  <p className="text-white/60 text-xs">Lecture immersive</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 8 }}
                    animate={{ height: [6, 18, 10] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.05 }}
                    className="w-1 rounded-full bg-white/60"
                  />
                ))}
              </div>
              <div className="mt-4 text-white/60 text-xs">[MOCKUP CENTRAL]</div>
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
          Apprenez partout, tout le temps.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Le temps passé dans les transports ou à marcher est souvent du temps perdu pour vos révisions.
          Avec la fonctionnalité Audio de nevo., votre bibliothèque devient une playlist de savoirs. C'est
          l'outil parfait pour multiplier vos heures d'apprentissage sans augmenter votre temps d'écran.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Une prothèse pour la lecture.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Pour les profils Dyslexiques ou souffrant de troubles de l'attention, le déchiffrage de longs
          textes est une barrière. L'audio fluidifie l'accès à l'information et permet de se concentrer sur
          le sens plutôt que sur la forme.
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
            Bien plus qu'une simple lecture automatique.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Headphones,
                title: "Voix HD Naturelles",
                desc: "Fini les voix robotiques. Nos voix utilisent le Deep Learning pour adopter une intonation humaine et un rythme naturel.",
              },
              {
                icon: Gauge,
                title: "Vitesse Personnalisable",
                desc: "Adaptez la diction à votre besoin : de x0.5 pour l'analyse profonde à x2.0 pour une révision flash.",
              },
              {
                icon: Highlighter,
                title: "Surlignage Synchrone",
                desc: (
                  <>
                    Suivez la lecture sur le texte en temps réel : les mots s'éclairent au fur et à mesure
                    que{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    les prononce.
                  </>
                ),
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
          Réduisez la fatigue cognitive.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Le cerveau traite les informations auditives différemment. En alternant entre lecture visuelle
          et écoute, vous engagez plusieurs zones de votre mémoire. nevo. vous aide à créer une routine de
          révision multimodale pour un ancrage durable.
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
          Questions sur l'Audio nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Est-ce que l'IA peut lire des formules mathématiques ?",
              a: (
                <>
                  Oui,{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  est entraîné pour traduire les symboles complexes, les équations et les dates en un
                  langage parlé compréhensible.
                </>
              ),
            },
            {
              q: "Puis-je télécharger les fichiers audio ?",
              a: "Absolument. Exportez vos cours en format MP3 pour les écouter même sans connexion internet.",
            },
            {
              q: "Quelles langues sont disponibles ?",
              a: "Toutes les langues de la plateforme (100+) bénéficient de voix haute fidélité, vous permettant même de pratiquer une langue étrangère par l'écoute.",
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
              href="/app-landing/features/traduction"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Traduction
            </Link>
            <Link
              href="/app-landing/features/mode-focus"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Mode Focus
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
