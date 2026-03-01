"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JoinPromoModal } from "@/components/beyond-center/join-promo-modal";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  Sparkles,
  Layers,
  FileText,
  Share2,
  Award,
  Lightbulb,
  Globe2,
  Users,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export function RPMCPresentationPage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";

  const competences = [
    {
      icon: Lightbulb,
      title: "Veille & innovation responsable",
      description:
        "Structurer une veille data/IA, identifier les tendances et nourrir la stratégie marketing dans un cadre éthique et durable.",
    },
    {
      icon: Target,
      title: "Stratégie marketing & communication",
      description:
        "Analyser briefs, marchés et personae pour concevoir des recommandations différenciantes et orientées résultats.",
    },
    {
      icon: Layers,
      title: "Pilotage de projets 360°",
      description:
        "Coordonner les équipes, budgets et plannings des dispositifs multicanaux en garantissant cohérence et impact.",
    },
    {
      icon: Sparkles,
      title: "Création responsable & inclusive",
      description:
        "Imaginer des expériences accessibles, des contenus éco-conçus et des campagnes engagées pour les publics visés.",
    },
    {
      icon: Globe2,
      title: "Mesure & optimisation",
      description:
        "Déployer dashboards, analyser KPI marketing/communication et recommander des optimisations en continu.",
    },
    {
      icon: ShieldCheck,
      title: "Traçabilité & qualité",
      description:
        "Documenter, capitaliser les preuves et piloter les open badges pour répondre aux exigences Qualiopi et clients.",
    },
  ];

  const modules = [
    {
      title: "Bloc 1 · Stratégie & positionnement",
      duration: "110h",
      content: [
        "Veille data & IA responsable",
        "Audit marketing et benchmark concurrentiel",
        "Analyse de brief & identification des opportunités",
        "Construction de la plateforme de marque",
      ],
    },
    {
      title: "Bloc 2 · Conception de projet",
      duration: "120h",
      content: [
        "Étude de marché qualitative & quantitative",
        "Design de parcours client omnicanal",
        "Budget prévisionnel & business plan responsable",
        "Scénarisation des expériences et ton de voix",
      ],
    },
    {
      title: "Bloc 3 · Production & diffusion",
      duration: "130h",
      content: [
        "Pilotage créatif (print, social, vidéo, event)",
        "Gestion d’équipes et de prestataires",
        "Communication inclusive & accessibilité",
        "Lancement, diffusion et amplification média",
      ],
    },
    {
      title: "Bloc 4 · Mesure, open badges & amélioration",
      duration: "100h",
      content: [
        "Plan de mesure & ROI marketing",
        "Collecte de feedbacks et animation de communautés",
        "Gestion des open badges et preuves de compétences",
        "Optimisation continue & reporting stratégique",
      ],
    },
  ];

  const badgeSteps = [
    {
      title: "Cartographier les compétences",
      description:
        "Chaque bloc RNCP est décliné en micro-compétences observables et attaché à un référentiel Beyond Center.",
    },
    {
      title: "Collecter des preuves",
      description:
        "Études de cas, dossiers, soutenances, productions médias : toutes les réalisations sont horodatées et déposées.",
    },
    {
      title: "Émettre le badge",
      description:
        "Après validation par le jury, l’apprenant reçoit un badge signé contenant critères, preuves et date d’expiration.",
    },
    {
      title: "Partager & suivre",
      description:
        "Les badges se partagent sur LinkedIn, portfolio ou CV numérique. Les entreprises vérifient l’authenticité en un clic.",
    },
  ];

  const evaluations = [
    {
      title: "Étude de cas stratégique",
      description:
        "Sur un brief réel, vous construisez un dossier complet : veille, audit, recommandation et plan d’action responsable.",
    },
    {
      title: "Dossier de projet marketing",
      description:
        "Vous formalisez planning, budget, plan média, indicateurs et actions correctives dans un portfolio professionnel.",
    },
    {
      title: "Soutenance devant jury",
      description:
        "Présentation orale avec supports inclusifs, démonstration des preuves et réponses aux questions des experts.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/beyond-center">
              <div
                className="text-2xl font-bold text-white"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                BEYOND <span className="font-light">CENTER</span>
              </div>
            </Link>
            <Link href="/beyond-center/pre-inscription">
              <Button
                className="rounded-full px-6 py-2 font-light"
                style={{
                  backgroundColor: blue,
                  color: white,
                }}
              >
                Pré-inscription
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-black via-black to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
            alt="Marketing communication"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="mb-6">
                <span
                  className="text-sm uppercase tracking-[0.28em] text-[#80b3ff] font-light"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  RNCP Niveau 6 · Marketing & Communication responsable
                </span>
              </div>
              <h1
                className="text-5xl md:text-7xl font-light mb-6 leading-tight text-white"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300,
                }}
              >
                Responsable de Projet
                <br />
                Marketing & Communication
              </h1>
              <p
                className="text-xl text-white/80 font-light mb-8 leading-relaxed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Concevez et pilotez des campagnes innovantes, responsables et mesurables. Une formation qui combine
                stratégie, création, data et open badges pour certifier vos compétences auprès des entreprises.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <JoinPromoModal
                  programName="Responsable de Projet Marketing & Communication"
                  programRef="tp_rpmc"
                  triggerLabel="Rejoindre la prochaine promo"
                />
                <Link href="#programme">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 text-lg font-light border-white/20 text-white hover:bg-white/10"
                  >
                    Découvrir le programme
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10"
            >
              <Image
                src="https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=2000&q=80"
                alt="Atelier marketing"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key facts */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Award, label: "Titre reconnu", value: "Niveau 6" },
              { icon: Clock, label: "Durée", value: "12 à 18 mois" },
              { icon: Calendar, label: "Modalités", value: "Alternance ou formation continue" },
              { icon: GraduationCap, label: "Certification", value: "France Compétences" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl border border-gray-200 hover:border-[#006CFF] transition-colors"
                >
                  <Icon className="h-8 w-8 mx-auto mb-4" style={{ color: blue }} />
                  <div
                    className="text-3xl font-light mb-2 text-black"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-600 font-light">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] rounded-3xl overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80"
                alt="Workshop communication"
                fill
                className="object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2
                className="text-4xl md:text-5xl font-light mb-6 text-black"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 300,
                }}
              >
                Un titre professionnalisant pour piloter des projets marketing responsables.
              </h2>
              <p className="text-lg text-gray-700 font-light mb-6 leading-relaxed">
                Inspiré du référentiel national « Responsable de projet marketing communication », ce programme vous
                forme à orchestrer stratégies, campagnes et innovations, tout en intégrant les enjeux de durabilité et
                d’inclusion.
              </p>
              <p className="text-lg text-gray-700 font-light mb-8 leading-relaxed">
                Au-delà de la certification, vous capitalisez sur un portfolio de projets réels, des preuves vérifiables et
                six open badges qui valorisent vos compétences auprès des recruteurs.
              </p>
              <Link href="/beyond-center/pre-inscription">
                <Button
                  className="rounded-full px-8 py-6 font-light"
                  style={{
                    backgroundColor: blue,
                    color: white,
                  }}
                >
                  Télécharger la brochure complète
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compétences */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2
              className="text-4xl md:text-5xl font-light mb-6 text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300,
              }}
            >
              Les compétences clés que vous développez
            </h2>
            <p className="text-xl text-white/70 font-light max-w-2xl mx-auto">
              Pilotage stratégique, créativité responsable et maîtrise des data pour des campagnes à fort impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competences.map((competence, index) => {
              const Icon = competence.icon;
              return (
                <motion.div
                  key={competence.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-[#101320] border border-white/10 hover:border-[#006CFF] transition-all"
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#006CFF]/15">
                      <Icon className="h-8 w-8 text-[#66a8ff]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-light mb-3 text-white">{competence.title}</h3>
                  <p className="text-white/75 font-light leading-relaxed">{competence.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300,
              }}
            >
              Un programme construit sur les blocs du référentiel national
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              460 heures de formation, des projets réels et un accompagnement expert pour valider chaque bloc de compétences.
            </p>
          </motion.div>

          <div className="space-y-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl border-2 border-gray-200 hover:border-[#006CFF] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-light"
                        style={{ backgroundColor: blue }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-light text-black">{module.title}</h3>
                        <p className="text-sm text-gray-600 font-light">{module.duration}</p>
                      </div>
                    </div>
                    <ul className="space-y-2 ml-16">
                      {module.content.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: blue }} />
                          <span className="text-gray-700 font-light">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open badges section */}
      <section className="py-32 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300,
              }}
            >
              Les open badges, moteur de reconnaissance et de motivation
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light max-w-3xl mx-auto">
              En conformité avec les attendus Qualiopi, chaque micro-compétence validée est attestée par un badge
              numérique signé, intégrant les preuves de vos réalisations.
            </p>
          </motion.div>

          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-3xl border border-black/5 bg-white p-10 shadow-[0_40px_160px_-110px_rgba(15,23,42,0.35)]"
            >
              <h3 className="text-2xl font-light text-black">Les bénéfices pour vous</h3>
              <ul className="mt-6 space-y-4 text-sm md:text-base text-gray-600 font-light">
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-[#006CFF]" />
                  <span>Portefeuille de compétences vérifiable et partageable sur LinkedIn, CV, portfolio.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-[#006CFF]" />
                  <span>Vision claire de votre progression et feedbacks personnalisés à chaque jalon.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 text-[#006CFF]" />
                  <span>Alignement direct avec les blocs de compétences du référentiel France Compétences.</span>
                </li>
              </ul>
              <div className="mt-10 space-y-5">
                {badgeSteps.map((step, index) => (
                  <div key={step.title} className="flex items-start gap-4 rounded-2xl bg-black/5 p-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: blue, color: white }}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-light text-black">{step.title}</h4>
                      <p className="text-sm text-gray-600 font-light leading-relaxed mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-3xl border border-black/5 bg-black text-white p-10 space-y-6 shadow-[0_50px_160px_-110px_rgba(6,18,36,0.45)]"
            >
              <h3
                className="text-2xl font-light"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                }}
              >
                Pour les entreprises partenaires
              </h3>
              <ul className="space-y-4 text-sm md:text-base text-white/80 font-light">
                <li className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-[#38bdf8]" />
                  <span>Vérification instantanée des compétences validées et des preuves associées.</span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-[#38bdf8]" />
                  <span>Tableaux de bord dédiés pour suivre la progression des alternants.</span>
                </li>
                <li className="flex gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-[#38bdf8]" />
                  <span>Alignement avec les critères Qualiopi : suivi, évaluation, amélioration continue.</span>
                </li>
              </ul>
              <Link href="/beyond-center/formations/rpmc#programme">
                <Button className="rounded-full px-8 py-5 font-light bg-white text-black hover:bg-white/90">
                  Consulter le syllabus détaillé
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Évaluations */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300,
              }}
            >
              Les modalités d’évaluation
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Conformes au référentiel national : étude de cas, dossier professionnel et soutenance devant jury d’experts.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {evaluations.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-3xl border border-black/5 bg-gradient-to-br from-white via-white to-slate-50/70 shadow-[0_45px_140px_-110px_rgba(0,0,0,0.3)]"
              >
                <FileText className="h-8 w-8 text-[#006CFF] mb-4" />
                <h3 className="text-xl font-light text-black mb-3">{item.title}</h3>
                <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2
              className="text-4xl md:text-6xl font-light mb-6 text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300,
              }}
            >
              Prêt·e à piloter des projets marketing à fort impact ?
            </h2>
            <p className="text-xl text-white/70 font-light mb-12 max-w-2xl mx-auto">
              Parlons de votre projet et des possibilités d’alternance avec nos entreprises partenaires.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beyond-center/pre-inscription">
                <Button
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{
                    backgroundColor: blue,
                    color: white,
                  }}
                >
                  Je candidate
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/beyond-center/conseiller">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-10 py-7 text-lg font-light border-white/20 text-white hover:bg-white/10"
                >
                  Parler à un conseiller
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div
              className="text-xl font-bold text-white"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              BEYOND <span className="font-light">CENTER</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-white/60 text-sm font-light">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+33 (0)9 70 80 90 60</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>admissions@beyondcenter.fr</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Campus Beyond Center · Rouen</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


