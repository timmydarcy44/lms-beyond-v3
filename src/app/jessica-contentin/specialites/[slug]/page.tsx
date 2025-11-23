"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Users, Clock, Target, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialitesContent: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  objectives: string[];
  methods: string[];
  forWho: string[];
  process: { step: number; title: string; description: string }[];
  duration?: string;
}> = {
  "confiance-en-soi": {
    title: "Gestion de la confiance en soi",
    subtitle: "Renforcez votre estime de vous et développez votre confiance personnelle",
    description: "La confiance en soi est un pilier essentiel de l'épanouissement personnel et professionnel. Mon accompagnement vous aide à identifier vos forces, surmonter vos doutes et développer une image positive de vous-même.",
    objectives: [
      "Identifier et valoriser vos forces et talents personnels",
      "Développer une image positive de vous-même",
      "Surmonter les pensées négatives et les doutes",
      "Renforcer votre assertivité et votre capacité à exprimer vos besoins",
      "Valoriser vos réussites et reconnaître vos progrès",
      "Développer votre autonomie et votre capacité à prendre des décisions",
    ],
    methods: [
      "Techniques de restructuration cognitive",
      "Exercices de valorisation et d'auto-observation",
      "Jeux de rôle pour développer l'assertivité",
      "Travail sur l'identification des forces",
      "Stratégies de gestion des pensées limitantes",
      "Mise en place d'objectifs progressifs et réalisables",
    ],
    forWho: [
      "Enfants et adolescents en manque de confiance",
      "Adultes souhaitant développer leur assertivité",
      "Personnes confrontées à des situations de doute ou d'incertitude",
      "Étudiants préparant des examens ou concours",
      "Professionnels en reconversion ou en recherche d'évolution",
    ],
    process: [
      {
        step: 1,
        title: "Premier entretien",
        description: "Évaluation de votre situation actuelle, identification des besoins et définition des objectifs personnalisés.",
      },
      {
        step: 2,
        title: "Bilan approfondi",
        description: "Identification de vos forces, talents et axes d'amélioration à travers différents outils d'évaluation.",
      },
      {
        step: 3,
        title: "Accompagnement personnalisé",
        description: "Séances régulières avec des exercices pratiques, des techniques concrètes et un suivi de vos progrès.",
      },
      {
        step: 4,
        title: "Consolidation",
        description: "Renforcement des acquis et développement de votre autonomie pour maintenir votre confiance sur le long terme.",
      },
    ],
  },
  "gestion-stress": {
    title: "Gestion du stress",
    subtitle: "Apprenez à gérer votre stress et retrouvez sérénité et équilibre",
    description: "Le stress fait partie de la vie, mais lorsqu'il devient chronique, il peut impacter votre bien-être, vos performances et votre santé. Je vous accompagne pour identifier les sources de votre stress et développer des outils concrets pour y faire face efficacement.",
    objectives: [
      "Identifier les sources et les signes de votre stress",
      "Comprendre les mécanismes du stress et ses impacts",
      "Développer des techniques de relaxation et de respiration",
      "Apprendre à gérer votre temps et vos priorités",
      "Mettre en place des stratégies d'adaptation (coping)",
      "Prévenir le burn-out et l'épuisement",
    ],
    methods: [
      "Techniques de relaxation (respiration, méditation, visualisation)",
      "Gestion du temps et des priorités",
      "Restructuration cognitive des situations stressantes",
      "Exercices de pleine conscience",
      "Stratégies de prévention et d'anticipation",
      "Travail sur l'équilibre vie personnelle / professionnelle",
    ],
    forWho: [
      "Étudiants confrontés au stress des examens",
      "Professionnels sous pression",
      "Parents en situation de surcharge",
      "Personnes anxieuses ou sujettes au stress chronique",
      "Toute personne souhaitant mieux gérer son stress au quotidien",
    ],
    process: [
      {
        step: 1,
        title: "Évaluation initiale",
        description: "Identification des sources de stress, évaluation de leur intensité et de leurs impacts sur votre vie quotidienne.",
      },
      {
        step: 2,
        title: "Apprentissage des techniques",
        description: "Découverte et pratique de différentes techniques de gestion du stress adaptées à votre profil.",
      },
      {
        step: 3,
        title: "Mise en pratique",
        description: "Application concrète des techniques dans votre quotidien avec un suivi régulier et des ajustements si nécessaire.",
      },
      {
        step: 4,
        title: "Autonomie",
        description: "Développement de votre autonomie pour gérer le stress de manière indépendante et durable.",
      },
    ],
  },
  "tnd": {
    title: "Accompagnement TND",
    subtitle: "Un accompagnement spécialisé pour les troubles du neurodéveloppement",
    description: "Les troubles du neurodéveloppement (DYS, TDA-H) nécessitent un accompagnement adapté et bienveillant. Mon approche s'appuie sur une compréhension approfondie de ces troubles pour proposer des stratégies d'apprentissage personnalisées et favoriser l'inclusion scolaire.",
    objectives: [
      "Réaliser un bilan approfondi des besoins spécifiques",
      "Développer des stratégies d'apprentissage adaptées",
      "Favoriser l'inclusion scolaire et sociale",
      "Soutenir les familles dans leur compréhension et leur accompagnement",
      "Collaborer avec les équipes éducatives",
      "Renforcer l'estime de soi et l'autonomie",
    ],
    methods: [
      "Bilans psychopédagogiques spécialisés",
      "Stratégies d'apprentissage multi-sensorielles",
      "Adaptations pédagogiques personnalisées",
      "Travail sur les fonctions exécutives",
      "Soutien à la mémorisation et à la compréhension",
      "Collaboration avec les professionnels (orthophonistes, ergothérapeutes, etc.)",
    ],
    forWho: [
      "Enfants et adolescents présentant des troubles DYS (dyslexie, dyspraxie, dyscalculie, etc.)",
      "Jeunes avec un TDA-H (Trouble du Déficit de l'Attention avec ou sans Hyperactivité)",
      "Familles cherchant à mieux comprendre et accompagner leur enfant",
      "Équipes éducatives souhaitant des conseils pour l'inclusion",
    ],
    process: [
      {
        step: 1,
        title: "Bilan initial",
        description: "Évaluation complète des compétences, des difficultés et des besoins spécifiques de l'enfant ou de l'adolescent.",
      },
      {
        step: 2,
        title: "Élaboration du projet",
        description: "Création d'un projet d'accompagnement personnalisé avec des objectifs adaptés et des stratégies concrètes.",
      },
      {
        step: 3,
        title: "Accompagnement régulier",
        description: "Séances individuelles ou en petit groupe pour mettre en place les stratégies et suivre les progrès.",
      },
      {
        step: 4,
        title: "Collaboration et suivi",
        description: "Travail en collaboration avec la famille et les équipes éducatives pour assurer une cohérence dans l'accompagnement.",
      },
    ],
  },
  "guidance-parentale": {
    title: "Guidance parentale",
    subtitle: "Un soutien bienveillant pour votre rôle de parent",
    description: "Être parent est une aventure merveilleuse mais parfois complexe. La guidance parentale vous offre un espace d'écoute, de conseils et de soutien pour vous accompagner dans votre rôle éducatif et créer un environnement familial épanouissant.",
    objectives: [
      "Comprendre les besoins de votre enfant à chaque étape de son développement",
      "Développer des stratégies éducatives adaptées et bienveillantes",
      "Gérer les conflits familiaux de manière constructive",
      "Soutenir votre enfant dans ses difficultés scolaires ou comportementales",
      "Renforcer le lien parent-enfant",
      "Retrouver confiance et sérénité dans votre rôle de parent",
    ],
    methods: [
      "Écoute active et bienveillante",
      "Conseils personnalisés adaptés à votre situation",
      "Stratégies éducatives basées sur la communication positive",
      "Gestion des émotions (les vôtres et celles de votre enfant)",
      "Mise en place de routines et de règles adaptées",
      "Soutien dans la gestion des difficultés spécifiques",
    ],
    forWho: [
      "Parents d'enfants ou d'adolescents",
      "Familles confrontées à des difficultés éducatives",
      "Parents d'enfants avec des besoins spécifiques",
      "Familles en situation de séparation ou de recomposition",
      "Tout parent souhaitant être accompagné dans son rôle",
    ],
    process: [
      {
        step: 1,
        title: "Premier entretien",
        description: "Écoute de votre situation, identification des difficultés rencontrées et définition de vos besoins et objectifs.",
      },
      {
        step: 2,
        title: "Analyse de la situation",
        description: "Compréhension approfondie de la dynamique familiale et des enjeux spécifiques à votre famille.",
      },
      {
        step: 3,
        title: "Accompagnement personnalisé",
        description: "Séances régulières avec des conseils concrets, des stratégies à mettre en place et un suivi de l'évolution.",
      },
      {
        step: 4,
        title: "Autonomie",
        description: "Développement de votre autonomie dans la gestion des situations familiales avec un soutien ponctuel si nécessaire.",
      },
    ],
  },
  "tests": {
    title: "Tests de connaissance de soi",
    subtitle: "Mieux vous connaître pour mieux vous orienter",
    description: "Les tests et bilans psychopédagogiques sont des outils précieux pour mieux vous connaître, identifier vos compétences, vos forces et vos axes d'amélioration. Ils permettent d'orienter votre parcours et de développer votre potentiel de manière ciblée.",
    objectives: [
      "Réaliser un bilan complet de vos compétences",
      "Identifier vos forces et vos talents",
      "Comprendre votre mode de fonctionnement",
      "Déterminer vos axes d'amélioration",
      "Recevoir des recommandations personnalisées",
      "Orient votre parcours scolaire ou professionnel",
    ],
    methods: [
      "Bilans psychopédagogiques standardisés",
      "Tests de personnalité adaptés",
      "Évaluations des compétences cognitives",
      "Analyse des intérêts et des motivations",
      "Questionnaires d'auto-évaluation",
      "Entretiens approfondis",
    ],
    forWho: [
      "Élèves et étudiants en questionnement sur leur orientation",
      "Adultes en reconversion professionnelle",
      "Personnes souhaitant mieux se connaître",
      "Étudiants préparant des concours ou examens",
      "Toute personne désireuse d'identifier son potentiel",
    ],
    process: [
      {
        step: 1,
        title: "Entretien préliminaire",
        description: "Définition de vos besoins, de vos attentes et choix des outils d'évaluation les plus adaptés.",
      },
      {
        step: 2,
        title: "Passation des tests",
        description: "Réalisation des différents tests et questionnaires dans un cadre bienveillant et sécurisant.",
      },
      {
        step: 3,
        title: "Analyse et synthèse",
        description: "Analyse approfondie des résultats et élaboration d'une synthèse personnalisée.",
      },
      {
        step: 4,
        title: "Restitution et recommandations",
        description: "Présentation détaillée des résultats, des recommandations et accompagnement dans la suite de votre parcours.",
      },
    ],
    duration: "Le bilan complet se déroule généralement sur 2 à 3 séances.",
  },
  "harcelement": {
    title: "Harcèlement Scolaire",
    subtitle: "Un accompagnement bienveillant face au harcèlement",
    description: "Le harcèlement scolaire est une réalité malheureusement trop fréquente qui peut avoir des conséquences graves sur le bien-être et le développement des enfants et adolescents. Mon accompagnement offre un espace sécurisant pour être écouté, compris et soutenu.",
    objectives: [
      "Offrir un espace d'écoute et de soutien psychologique",
      "Aider à comprendre et à exprimer les émotions vécues",
      "Développer des stratégies de protection et de défense",
      "Renforcer la confiance en soi et l'estime de soi",
      "Collaborer avec l'école pour mettre fin au harcèlement",
      "Soutenir les familles dans cette épreuve",
    ],
    methods: [
      "Écoute bienveillante et non-jugeante",
      "Travail sur l'expression des émotions",
      "Techniques de renforcement de la confiance en soi",
      "Stratégies de protection et de communication",
      "Collaboration avec les équipes éducatives",
      "Soutien aux familles et guidance parentale",
    ],
    forWho: [
      "Enfants et adolescents victimes de harcèlement scolaire",
      "Familles confrontées à cette situation",
      "Jeunes témoins de harcèlement",
      "Équipes éducatives cherchant des conseils",
    ],
    process: [
      {
        step: 1,
        title: "Premier entretien",
        description: "Création d'un espace sécurisant pour que l'enfant ou l'adolescent puisse s'exprimer librement sur ce qu'il vit.",
      },
      {
        step: 2,
        title: "Évaluation de la situation",
        description: "Compréhension approfondie de la situation, identification des besoins et élaboration d'un plan d'action.",
      },
      {
        step: 3,
        title: "Accompagnement et soutien",
        description: "Séances régulières pour travailler sur la confiance en soi, les stratégies de protection et le bien-être.",
      },
      {
        step: 4,
        title: "Collaboration et suivi",
        description: "Travail en collaboration avec l'école et la famille pour mettre fin au harcèlement et assurer un suivi.",
      },
    ],
  },
  "orientation": {
    title: "Orientation scolaire",
    subtitle: "Construisez votre projet d'avenir avec confiance",
    description: "Choisir son orientation scolaire ou professionnelle est une étape importante qui peut être source de questionnements et d'incertitudes. Mon accompagnement vous aide à identifier vos intérêts, vos compétences et vos aspirations pour construire un projet d'avenir qui vous correspond.",
    objectives: [
      "Réaliser un bilan d'orientation personnalisé",
      "Identifier vos intérêts, compétences et valeurs",
      "Explorer les métiers et formations possibles",
      "Clarifier vos aspirations et vos projets",
      "Aider à la prise de décision",
      "Accompagner dans les démarches d'orientation",
    ],
    methods: [
      "Bilans d'orientation standardisés",
      "Questionnaires d'intérêts professionnels",
      "Entretiens approfondis",
      "Exploration des métiers et des formations",
      "Recherche documentaire guidée",
      "Aide à la construction du projet",
    ],
    forWho: [
      "Collégiens et lycéens en questionnement sur leur orientation",
      "Étudiants souhaitant se réorienter",
      "Adultes en reconversion professionnelle",
      "Jeunes en décrochage scolaire",
      "Toute personne en questionnement sur son avenir",
    ],
    process: [
      {
        step: 1,
        title: "Premier entretien",
        description: "Écoute de votre situation, de vos questionnements et définition de vos besoins en matière d'orientation.",
      },
      {
        step: 2,
        title: "Bilan d'orientation",
        description: "Réalisation de différents tests et questionnaires pour identifier vos intérêts, compétences et valeurs.",
      },
      {
        step: 3,
        title: "Exploration",
        description: "Découverte des métiers et formations correspondant à votre profil, recherche documentaire et rencontres si possible.",
      },
      {
        step: 4,
        title: "Construction du projet",
        description: "Élaboration de votre projet d'orientation, aide à la décision et accompagnement dans les démarches.",
      },
    ],
  },
  "therapie": {
    title: "Thérapie psycho-émotionnelle",
    subtitle: "Apprenez à comprendre et gérer vos émotions",
    description: "Les émotions sont au cœur de notre vie. Comprendre et gérer ses émotions est essentiel pour notre bien-être et notre épanouissement. Mon accompagnement thérapeutique vous aide à mieux comprendre vos émotions, à les réguler et à développer votre résilience émotionnelle.",
    objectives: [
      "Identifier et comprendre vos émotions",
      "Développer votre intelligence émotionnelle",
      "Apprendre à réguler vos émotions",
      "Gérer l'anxiété, les peurs et les angoisses",
      "Travailler sur les traumatismes et les blessures émotionnelles",
      "Développer votre résilience et votre capacité d'adaptation",
    ],
    methods: [
      "Thérapie par la parole et l'écoute",
      "Techniques de régulation émotionnelle",
      "Exercices de pleine conscience",
      "Travail sur les schémas de pensée",
      "Techniques de gestion de l'anxiété",
      "Approche intégrative adaptée à chaque personne",
    ],
    forWho: [
      "Personnes confrontées à des difficultés émotionnelles",
      "Enfants et adolescents en souffrance émotionnelle",
      "Adultes en situation d'anxiété ou de stress chronique",
      "Personnes ayant vécu des traumatismes",
      "Toute personne souhaitant mieux comprendre et gérer ses émotions",
    ],
    process: [
      {
        step: 1,
        title: "Premier entretien",
        description: "Écoute de votre situation, évaluation de vos besoins et définition des objectifs thérapeutiques.",
      },
      {
        step: 2,
        title: "Évaluation approfondie",
        description: "Compréhension de votre fonctionnement émotionnel, identification des difficultés et des ressources.",
      },
      {
        step: 3,
        title: "Travail thérapeutique",
        description: "Séances régulières avec des techniques adaptées, un travail sur les émotions et un suivi de l'évolution.",
      },
      {
        step: 4,
        title: "Consolidation",
        description: "Renforcement des acquis, développement de votre autonomie et préparation à la fin de l'accompagnement.",
      },
    ],
  },
  "neuroeducation": {
    title: "Neuroéducation",
    subtitle: "Optimisez vos apprentissages grâce aux neurosciences",
    description: "La neuroéducation est une approche innovante qui s'appuie sur les dernières découvertes en neurosciences pour optimiser les processus d'apprentissage. Comprendre comment fonctionne le cerveau permet de développer des stratégies d'apprentissage plus efficaces et adaptées à chacun.",
    objectives: [
      "Comprendre le fonctionnement du cerveau dans l'apprentissage",
      "Identifier votre profil d'apprentissage",
      "Développer des stratégies basées sur les neurosciences",
      "Optimiser la mémoire et la rétention des informations",
      "Améliorer la concentration et l'attention",
      "Développer vos compétences métacognitives",
    ],
    methods: [
      "Enseignement des bases de la neuroéducation",
      "Identification du profil d'apprentissage",
      "Stratégies d'apprentissage multi-sensorielles",
      "Techniques de mémorisation basées sur les neurosciences",
      "Exercices de renforcement de l'attention",
      "Développement de la métacognition (apprendre à apprendre)",
    ],
    forWho: [
      "Élèves et étudiants souhaitant optimiser leurs apprentissages",
      "Personnes en formation continue",
      "Enseignants et formateurs",
      "Toute personne curieuse de comprendre comment fonctionne l'apprentissage",
      "Étudiants préparant des examens ou concours",
    ],
    process: [
      {
        step: 1,
        title: "Évaluation initiale",
        description: "Identification de votre profil d'apprentissage, de vos forces et de vos difficultés.",
      },
      {
        step: 2,
        title: "Découverte de la neuroéducation",
        description: "Apprentissage des bases du fonctionnement du cerveau dans l'apprentissage.",
      },
      {
        step: 3,
        title: "Mise en pratique",
        description: "Application concrète des stratégies d'apprentissage adaptées à votre profil.",
      },
      {
        step: 4,
        title: "Autonomie",
        description: "Développement de votre autonomie dans l'utilisation des stratégies apprises.",
      },
    ],
  },
  "strategie-apprentissage": {
    title: "Stratégie d'apprentissage",
    subtitle: "Développez des méthodes d'apprentissage efficaces et personnalisées",
    description: "Chacun apprend différemment. Développer des stratégies d'apprentissage adaptées à votre profil est essentiel pour améliorer vos performances et votre autonomie. Mon accompagnement vous aide à découvrir et à mettre en place des méthodes d'apprentissage efficaces.",
    objectives: [
      "Identifier votre style d'apprentissage",
      "Développer des méthodes d'organisation du travail",
      "Améliorer vos techniques de mémorisation",
      "Renforcer votre concentration et votre attention",
      "Développer votre autonomie dans les apprentissages",
      "Améliorer vos performances scolaires ou professionnelles",
    ],
    methods: [
      "Évaluation du style d'apprentissage",
      "Techniques d'organisation et de gestion du temps",
      "Stratégies de mémorisation variées",
      "Exercices de concentration et d'attention",
      "Méthodes de prise de notes efficaces",
      "Techniques de révision et de préparation aux examens",
    ],
    forWho: [
      "Élèves et étudiants en difficulté scolaire",
      "Étudiants souhaitant améliorer leurs méthodes de travail",
      "Personnes en formation continue",
      "Étudiants préparant des examens ou concours",
      "Toute personne souhaitant optimiser ses apprentissages",
    ],
    process: [
      {
        step: 1,
        title: "Bilan initial",
        description: "Évaluation de vos méthodes actuelles, identification de vos difficultés et de vos besoins.",
      },
      {
        step: 2,
        title: "Découverte des stratégies",
        description: "Apprentissage de différentes stratégies d'apprentissage adaptées à votre profil.",
      },
      {
        step: 3,
        title: "Mise en pratique",
        description: "Application concrète des stratégies dans votre travail quotidien avec un suivi régulier.",
      },
      {
        step: 4,
        title: "Autonomie",
        description: "Développement de votre autonomie dans l'utilisation des stratégies apprises.",
      },
    ],
  },
};

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

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Hero Section */}
      <section className="py-20 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1
              className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {content.title}
            </h1>
            <p
              className="text-xl text-[#C6A664] font-medium mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {content.subtitle}
            </p>
            <p
              className="text-lg text-[#2F2A25]/80 leading-relaxed max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              {content.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Objectifs */}
      <section className="py-12 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-[#E6D9C6]"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-[#C6A664]" />
              <h2
                className="text-2xl font-bold text-[#2F2A25]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Objectifs de l'accompagnement
              </h2>
            </div>
            <ul className="space-y-3">
              {content.objectives.map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <CheckCircle2 className="h-5 w-5 text-[#C6A664] mt-0.5 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Méthodes */}
      <section className="py-12 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#E6D9C6]/50 to-[#C6A664]/20 rounded-2xl p-8 border border-[#E6D9C6]"
          >
            <h2
              className="text-2xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Méthodes utilisées
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {content.methods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-white/50 rounded-lg p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-[#C6A664] mt-0.5 flex-shrink-0" />
                  <span
                    className="text-[#2F2A25]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {method}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pour qui */}
      <section className="py-12 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-[#E6D9C6]"
          >
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-[#C6A664]" />
              <h2
                className="text-2xl font-bold text-[#2F2A25]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Pour qui ?
              </h2>
            </div>
            <ul className="space-y-3">
              {content.forWho.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-[#2F2A25]"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <Heart className="h-5 w-5 text-[#C6A664] mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Déroulement */}
      <section className="py-12 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <Clock className="h-6 w-6 text-[#C6A664]" />
              <h2
                className="text-2xl font-bold text-[#2F2A25]"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Déroulement de l'accompagnement
              </h2>
            </div>
            <div className="space-y-6">
              {content.process.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#C6A664]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-[#C6A664] text-white rounded-full flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-xl font-bold text-[#2F2A25] mb-2"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-[#2F2A25]/80"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {content.duration && (
              <div className="mt-6 bg-[#E6D9C6]/30 rounded-lg p-4">
                <p
                  className="text-[#2F2A25] font-medium"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  <strong>Durée :</strong> {content.duration}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 mx-4 mb-8">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#E6D9C6]/50 to-[#C6A664]/20 rounded-2xl p-12 border border-[#E6D9C6] text-center"
          >
            <h2
              className="text-3xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Prêt à commencer votre accompagnement ?
            </h2>
            <p
              className="text-lg text-[#2F2A25]/80 mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Contactez-moi pour discuter de vos besoins et planifier votre première consultation.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg shadow-xl"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
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
