"use client";

import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ListChecks } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function QuizPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <Head>
        <title>Générateur de Quiz IA | Auto-évaluation & Révisions | nevo.</title>
        <meta
          name="description"
          content="Testez vos connaissances instantanément. nevo. transforme vos cours en quiz interactifs et QCM personnalisés pour valider vos acquis avant l'examen."
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
            Ne vous demandez plus si vous savez. Prouvez-le.
          </motion.h1>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-white/80 text-lg leading-relaxed mb-10"
          >
            Transformez n'importe quel cours en quiz interactif. nevo. analyse vos documents pour créer
            des examens blancs personnalisés qui ciblent vos points faibles.
          </motion.p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app-landing/signup"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold shadow-sm hover:scale-105 transition-transform"
            >
              Créer mon quiz maintenant
            </a>
            <a
              href="#types"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/20 text-white font-semibold backdrop-blur border border-white/40 hover:bg-white/30 transition-colors"
            >
              Voir les types de questions
            </a>
          </div>

          <motion.div
            id="types"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 rounded-3xl border border-white/30 bg-white/15 shadow-sm p-8"
          >
            <div className="h-64 rounded-2xl border border-white/30 bg-white/20 p-6 relative overflow-hidden">
              <div className="h-2 rounded-full bg-white/20 mb-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "60%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4 }}
                  className="h-full bg-white"
                />
              </div>
              <div className="text-left text-white/90 text-sm font-semibold mb-4 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Question 4/10
              </div>
              <div className="text-left text-white text-lg font-semibold mb-4">
                Quelle est la principale fonction du cortex préfrontal ?
              </div>
              <div className="space-y-3 text-left">
                <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-3">A. Traitement visuel</div>
                <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-3">B. Prise de décision</div>
                <div className="rounded-xl border border-white/30 bg-white/10 px-4 py-3">C. Mémoire auditive</div>
              </div>
              <div className="mt-6 flex items-center gap-3 text-sm">
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: -4 }}
                  className="flex items-center gap-2 text-white/90"
                >
                  <XCircle className="h-4 w-4 text-red-200" />
                  Incorrect
                </motion.div>
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 text-white/90"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  Bonne réponse
                </motion.div>
              </div>
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
          Brisez l'illusion de maîtrise.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed mb-10"
        >
          Relire ses notes donne l'impression de connaître son sujet. C'est un piège. Le Testing Effect
          prouve que l'on retient 50% d'informations en plus en se testant activement. nevo. élimine la
          corvée de création de questions pour vous laisser le plaisir de progresser.
        </motion.p>
        <motion.h3
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-xl font-semibold mb-3 text-[#FFE2C7]"
        >
          Un simulateur d'examen dans votre poche.
        </motion.h3>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
            Neo
          </Link>{" "}
          détecte les nuances, les exceptions et les chiffres clés de votre cours pour générer des
          questions qui ressemblent à celles de vos professeurs.
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
            Bien plus qu'un simple QCM.
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Variété de formats",
                desc: "QCM, questions à trous, vrai/faux ou réponses ouvertes : variez les plaisirs pour une mémorisation totale.",
              },
              {
                title: "Feedback détaillé",
                desc: (
                  <>
                    <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                      Neo
                    </Link>{" "}
                    ne se contente pas de corriger. Il vous explique pourquoi vous vous êtes trompé en
                    citant la partie précise de votre cours.
                  </>
                ),
              },
              {
                title: "Analyse des lacunes",
                desc: "Identifiez instantanément les chapitres que vous maîtrisez et ceux qui demandent encore un effort.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className={glassCardClass}
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{item.desc}</p>
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
          Réduisez l'anxiété de l'examen.
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-white/80 text-lg leading-relaxed"
        >
          Pour les profils neuro-atypiques, l'inconnu est source de stress. En multipliant les auto-
          évaluations dans un environnement zen et sans jugement, vous habituez votre cerveau à la
          restitution d'information et gagnez en confiance pour le jour J.
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
          Tout savoir sur le générateur de Quiz.
        </motion.h2>
        <div className="space-y-4">
          {[
            {
              q: "L'IA peut-elle créer des quiz à partir d'images ?",
              a: (
                <>
                  Oui, téléchargez la photo d'un schéma ou d'un tableau manuscrit, et{" "}
                  <Link href="/neuro-adapte" className="underline underline-offset-4 hover:text-white/80">
                    Neo
                  </Link>{" "}
                  formulera des questions pertinentes basées sur le contenu visuel.
                </>
              ),
            },
            {
              q: "Est-ce que je peux limiter le temps de réponse ?",
              a: "Absolument. Vous pouvez activer un chronomètre pour simuler les conditions réelles d'un examen et travailler votre gestion du temps.",
            },
            {
              q: "Puis-je partager mon quiz avec d'autres étudiants ?",
              a: "Oui, exportez vos quiz ou partagez un lien direct pour réviser en groupe.",
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
              href="/app-landing/features/flashcards"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Flashcards IA
            </Link>
            <Link
              href="/app-landing/features/fiches-revision"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Fiches de révision
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
