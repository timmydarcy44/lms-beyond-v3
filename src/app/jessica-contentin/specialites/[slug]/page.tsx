"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Users, Clock, Target, Heart, TrendingUp, Award, Brain, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { env } from "@/lib/env";
import { StrategicInternalLinks } from "@/components/jessica-contentin/strategic-internal-links";
import { SPECIALITY_SEO_CONFIG } from "@/lib/seo/link-juice-strategy";
import Link from "next/link";
import Script from "next/script";
const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";

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
    title: "Gestion de la confiance en soi",
    subtitle: "Renforcez votre estime de vous et développez votre confiance personnelle",
    description: "La confiance en soi est un pilier essentiel de l'épanouissement personnel et professionnel. Mon accompagnement vous aide à identifier vos forces, surmonter vos doutes et développer une image positive de vous-même.",
    heroImage: getSupabaseStorageUrl(BUCKET_NAME, "Confiance_en_soi.jpg") || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80",
    whatIs: {
      title: "Qu'est-ce que l'accompagnement en gestion de la confiance en soi ?",
      description: "Au cours de cet accompagnement personnalisé de six mois, vous et votre famille recevrez un suivi psychopédagogique approfondi dans chacune des six compétences fondamentales de la confiance en soi. Chaque mois, je vous accompagnerai dans l'exploration de ces six domaines clés : la maîtrise émotionnelle, l'identification et la valorisation de vos forces, le développement de l'assertivité, l'amélioration de votre image de soi, la gestion des pensées limitantes et la consolidation de votre autonomie.",
      details: [
        "L'accompagnement est facilité par une psychopédagogue certifiée en neuroéducation, ayant suivi une formation intensive pour être certifiée comme accompagnatrice.",
        "Vous pouvez choisir de recevoir l'accompagnement en présentiel dans mon cabinet ou en ligne, selon votre convenance.",
        "En tant que participant, vous serez équipé des outils nécessaires pour mettre en pratique les enseignements et maximiser votre investissement grâce à six mois de suivi personnalisé.",
      ],
    },
    programBreakdown: [
      {
        month: 1,
        title: "Maîtrisez vos émotions",
        description: "La maîtrise de vos émotions est la clé pour être un leader efficace dans votre propre vie. Au cours du premier mois, vous apprendrez trois étapes essentielles à la maîtrise émotionnelle et pourquoi cela compte.",
        icon: Heart,
      },
      {
        month: 2,
        title: "Identifiez et valorisez vos forces",
        description: "Découvrez ce qu'il faut pour créer une image positive de vous-même au cours du deuxième mois, avec une évaluation approfondie de votre personnalité pour améliorer votre connaissance de soi.",
        icon: Award,
      },
      {
        month: 3,
        title: "Développez votre assertivité",
        description: "Une fois votre état d'esprit établi, je vous aiderai à développer votre capacité à exprimer vos besoins et à défendre vos opinions de manière respectueuse et efficace au cours du troisième mois.",
        icon: TrendingUp,
      },
      {
        month: 4,
        title: "Améliorez votre image de soi",
        description: "La méthode d'amélioration de l'image de soi modifie entièrement votre approche de la façon dont vous vous percevez. Au cours du quatrième mois, vous découvrirez le pouvoir d'une image de soi positive.",
        icon: Sparkles,
      },
      {
        month: 5,
        title: "Gérez vos pensées limitantes",
        description: "Développer et transformer vos pensées limitantes est essentiel pour libérer votre potentiel. Identifiez votre processus de pensée pour éliminer les blocages internes au cours du cinquième mois.",
        icon: Brain,
      },
      {
        month: 6,
        title: "Consolidez votre autonomie",
        description: "La résolution des conflits internes, les compétences en communication et l'autonomisation de vous-même sont tous inclus dans les 7 étapes maîtresses pour une confiance en soi durable.",
        icon: Target,
      },
    ],
    testimonials: [
      {
        quote: "Cette année, j'ai constaté une augmentation de 18% de ma confiance en moi - cela en valait vraiment la peine ! Le processus consiste à briser nos murs intérieurs et à changer notre culture personnelle - je suis absolument ravi des résultats.",
        author: "Marie D.",
        role: "Étudiante en reconversion",
      },
      {
        quote: "C'était l'un des meilleurs jours de ma vie... l'énergie était incroyable ! Ma confiance en moi a augmenté de 21%... ils dépassent les attentes à chaque fois.",
        author: "Thomas L.",
        role: "Professionnel en évolution",
      },
      {
        quote: "L'accompagnement en gestion de la confiance en soi a donné à mon enfant, à ma famille et à moi-même une façon unifiée d'avancer vers un objectif de regarder la vie de manière plus saine. Apprendre des choses qui aident non seulement dans la vie professionnelle, mais aussi dans la vie familiale. Cette partie a été vraiment gratifiante.",
        author: "Sophie M.",
        role: "Mère de famille",
      },
      {
        quote: "J'étais en colère contre moi-même de ne pas avoir fait cela plus tôt... avoir un accompagnement pour traverser ma propre prise de décision, mes compétences, ma psychologie... a été inestimable.",
        author: "Pierre R.",
        role: "Entrepreneur",
      },
    ],
    benefits: [
      {
        title: "Augmentez votre confiance en vous",
        description: "Transformez l'état d'esprit de votre équipe et donnez-lui les outils nécessaires pour créer une croissance massive dans votre estime de vous-même.",
        icon: TrendingUp,
      },
      {
        title: "Améliorez votre image de vous",
        description: "Construisez une culture personnelle qui favorise la responsabilisation, la camaraderie et le travail d'équipe - et crée des fans enthousiastes de vous-même.",
        icon: Heart,
      },
      {
        title: "Maximisez votre productivité",
        description: "Supprimez les obstacles, mettez en place des systèmes efficaces et obtenez le meilleur de vous-même pour augmenter considérablement la productivité et la qualité de votre vie.",
        icon: Target,
      },
      {
        title: "Maîtrisez les compétences d'influence",
        description: "Développez votre capacité à influencer positivement votre environnement et à créer des changements durables dans votre vie.",
        icon: Award,
      },
      {
        title: "Unissez-vous en tant qu'équipe",
        description: "Renforcez les liens familiaux et professionnels en développant une confiance mutuelle et une communication efficace.",
        icon: Users,
      },
      {
        title: "Passez au niveau supérieur",
        description: "Prenez votre vie personnelle et professionnelle au niveau supérieur en libérant votre plein potentiel.",
        icon: Sparkles,
      },
    ],
    faqs: [
      {
        question: "Comment l'accompagnement de Jessica Contentin m'aidera-t-il à atteindre mes objectifs de confiance en soi ?",
        answer: "Mon accompagnement vous fournit des outils concrets et des stratégies personnalisées pour développer votre confiance en vous. Grâce à un suivi régulier sur six mois, vous apprendrez à identifier vos forces, gérer vos émotions et développer une image positive de vous-même. Chaque séance est adaptée à vos besoins spécifiques pour garantir des résultats durables.",
      },
      {
        question: "Comment l'accompagnement en gestion de la confiance en soi m'aidera-t-il à améliorer ma culture personnelle ?",
        answer: "L'accompagnement se concentre sur la transformation de votre état d'esprit et de vos croyances limitantes. En travaillant sur votre image de soi, votre assertivité et votre autonomie, vous développez une culture personnelle plus positive et constructive. Cela se reflète dans tous les aspects de votre vie, créant un cercle vertueux de confiance et de réussite.",
      },
      {
        question: "En quoi l'accompagnement en gestion de la confiance en soi est-il différent des autres programmes de développement personnel ?",
        answer: "Mon approche est basée sur la neuroéducation et la psychopédagogie, combinant une compréhension scientifique du fonctionnement du cerveau avec des techniques pratiques et personnalisées. Contrairement aux programmes génériques, chaque accompagnement est adapté à votre profil unique, avec un suivi régulier et des ajustements en fonction de vos progrès. L'accent est mis sur la durabilité et l'autonomie à long terme.",
      },
      {
        question: "Comment l'accompagnement en gestion de la confiance en soi m'aidera-t-il à mieux gérer mon temps ?",
        answer: "En développant votre confiance en vous, vous apprenez à mieux prioriser vos activités, à dire non quand c'est nécessaire et à prendre des décisions plus rapidement. L'amélioration de votre image de soi et de votre assertivité vous permet également de mieux gérer votre temps en étant plus efficace dans vos interactions et en évitant les situations qui drainent votre énergie.",
      },
    ],
    forWho: [
      "Enfants et adolescents en manque de confiance",
      "Adultes souhaitant développer leur assertivité",
      "Personnes confrontées à des situations de doute ou d'incertitude",
      "Étudiants préparant des examens ou concours",
      "Professionnels en reconversion ou en recherche d'évolution",
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
    title: "Accompagnement TND",
    subtitle: "Accompagnement spécialisé pour les troubles du neurodéveloppement",
    description: "Un accompagnement adapté aux besoins spécifiques des enfants et adolescents présentant des troubles DYS ou TDA-H.",
    whatIs: {
      title: "Qu'est-ce que l'accompagnement TND ?",
      description: "Un accompagnement spécialisé pour les troubles du neurodéveloppement (DYS, TDA-H).",
      details: [
        "Stratégies d'apprentissage personnalisées",
        "Soutien à l'inclusion scolaire",
        "Collaboration avec les équipes éducatives",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "guidance-parentale": {
    title: "Guidance parentale",
    subtitle: "Soutien et conseils pour les parents dans leur rôle éducatif",
    description: "Un espace d'écoute et de conseils pour vous accompagner dans votre rôle de parent.",
    whatIs: {
      title: "Qu'est-ce que la guidance parentale ?",
      description: "Un accompagnement pour vous aider dans votre rôle de parent.",
      details: [
        "Stratégies éducatives adaptées",
        "Gestion des conflits familiaux",
        "Renforcement du lien parent-enfant",
      ],
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
    title: "Harcèlement Scolaire",
    subtitle: "Accompagnement et soutien face au harcèlement scolaire",
    description: "Un accompagnement bienveillant et sécurisant pour les enfants et adolescents confrontés au harcèlement.",
    whatIs: {
      title: "Qu'est-ce que l'accompagnement face au harcèlement scolaire ?",
      description: "Un accompagnement pour aider les enfants et adolescents confrontés au harcèlement.",
      details: [
        "Écoute et soutien psychologique",
        "Stratégies de protection",
        "Collaboration avec l'école et la famille",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "orientation-professionnelle": {
    title: "Orientation professionnelle",
    subtitle: "Accompagnement personnalisé pour révéler votre potentiel et faire les bons choix",
    description: "Un accompagnement complet pour vous aider à identifier vos aspirations, vos compétences et à construire un projet d'orientation professionnelle épanouissant. Mon expertise en tant que professeure certifiée et ma connaissance approfondie du système éducatif français me permettent de vous guider dans cette étape cruciale de votre parcours.",
    whatIs: {
      title: "Qu'est-ce que l'orientation professionnelle ?",
      description: "L'orientation professionnelle est un accompagnement personnalisé qui vous aide à faire les bons choix pour votre avenir. En tant que professeure certifiée, j'ai développé une solide expérience dans l'accompagnement des jeunes dans le choix de leur orientation, notamment pour l'orientation post-bac et la plateforme Parcoursup. Mon approche combine une écoute attentive, une analyse approfondie de votre profil et une méthodologie structurée pour vous guider vers des choix éclairés et épanouissants.",
      details: [
        "Premier rendez-vous pour comprendre vos questionnements et vos aspirations",
        "Test des soft skills pour identifier vos forces et vos talents naturels",
        "Travail sur les perspectives métiers en lien avec votre profil",
        "Rédaction d'un projet d'orientation structuré et personnalisé",
        "Mise en place de Parcoursup avec stratégie d'inscription optimisée",
        "Travail sur la lettre de motivation et le CV pour valoriser vos compétences",
        "Exploration des métiers et formations",
        "Aide à la décision",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "therapie": {
    title: "Thérapie psycho-émotionnelle",
    subtitle: "Accompagnement thérapeutique pour la gestion des émotions",
    description: "Un accompagnement thérapeutique pour mieux comprendre et gérer vos émotions.",
    whatIs: {
      title: "Qu'est-ce que la thérapie psycho-émotionnelle ?",
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
  "neuroeducation": {
    title: "Neuroéducation",
    subtitle: "Approche basée sur les neurosciences pour optimiser les apprentissages",
    description: "Une approche innovante qui s'appuie sur les dernières découvertes en neurosciences.",
    whatIs: {
      title: "Qu'est-ce que la neuroéducation ?",
      description: "Une approche basée sur les neurosciences pour optimiser les apprentissages.",
      details: [
        "Compréhension du fonctionnement du cerveau",
        "Stratégies d'apprentissage efficaces",
        "Approche adaptée à chacun",
      ],
    },
    programBreakdown: [],
    testimonials: [],
    benefits: [],
    faqs: [],
    forWho: [],
  },
  "strategie-apprentissage": {
    title: "Stratégie d'apprentissage",
    subtitle: "Développement de méthodes et techniques d'apprentissage personnalisées",
    description: "Des méthodes et techniques d'apprentissage adaptées à votre profil et à vos besoins.",
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
            <Image
              src={content.heroImage || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80"}
              alt={content.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
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
                    className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
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
                      Commencer maintenant
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* What is Section */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-4xl md:text-5xl font-bold mb-6 text-center"
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
              <div className="grid md:grid-cols-3 gap-6 mt-12">
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

        {/* Testimonials Section */}
        <section className="py-20 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-12 text-center"
              style={{ color: textColor }}
            >
              Témoignages
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {content.testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-[#E6D9C6]"
                >
                  <blockquote className="text-lg mb-6" style={{ color: textColor }}>
                    "{testimonial.quote}"
                  </blockquote>
                  <div>
                    <p className="font-semibold" style={{ color: primaryColor }}>
                      {testimonial.author}
                    </p>
                    <p className="text-sm" style={{ color: `${textColor}60` }}>
                      {testimonial.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Program Breakdown */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-center"
              style={{ color: textColor }}
            >
              Déroulement du programme
            </h2>
            <p
              className="text-lg md:text-xl mb-12 text-center max-w-3xl mx-auto"
              style={{ color: `${textColor}80` }}
            >
              Au cours de six mois, vous et votre famille vous concentrerez sur ces six domaines qui feront décoller votre productivité, vos performances et votre croissance :
            </p>
            <div className="space-y-6">
              {content.programBreakdown.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-[#E6D9C6]"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${primaryColor}20` }}
                        >
                          <Icon className="h-8 w-8" style={{ color: primaryColor }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span
                            className="text-2xl font-bold"
                            style={{ color: primaryColor }}
                          >
                            Mois {item.month}
                          </span>
                          <h3
                            className="text-2xl font-bold"
                            style={{ color: textColor }}
                          >
                            {item.title}
                          </h3>
                        </div>
                        <p
                          className="text-lg leading-relaxed"
                          style={{ color: `${textColor}80` }}
                        >
                          {item.description}
                        </p>
                        <div className="mt-4">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: accentColor }}
                          >
                            * Séance de coaching incluse *
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 md:px-8" style={{ backgroundColor: surfaceColor }}>
          <div className="max-w-6xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 text-center"
              style={{ color: textColor }}
            >
              Comment allez-vous développer votre confiance en vous cette année ?
            </h2>
            <p
              className="text-lg md:text-xl mb-12 text-center max-w-3xl mx-auto"
              style={{ color: `${textColor}80` }}
            >
              La qualité de votre vie est directement proportionnelle à la qualité de votre confiance en vous. Lorsque votre confiance est élevée, vous vous sentez incroyable. Lorsque votre confiance souffre, vous aussi.
            </p>
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

        {/* FAQs Section */}
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-4xl md:text-5xl font-bold mb-12 text-center"
              style={{ color: textColor }}
            >
              Questions fréquemment posées
            </h2>
            <div className="bg-white rounded-2xl shadow-lg border border-[#E6D9C6] overflow-hidden">
              {content.faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </section>

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
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ color: textColor }}
              >
                Prêt à développer votre confiance en vous ?
              </h2>
              <p
                className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
                style={{ color: `${textColor}80` }}
              >
                Planifiez votre consultation gratuite de 30 minutes avec Jessica Contentin dès aujourd'hui pour en savoir plus sur toutes les façons dont nous pouvons vous aider à atteindre une croissance géométrique et une équipe plus heureuse et plus productive.
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
                  Planifier mon appel
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
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{ color: textColor }}
            >
              {SPECIALITY_SEO_CONFIG[slug]?.h1 || content.title}
            </h1>
            <p
              className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
              style={{ color: `${textColor}80` }}
            >
              {content.subtitle}
            </p>
            <p
              className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
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
                Prendre rendez-vous
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What is Section */}
      {content.whatIs && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-4xl md:text-5xl font-bold mb-6 text-center"
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
                <div className="grid md:grid-cols-3 gap-6 mt-12">
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
                      className="text-3xl font-bold text-[#2F2A25] mb-6"
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
              className="text-4xl md:text-5xl font-bold mb-6"
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
                Planifier mon appel
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
