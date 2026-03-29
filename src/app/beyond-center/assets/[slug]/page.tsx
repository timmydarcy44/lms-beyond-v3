"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, Bolt, Brain, Cpu, Megaphone, Trophy } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: "easeOut" },
  viewport: { once: true, margin: "-140px" },
};

const titleStyle = {
  fontFamily:
    '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
  fontWeight: 900 as const,
  letterSpacing: "-0.04em",
};

const assets = [
  {
    slug: "marketing-sportif",
    title: "MARKETING SPORTIF",
    hero:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=2400&q=80",
    hook: "L'ARÈNE VOUS ATTEND. DEVENEZ SON MAÎTRE STRATÈGE.",
    benefit:
      "Tu ne vendras pas des tickets, tu vendras des émotions et des contrats à 7 chiffres.",
    tags: ["Élite Terrain", "+12 Open Badges", "Validation Pro A"],
    modulesTitle: "SAISONS DE L'ARÈNE",
    modules: [
      { title: "Saison 1 : Sponsoring de Haute Volée", benefit: "Signer des accords premium." },
      { title: "Saison 2 : Marketing Digital de l'Athlète", benefit: "Construire une marque personnelle." },
      { title: "Saison 3 : Économie des Droits TV", benefit: "Comprendre les revenus du sport." },
      { title: "Saison 4 : Activation Fans & Data", benefit: "Monétiser l'engagement." },
    ],
    badges: [
      { title: "Partenariats Elite", benefit: "Sécuriser des sponsors majeurs." },
      { title: "Brand Value", benefit: "Augmenter la valeur perçue." },
      { title: "Fan Economy", benefit: "Transformer la passion en revenus." },
    ],
    synopsis:
      "Comment nous avons scripté votre réussite avec les neurosciences et la performance commerciale.",
    icon: Trophy,
  },
  {
    slug: "communication-politique",
    title: "COMMUNICATION POLITIQUE",
    hero:
      "https://images.unsplash.com/photo-1457276587196-a9d53d84c58b?auto=format&fit=crop&w=2400&q=80",
    hook: "Le pouvoir du récit.",
    benefit:
      "Apprends à transformer une idée en mouvement et un candidat en leader.",
    tags: ["Certifié État", "+12 Open Badges", "Validation Pro A"],
    modules: [
      { title: "Narration & Opinion", benefit: "Créer un récit qui rassemble." },
      { title: "Influence Digitale", benefit: "Mobiliser l'attention." },
      { title: "Gestion de Crise", benefit: "Protéger la réputation." },
      { title: "Campagne Impact", benefit: "Transformer l'intention en action." },
    ],
    badges: [
      { title: "Leadership Narratif", benefit: "Construire un message fort." },
      { title: "Stratégie d'Image", benefit: "Maîtriser la perception publique." },
      { title: "Influence Responsable", benefit: "Aligner récit et action." },
    ],
    synopsis:
      "Comment nous avons scripté votre réussite avec les neurosciences et l'influence de haut niveau.",
    icon: Megaphone,
  },
  {
    slug: "etudes-comportementales",
    title: "ETUDES COMPORTEMENTALES",
    hero:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=2400&q=80",
    hook: "L'art de l'influence.",
    benefit:
      "Comprends ce que ton interlocuteur ne dit pas. Deviens un négociateur d'élite.",
    tags: ["Certifié État", "+12 Open Badges", "Validation Pro A"],
    modules: [
      { title: "Psychologie de la Décision", benefit: "Décrypter les signaux clés." },
      { title: "Détection des Objections", benefit: "Anticiper les freins." },
      { title: "Négociation Avancée", benefit: "Gagner sans friction." },
      { title: "Lecture Emotionnelle", benefit: "Agir au bon moment." },
    ],
    badges: [
      { title: "Influence Cognitive", benefit: "Orienter les décisions." },
      { title: "Closing Elite", benefit: "Conclure avec maîtrise." },
      { title: "Confiance Instantanée", benefit: "Créer l'adhésion." },
    ],
    synopsis:
      "Comment nous avons scripté votre réussite avec les neurosciences et l'art de convaincre.",
    icon: Brain,
  },
  {
    slug: "intelligence-artificielle",
    title: "IA & AUTOMATION",
    hero:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2400&q=80",
    hook: "Ne craignez pas l'IA. Devenez celui qui la pilote.",
    benefit:
      "L'IA est le levier de productivité le plus puissant de l'histoire. Cet Asset vous apprend à intégrer les LLMs et l'automatisation au cœur de vos processus de vente et de gestion. Apprenez à faire en 1 heure ce qui en prenait 10.",
    tags: ["Prompt Engineering", "Workflow Automation", "Agentic Workflows"],
    modulesTitle: "SAISONS DE MAÎTRISE",
    modules: [
      {
        title: "Saison 1 : Ingénierie du Prompt & IA Générative",
        benefit: "Maîtriser les outils de création et de stratégie.",
      },
      {
        title: "Saison 2 : Automation Business",
        benefit: "Créer des workflows autonomes sans code pour la prospection.",
      },
      {
        title: "Saison 3 : Éthique & Gouvernance de la Donnée",
        benefit: "Piloter l'IA de manière responsable et sécurisée.",
      },
    ],
    badges: [
      { title: "Prompt Engineering", benefit: "Structurer des instructions de haut niveau." },
      { title: "Sales Automation", benefit: "Automatiser la prospection." },
      { title: "AI Governance", benefit: "Sécuriser les flux de données." },
    ],
    synopsis:
      "Comment nous avons scripté votre réussite avec les neurosciences et l'IA appliquée au business.",
    icon: Cpu,
  },
  {
    slug: "strategie-rse",
    title: "STRATÉGIE RSE",
    hero:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=80",
    hook: "Ne subissez plus le changement, devenez son architecte.",
    benefit:
      "Dans une économie en pleine mutation, maîtriser la RSE n'est plus une option, c'est le levier de croissance indispensable. Vous apprendrez à intégrer l'impact social et environnemental au cœur de la stratégie d'entreprise, transformant les contraintes en opportunités.",
    tags: ["Économie d'Impact", "Normes ISO", "Leadership Éthique"],
    modulesTitle: "SAISONS DE L'ENGAGEMENT",
    modules: [
      {
        title: "Saison 1 : Pilotage de la Performance Durable",
        benefit: "Évaluation d'empreinte, reporting ESG.",
      },
      {
        title: "Saison 2 : Ingénierie des Modèles Économiques Circulaires",
        benefit: "Innovation produit, chaînes d'approvisionnement responsables.",
      },
      {
        title: "Saison 3 : Leadership Éthique & Communication Engagée",
        benefit: "Management inclusif, storytelling d'impact.",
      },
    ],
    badges: [
      { title: "Leadership Impact", benefit: "Piloter la transformation." },
      { title: "ESG Precision", benefit: "Mesurer et prouver l'impact." },
      { title: "Impact Storytelling", benefit: "Déployer le récit engagé." },
    ],
    synopsis: "Comment nous avons scripté votre réussite avec les neurosciences.",
    icon: BarChart3,
  },
  {
    slug: "energies-renouvelables",
    title: "ENERGIES RENOUVELABLES",
    hero:
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=2400&q=80",
    hook: "Le business du futur.",
    benefit:
      "Positionne-toi sur le marché le plus stratégique de la décennie.",
    tags: ["Certifié État", "+12 Open Badges", "Validation Pro A"],
    modules: [
      { title: "Économie de la Transition", benefit: "Comprendre les cycles." },
      { title: "Business Dev Énergie", benefit: "Signer des partenariats." },
      { title: "Financement & Deal", benefit: "Structurer les projets." },
      { title: "Déploiement Terrain", benefit: "Passer à l'échelle." },
    ],
    badges: [
      { title: "Partenariats Stratégiques", benefit: "Monter des deals." },
      { title: "Innovation Énergie", benefit: "Accélérer la transition." },
      { title: "Financement Durable", benefit: "Sécuriser les projets." },
    ],
    synopsis:
      "Comment nous avons scripté votre réussite avec les neurosciences et les industries d'avenir.",
    icon: Bolt,
  },
];

