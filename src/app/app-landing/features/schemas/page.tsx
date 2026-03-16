"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Image as ImageIcon, Share2, GitBranch, Focus } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function SchemasPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Transformer un Texte en Schéma IA | Mindmapping Automatique | nevo.</title>
        <meta
          name="description"
          content="Visualisez vos cours instantanément. nevo. génère des schémas logiques et des cartes mentales à partir de vos textes pour une mémoire visuelle boostée."
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
            Donnez une forme visuelle à vos connaissances.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Le cerveau traite les images 60 000 fois plus vite que le texte. nevo. transforme
            instantanément vos paragraphes en schémas logiques et cartes mentales pour une
            compréhension immédiate.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Générer mon premier schéma
            </a>
            <a
              href="#modeles"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Voir les modèles
            </a>
          </div>

          <motion.div
            id="modeles"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-60 rounded-2xl border border-white/30 bg-white/20 flex items-center justify-center text-sm text-white/70 relative overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6, y: 12 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, type: "spring", stiffness: 120 }}
                  className="absolute h-10 w-24 rounded-xl border border-white/40 bg-white/20"
                  style={{ top: `${20 + i * 6}%`, left: `${20 + (i % 3) * 20}%` }}
                />
              ))}
              <span>[MOCKUP CENTRAL]</span>
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
          Pourquoi le texte linéaire sature votre mémoire.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          La surcharge cognitive survient quand trop d'informations se bousculent sans structure visible.
          Pour les profils visuels ou neuro-atypiques, un mur de texte est illisible. nevo. décode la
          structure cachée de vos cours pour en faire une carte routière visuelle.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Visualisez les connexions, retenez l'essentiel.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Comprendre, c'est lier les idées entre elles. Nos algorithmes de graph-mapping identifient les
          relations de cause à effet et les hiérarchies pour que vous n'ayez plus à les chercher.
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
            L'intelligence artificielle qui dessine pour vous.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ImageIcon,
                title: "Mindmapping Automatique",
              desc: (
                <>
                  Glissez votre cours,{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  génère une arborescence complète en quelques secondes.
                </>
              ),
              },
              {
                icon: GitBranch,
                title: "Schémas de Flux",
                desc: "Idéal pour les processus scientifiques, historiques ou juridiques : visualisez les étapes logiques d'un concept.",
              },
              {
                icon: Share2,
                title: "Interactivité Totale",
              desc: (
                <>
                  Les schémas ne sont pas figés. Cliquez sur un nœud pour que{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  vous l'explique ou l'approfondisse.
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
          Un design épuré pour zéro distraction.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Nos schémas sont conçus selon les principes de la charge cognitive : pas de couleurs agressives,
          une symétrie reposante et une police adaptée. C'est l'outil parfait pour les étudiants TDAH qui
          ont besoin de voir "le Big Picture" pour rester engagés.
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
          Questions sur les schémas nevo.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "Puis-je modifier le schéma généré ?",
              a: (
                <>
                  Absolument. Vous pouvez déplacer les blocs, changer les couleurs ou demander à{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  d'ajouter une branche spécifique.
                </>
              ),
            },
            {
              q: "Dans quels formats puis-je exporter ?",
              a: "Exportez vos créations en PNG haute résolution, en PDF ou même en SVG pour vos présentations.",
            },
            {
              q: "Est-ce que ça marche pour les matières scientifiques ?",
              a: "Oui, c'est particulièrement efficace pour les cycles biologiques, les algorithmes informatiques ou les structures chimiques.",
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
              href="/app-landing/features/quiz"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Quiz interactif
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
