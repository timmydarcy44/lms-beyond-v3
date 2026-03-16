"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Sparkles, Share2 } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function FlashcardsPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Générateur de Flashcards IA | Mémorisation par Répétition Espacée | nevo.</title>
        <meta
          name="description"
          content="Créez des flashcards automatiquement depuis vos cours. Utilisez la méthode scientifique pour ne plus jamais oublier vos révisions."
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
            Mémorisez durablement avec les Flashcards IA.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Ne perdez plus de temps à créer vos cartes de révision. nevo. analyse vos cours et génère
            automatiquement des flashcards basées sur la méthode scientifique de répétition espacée.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Générer mes flashcards
            </a>
            <a
              href="#science"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Comment ça marche ?
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center" id="science">
            <div className="relative w-64 h-40 perspective-1000">
              <div className="absolute inset-0 transition-transform duration-700 transform-style-preserve-3d hover:rotate-y-180">
                <div className="absolute inset-0 rounded-2xl bg-white/20 border border-white/30 shadow-sm flex items-center justify-center backface-hidden">
                  <span className="text-white/80 text-sm">Concept complexe</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-white/30 border border-white/40 shadow-sm flex items-center justify-center rotate-y-180 backface-hidden">
                  <span className="text-white text-sm">
                    Définition simplifiée par{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>
                  </span>
                </div>
              </div>
            </div>
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
          La répétition espacée, version automatique.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          La science est claire : la mémorisation active est la méthode la plus efficace pour retenir des
          informations à long terme. Mais créer des centaines de cartes est épuisant. nevo. utilise l'IA
          pour identifier les paires "Question/Réponse" les plus probables de tomber à l'examen.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Boostez votre mémoire à long terme.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Notre algorithme planifie vos sessions de révision pour solliciter votre cerveau juste avant
          l'oubli. C'est la clé pour réussir les concours les plus exigeants.
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
            Une machine à apprendre dans votre poche.
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Layers,
                title: "Extraction de Concepts",
                desc: (
                  <>
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    repère les définitions, dates, formules et théorèmes pour les transformer en défis.
                  </>
                ),
              },
              {
                icon: Sparkles,
                title: "Personnalisation par l'IA",
                desc: (
                  <>
                    Trop difficile ? Trop simple ? Demandez à{" "}
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    de reformuler la carte en temps réel pour l'adapter à votre niveau.
                  </>
                ),
              },
              {
                icon: Share2,
                title: "Export & Mobilité",
                desc: "Synchronisez vos decks sur tous vos appareils ou exportez-les vers vos outils préférés (Anki, CSV).",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
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
          Transformez la corvée en jeu.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Pour un profil TDAH, l'aspect ludique et rapide des flashcards est salvateur. En supprimant la
          barrière de la création (souvent source de procrastination), nevo. permet de passer directement
          à l'action. Des sessions courtes, intenses et gratifiantes.
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
          Tout savoir sur les Flashcards nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Combien de flashcards puis-je générer par cours ?",
              a: (
                <>
                  Autant que nécessaire.{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  segmente vos documents par chapitres pour créer des decks cohérents et digestes.
                </>
              ),
            },
            {
              q: "Puis-je créer mes propres cartes manuellement ?",
              a: "Bien sûr. Vous pouvez mixer vos propres questions avec celles générées par l'IA pour un deck 100% personnalisé.",
            },
            {
              q: "L'IA comprend-elle les images et les graphiques ?",
              a: (
                <>
                  Oui,{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  peut analyser des schémas pour vous interroger sur les légendes ou les relations entre
                  les éléments.
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
        .perspective-1000 { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
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