type PageProps = {
  params: { slug: string };
};

export default function AssetPage({ params }: PageProps) {
  const asset = assets.find((item) => item.slug === params.slug) ?? assets[0];
  const Icon = asset.icon;

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Asset Switcher */}
      <div className="sticky top-4 z-40 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border border-white/10 bg-black/70 px-5 py-3 backdrop-blur">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">Beyond Originals</span>
        <div className="flex items-center gap-3 overflow-x-auto">
          {assets.map((item) => {
            const ItemIcon = item.icon;
            const isActive = item.slug === asset.slug;
            return (
              <Link
                key={item.slug}
                href={`/beyond-center/assets/${item.slug}`}
                className={`group flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] transition ${
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
                }`}
              >
                <ItemIcon className="h-3.5 w-3.5" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* HERO BILLBOARD */}
      <section className="relative mt-6 min-h-[70vh] overflow-hidden bg-black text-white">
        <Image
          src={asset.hero}
          alt={asset.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/90" />
        <div className="relative z-10 flex min-h-[70vh] items-end px-6 pb-16">
          <div className="mx-auto w-full max-w-6xl space-y-6">
            <motion.h1 {...fadeUp} className="text-4xl sm:text-5xl md:text-6xl font-black" style={titleStyle}>
              {asset.title}
            </motion.h1>
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/70">
              {asset.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/20 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/beyond-center/pre-inscription?asset=${asset.slug}`}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black"
              >
                Postuler
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-white/15 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/80"
              >
                Découvrir la méthode
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ROWS */}
      <section className="space-y-12 px-6 py-16">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold uppercase tracking-[0.3em] text-white/80">
            {asset.modulesTitle ?? "VOTRE ARSENAL COMPORTEMENTAL"}
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {asset.modules.map((module) => (
              <div
                key={module.title}
                className="group relative aspect-video w-72 shrink-0 overflow-hidden rounded-xl bg-white/5"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="text-sm font-semibold text-white">{module.title}</div>
                  <div className="mt-2 text-xs text-white/70 opacity-0 transition group-hover:opacity-100">
                    {module.benefit}
                  </div>
                </div>
                <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold uppercase tracking-[0.3em] text-white/80">
            LES BADGES À DÉBLOQUER
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {asset.badges.map((badge) => (
              <div
                key={badge.title}
                className="group relative aspect-video w-72 shrink-0 overflow-hidden rounded-xl bg-white/5"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="text-sm font-semibold text-white">{badge.title}</div>
                  <div className="mt-2 text-xs text-white/70 opacity-0 transition group-hover:opacity-100">
                    {badge.benefit}
                  </div>
                </div>
                <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SYNOPSIS */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl space-y-4">
          <h2 className="text-xl font-semibold uppercase tracking-[0.3em] text-white/80">Synopsis</h2>
          <p className="text-lg text-white/70">{asset.synopsis}</p>
        </div>
      </section>

      {/* FINANCEMENT */}
      <section className="bg-[#0f0f0f] py-16">
        <div className="mx-auto max-w-5xl px-6 text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">
            0€ de frais. 100% financé par l'alternance.
          </p>
          <p className="text-lg text-white/70">
            Un coût nul, une valeur maximale. Votre carrière démarre ici.
          </p>
        </div>
      </section>
    </main>
  );
}
