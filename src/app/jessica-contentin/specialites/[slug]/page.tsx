"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Users, Clock, Target, Heart, TrendingUp, Award, Brain, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";
import { jessicaStorageUrl } from "@/lib/jessica-contentin/media-urls";
import { useState } from "react";
import { StrategicInternalLinks } from "@/components/jessica-contentin/strategic-internal-links";
import { SPECIALITY_SEO_CONFIG } from "@/lib/seo/link-juice-strategy";
import Link from "next/link";
import Script from "next/script";
const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const AUDIENCE_LINE = "Enfants • Adolescents • Étudiants • Adultes";

const CONFIDANCE_HERO_IMAGE = jessicaStorageUrl("Confiance_en_soi_test.png");

// Couleurs du branding Jessica Contentin
const primaryColor = "#8B6F47"; // Marron principal
const accentColor = "#D4AF37"; // Doré
const secondaryColor = "#E6D9C6"; // Beige clair
const bgColor = "#F8F5F0"; // Beige très clair
const surfaceColor = "#FFFFFF"; // Blanc
const textColor = "#2F2A25"; // Marron foncé

const specialitesContent: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  heroImage?: string;
  stats?: { value: string; label: string }[];
  whatIs: {
    title: string;
    description: string;
    details: string[];
  };
  programBreakdown: {
    month: number;
    title: string;
    description: string;
    icon: any;
  }[];
  testimonials: {
    quote: string;
    author: string;
    role: string;
  }[];
  benefits: {
    title: string;
    description: string;
    icon: any;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  forWho: string[];
}> = {
  "confiance-en-soi": {
    title: "Renforcer la confiance en soi et l'estime de soi",
    subtitle: "Mieux se connaître, renforcer sa confiance et mobiliser ses ressources.",
    description: "Cet accompagnement vise à renforcer progressivement les compétences essentielles à la confiance en soi : compréhension de soi, régulation émotionnelle, affirmation de soi, valorisation des ressources personnelles et autonomie.",
    heroImage: CONFIDANCE_HERO_IMAGE,
    stats: [
      { value: "10+ ans", label: "d'expérience dans l'éducation et l'accompagnement" },
      { value: "100+", label: "jeunes accompagnés" },
      { value: "1:1", label: "Accompagnement individualisé" },
      { value: "Bretteville-sur-Odon", label: "Cabinet près de Caen" },
    ],
    whatIs: {
      title: "",
      description: "",
      details: [
        "Chaque étape est adaptée aux besoins, au rythme et aux objectifs de la personne accompagnée.",
        "Accompagnement assuré par une professeure en santé et psychopédagogue certifiée en neuroéducation.",
        "Présentiel ou visioconférence — Un accompagnement accessible partout en France, avec le même niveau de suivi et de personnalisation.",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [
      {
        title: "Comprendre son fonctionnement",
        description: "Identifier les mécanismes qui influencent l'image de soi, les émotions et les comportements du quotidien.",
        icon: Brain,
      },
      {
        title: "Renforcer l'estime de soi",
        description: "Développer une perception plus juste de ses capacités, de ses qualités et de ses ressources personnelles.",
        icon: Sparkles,
      },
      {
        title: "Développer la confiance en soi",
        description: "Oser agir malgré les doutes, prendre sa place et gagner en assurance dans les situations du quotidien.",
        icon: TrendingUp,
      },
      {
        title: "Apprendre à s'affirmer",
        description: "Exprimer ses besoins, poser ses limites et communiquer avec davantage de sérénité.",
        icon: Award,
      },
      {
        title: "Réguler ses émotions",
        description: "Mieux comprendre ses réactions émotionnelles et développer des stratégies adaptées face au stress et aux difficultés.",
        icon: Heart,
      },
      {
        title: "Développer son autonomie",
        description: "Renforcer sa capacité à prendre des décisions, à faire des choix et à avancer avec davantage de confiance.",
        icon: Target,
      },
    ],
    faqs: [],
    forWho: [
      "Vous manquez de confiance en vous.",
      "Vous avez peur du regard des autres.",
      "Vous doutez régulièrement de vos capacités.",
      "Vous avez du mal à prendre votre place.",
      "Vous manquez d'assurance dans votre scolarité ou vos études.",
      "Vous avez tendance à vous comparer aux autres.",
    ],
  },
  // Contenu par défaut pour les autres spécialités
  "gestion-stress": {
    title: "Gestion du stress",
    subtitle: "Techniques et stratégies pour mieux gérer le stress au quotidien",
    description: "Apprenez à identifier les sources de votre stress et développez des outils concrets pour y faire face.",
    whatIs: {
      title: "Qu'est-ce que l'accompagnement en gestion du stress ?",
      description: "Un accompagnement personnalisé pour vous aider à mieux comprendre et gérer votre stress au quotidien.",
      details: [
        "Techniques de relaxation et de respiration",
        "Stratégies d'adaptation et de gestion du temps",
        "Accompagnement personnalisé adapté à vos besoins",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "tnd": {
    title: "TDAH, TSA, troubles DYS et Haut Potentiel",
    subtitle: "Accompagnement spécialisé des troubles du neurodéveloppement",
    description: "Comprendre le fonctionnement de l'enfant afin de mettre en place des stratégies adaptées à ses besoins à l'école, à la maison et dans son quotidien.",
    whatIs: {
      title: "",
      description: "",
      details: [],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "guidance-parentale": {
    title: "Comprendre mieux son enfant",
    subtitle: "Comprendre son enfant pour mieux l'accompagner au quotidien",
    description: "Un accompagnement destiné aux parents souhaitant mieux comprendre les besoins de leur enfant et mettre en place des stratégies éducatives adaptées à leur situation familiale.",
    whatIs: {
      title: "Guidance parentale",
      description: "Un accompagnement destiné aux parents souhaitant mieux comprendre les besoins de leur enfant et mettre en place des stratégies éducatives adaptées à leur situation familiale.",
      details: [],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "tests": {
    title: "Tests de connaissance de soi",
    subtitle: "Évaluations et bilans pour mieux se connaître",
    description: "Des bilans psychopédagogiques approfondis pour mieux comprendre vos compétences.",
    whatIs: {
      title: "Qu'est-ce que les tests de connaissance de soi ?",
      description: "Des évaluations pour mieux vous connaître et identifier vos forces.",
      details: [
        "Bilans psychopédagogiques approfondis",
        "Identification de vos compétences",
        "Recommandations personnalisées",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "harcelement": {
    title: "Harcèlement scolaire",
    subtitle: "Accompagner, protéger et reconstruire",
    description: "Un accompagnement destiné aux enfants, adolescents et familles confrontés à une situation de harcèlement scolaire, de cyberharcèlement ou d'exclusion.",
    whatIs: {
      title: "",
      description: "",
      details: [],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "orientation-professionnelle": {
    title: "Orientation professionnelle",
    subtitle: "Clarifier son projet et construire un parcours cohérent",
    description: "Grâce à une approche individualisée, cet accompagnement permet d'explorer ses centres d'intérêt, ses compétences, ses valeurs et ses aspirations afin de prendre des décisions éclairées concernant son orientation scolaire ou professionnelle.",
    whatIs: {
      title: "L'orientation, bien plus qu'un choix de formation",
      description: "L'orientation ne se limite pas au choix d'une formation ou d'un métier. Elle consiste à mieux comprendre son fonctionnement, ses compétences, ses motivations et ses aspirations afin de construire un projet cohérent, réaliste et durable. Professeure certifiée et spécialisée dans l'accompagnement des adolescents, étudiants et jeunes adultes, je vous accompagne dans cette réflexion grâce à une approche structurée associant connaissance du système éducatif, analyse du profil et méthodologie de décision.",
      details: [
        "Analyse du profil, des motivations et des centres d'intérêt",
        "Identification des compétences, ressources et points d'appui",
        "Exploration des métiers et des environnements professionnels adaptés",
        "Construction d'un projet d'orientation cohérent et individualisé",
        "Accompagnement Parcoursup et stratégie de candidature",
        "Valorisation du parcours, du CV et des candidatures",
        "Analyse des formations et des débouchés",
        "Prise de décision et sécurisation du projet",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "therapie": {
    title: "Retrouver un équilibre émotionnel durable",
    subtitle: "Comprendre son fonctionnement émotionnel pour mieux faire face au stress, aux changements et aux défis du quotidien.",
    description: "Une approche globale qui prend en compte les émotions, le fonctionnement cognitif et les stratégies d'adaptation.",
    whatIs: {
      title: "Qu'est-ce que l'accompagnement psycho-émotionnel ?",
      description: "Un accompagnement pour la gestion des émotions.",
      details: [
        "Techniques de régulation émotionnelle",
        "Gestion de l'anxiété",
        "Travail sur les traumatismes",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "regulation-emotionnelle": {
    title: "Régulation émotionnelle",
    subtitle: "Mieux comprendre ses émotions",
    description: "Les émotions jouent un rôle essentiel dans notre quotidien. Pourtant, lorsqu'elles deviennent envahissantes, difficiles à comprendre ou à réguler, elles peuvent avoir un impact important sur le bien-être, les relations personnelles, la vie familiale ou professionnelle.\n\nL'accompagnement proposé s'adresse aux adultes souhaitant mieux comprendre leur fonctionnement émotionnel, prendre du recul face aux situations difficiles et développer des stratégies concrètes pour retrouver davantage de sérénité au quotidien.",
    whatIs: {
      title: "",
      description: "",
      details: [],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "neuroeducation": {
    title: "Apprendre à apprendre grâce à la neuroéducation",
    subtitle: "Une approche scientifique au service des apprentissages",
    description: "Comprendre comment le cerveau apprend afin de développer des stratégies efficaces, adaptées à son fonctionnement et à ses objectifs.",
    whatIs: {
      title: "",
      description: "",
      details: [],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "strategie-apprentissage": {
    title: "Apprendre à apprendre",
    subtitle: "Comprendre son fonctionnement cognitif pour développer des méthodes d'apprentissage adaptées à son profil.",
    description: "Chaque accompagnement est personnalisé afin d'identifier les stratégies les plus efficaces pour améliorer la compréhension, la mémorisation, l'organisation et l'autonomie dans les apprentissages.",
    whatIs: {
      title: "Qu'est-ce que la stratégie d'apprentissage ?",
      description: "Des méthodes pour développer votre autonomie et améliorer vos performances.",
      details: [
        "Organisation du travail",
        "Mémorisation et concentration",
        "Gestion du temps",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
};

function AudienceLine() {
  return (
    <p
      className="mt-5 text-sm font-light tracking-wide text-[#5C5348]/80"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }}
    >
      {AUDIENCE_LINE}
    </p>
  );
}

// Composant FAQ avec accordéon
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#E6D9C6] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 text-left flex items-center justify-between"
        style={{ color: textColor }}
      >
        <span className="text-lg font-semibold pr-8">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
        ) : (
          <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
        )}
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="pb-6"
          style={{ color: `${textColor}80` }}
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}

export default function SpecialiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const content = specialitesContent[slug];

  if (!content) {
    notFound();
  }

  // Si c'est la page confiance-en-soi, utiliser le nouveau design
  if (slug === "confiance-en-soi") {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>

        {/* Hero Section */}
        <section className="relative">
          <div className="relative h-[70vh] min-h-[600px] w-full overflow-hidden">
            <JessicaRemoteImage
              src={content.heroImage || CONFIDANCE_HERO_IMAGE}
              alt={content.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center"
                >
                  <h1
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {SPECIALITY_SEO_CONFIG[slug]?.h1 || content.title}
                  </h1>
                  <p
                    className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {content.subtitle}
                  </p>
                  <p
                    className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {content.description}
                  </p>
                  <Button
                    size="lg"
                    className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                    style={{
                      backgroundColor: primaryColor,
                      color: '#FFFFFF',
                    }}
                    asChild
                  >
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                      Prendre rendez-vous
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Intro cards */}
        {content.whatIs.details.length > 0 && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid md:grid-cols-3 gap-6">
                {content.whatIs.details.map((detail, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-[#E6D9C6]"
                  >
                    <p style={{ color: textColor }}>{detail}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
        )}

        {/* Stats */}
        {content.stats && content.stats.length > 0 && (
        <section className="py-16 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {content.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl border border-[#E6D9C6] bg-white p-6 text-center shadow-lg"
                >
                  <p className="text-2xl font-bold md:text-3xl" style={{ color: primaryColor }}>
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: `${textColor}80` }}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* Pertinent si */}
        {content.forWho.length > 0 && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-2xl md:text-3xl font-bold mb-8 text-center"
              style={{ color: textColor }}
            >
              Cet accompagnement peut être pertinent si :
            </h2>
            <ul className="space-y-4">
              {content.forWho.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3 rounded-xl border border-[#E6D9C6] bg-white p-4 shadow-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                  <span style={{ color: textColor }}>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
        )}

        {/* Axes de l'accompagnement */}
        {content.benefits.length > 0 && (
        <section className="py-20 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-[#E6D9C6]"
                  >
                    <Icon className="h-10 w-10 mb-4" style={{ color: primaryColor }} />
                    <h3
                      className="text-xl font-bold mb-3"
                      style={{ color: textColor }}
                    >
                      {benefit.title}
                    </h3>
                    <p style={{ color: `${textColor}80` }}>
                      {benefit.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
        )}

        {/* Final CTA */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold mb-6"
                style={{ color: textColor }}
              >
                Prêt à renforcer votre confiance en vous ?
              </h2>
              <p
                className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
                style={{ color: `${textColor}80` }}
              >
                Contactez-moi pour un premier échange et définir ensemble un accompagnement adapté à vos besoins.
              </p>
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                }}
                asChild
              >
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  // Pour les autres spécialités, afficher un design simplifié
  const isConsultationHero = slug === "therapie" || slug === "strategie-apprentissage";
  const heroTitle =
    slug === "therapie" || slug === "strategie-apprentissage" || slug === "guidance-parentale"
      ? content.title
      : SPECIALITY_SEO_CONFIG[slug]?.h1 || content.title;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className={
                slug === "therapie"
                  ? "text-2xl md:text-3xl lg:text-[2.65rem] font-bold mb-6"
                  : "text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              }
              style={{ color: textColor }}
            >
              {heroTitle}
            </h1>
            <p
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              style={{ color: `${textColor}80` }}
            >
              {content.subtitle}
            </p>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
              style={{ color: `${textColor}80` }}
            >
              {content.description}
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
              style={{
                backgroundColor: primaryColor,
                color: '#FFFFFF',
              }}
              asChild
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                {isConsultationHero ? "Réserver une première consultation" : "Prendre rendez-vous"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            {isConsultationHero ? <AudienceLine /> : null}
          </motion.div>
        </div>
      </section>

      {/* What is Section */}
      {content.whatIs?.title && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold mb-6 text-center"
                style={{ color: textColor }}
              >
                {content.whatIs.title}
              </h2>
              <p
                className="text-lg md:text-xl mb-8 text-center max-w-4xl mx-auto leading-relaxed"
                style={{ color: `${textColor}80` }}
              >
                {content.whatIs.description}
              </p>
              {content.whatIs.details.length > 0 && (
                <div
                  className={`grid gap-6 mt-12 ${
                    content.whatIs.details.length > 4
                      ? "md:grid-cols-2"
                      : "md:grid-cols-3"
                  }`}
                >
                  {content.whatIs.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-[#E6D9C6]"
                    >
                      <p style={{ color: textColor }}>{detail}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Contenu SEO enrichi pour les spécialités principales */}
      {SPECIALITY_SEO_CONFIG[slug] && (
        <section className="py-16 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
          <div className="max-w-6xl mx-auto">
            {SPECIALITY_SEO_CONFIG[slug].contentSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="mb-12"
              >
                <Card className="border-[#E6D9C6] bg-white shadow-lg">
                  <CardContent className="p-8">
                    <h2
                      className="text-xl md:text-2xl font-bold text-[#2F2A25] mb-6"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      {section.title}
                    </h2>
                    <div
                      className="prose prose-lg max-w-none text-[#2F2A25] leading-relaxed"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                      dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {["guidance-parentale", "tnd", "harcelement", "neuroeducation", "regulation-emotionnelle"].includes(slug) && (
              <div className="text-center mt-8">
                <Button
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
                  style={{
                    backgroundColor: primaryColor,
                    color: "#FFFFFF",
                  }}
                  asChild
                >
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Prendre rendez-vous
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Liens internes stratégiques - Link Juice */}
      <StrategicInternalLinks currentPage={`specialites/${slug}`} title="Découvrez aussi" />

      {/* Final CTA */}
      <section className="py-20 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-2xl md:text-3xl font-bold mb-6"
              style={{ color: textColor }}
            >
              Prêt à commencer votre accompagnement ?
            </h2>
            <p
              className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: `${textColor}80` }}
            >
              Contactez-moi pour discuter de vos besoins et trouver ensemble la meilleure approche pour vous accompagner.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-semibold shadow-xl"
              style={{
                backgroundColor: primaryColor,
                color: '#FFFFFF',
              }}
              asChild
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Structured Data pour les spécialités */}
      <Script
        id={`structured-data-speciality-${slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": content.title,
            "provider": {
              "@type": "Person",
              "name": "Jessica CONTENTIN",
              "jobTitle": "Psychopédagogue certifiée en neuroéducation",
            },
            "description": content.description,
            "areaServed": {
              "@type": "City",
              "name": "Caen",
            },
            "availableChannel": {
              "@type": "ServiceChannel",
              "serviceUrl": `https://jessicacontentin.fr/specialites/${slug}`,
            },
          }),
        }}
      />
    </div>
  );
}
