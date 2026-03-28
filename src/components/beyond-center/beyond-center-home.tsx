"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { BeyondCenterHeader } from "@/components/beyond-center/beyond-center-header";
import {
  ASSET_NEVO_LOGO,
  BeyondCenterMarketingFooter,
  cn,
  DarkAmbientBackground,
  DashboardShowcase,
  DashboardShowcaseStatic,
  fadeUp,
  GlassDark,
  GlassLight,
  heroStagger,
  Section,
} from "@/components/beyond-center/beyond-center-shared";
import { motion, useScroll, useTransform } from "framer-motion";
import { Brain, Rocket, ScanSearch } from "lucide-react";

function ParallaxImage({
  src,
  alt,
  className,
  priority,
  variant = "dark",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  variant?: "dark" | "light";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  const overlay =
    variant === "dark"
      ? "from-violet-950/50 via-transparent to-cyan-950/30"
      : "from-slate-900/15 via-transparent to-violet-100/20";

  return (
    <div ref={ref} className={cn("relative h-full w-full overflow-hidden", className)}>
      <motion.div style={{ y }} className="absolute inset-0 h-[115%] w-full -top-[7.5%]">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority={priority} />
      </motion.div>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t", overlay)} />
    </div>
  );
}

const IMG = {
  think: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=80&auto=format&fit=crop",
  doubt: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80&auto=format&fit=crop",
  oneOnOne: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=80&auto=format&fit=crop",
  strategic: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=900&q=80&auto=format&fit=crop",
};

export function BeyondCenterHome() {
  return (
    <div
      className="min-h-screen scroll-smooth bg-[#030712] font-sans text-slate-100 antialiased selection:bg-violet-500/30 selection:text-white"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <BeyondCenterHeader />

      {/* —— 1. HERO —— */}
      <section id="hero" className="relative scroll-mt-24 overflow-hidden pb-24 pt-6 md:pb-32 md:pt-8">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-16 px-6 md:px-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <motion.h1
              className="text-[clamp(2.1rem,5.2vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-white"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={fadeUp} className="block">
                Avant d&apos;améliorer la performance,
              </motion.span>
              <motion.span
                variants={fadeUp}
                className="mt-1 block bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent"
              >
                il faut comprendre ce qui la produit.
              </motion.span>
            </motion.h1>
            <motion.div
              className="mt-10 space-y-1 text-[clamp(1rem,2vw,1.12rem)] font-medium leading-relaxed text-slate-400"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              {[
                "Analysez le fonctionnement de vos équipes.",
                "Identifiez les leviers réels de performance.",
                "Déployez une progression durable.",
              ].map((line) => (
                <motion.p key={line} variants={fadeUp} className="block">
                  {line}
                </motion.p>
              ))}
            </motion.div>
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.a
                href="/pilote"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-10 py-4 text-[15px] font-semibold text-slate-950 shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)] transition-shadow duration-300 hover:shadow-[0_0_56px_-6px_rgba(34,211,238,0.45)]"
              >
                Lancer un pilote
              </motion.a>
            </motion.div>
          </div>
          <div>
            <DashboardShowcaseStatic variant="dark" priority />
          </div>
        </div>
      </section>

      {/* —— 2. PROBLÈME —— */}
      <section id="probleme" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06] py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 md:px-8 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.06] tracking-[-0.04em] text-white">
              Les compétences ne sont pas le problème.
            </h2>
            <p className="mt-8 text-[17px] leading-relaxed text-slate-400">
              Les entreprises recrutent sur les compétences.
              <br />
              Elles perdent leurs collaborateurs à cause du manque d&apos;alignement.
            </p>
            <GlassDark className="mt-10 p-6">
              <p className="text-[15px] leading-relaxed text-slate-200">
                Le <em className="not-italic text-cyan-300/90">person–organization fit</em> est reconnu comme un facteur
                clé de performance et de rétention.
              </p>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Sources : recherches en psychologie organisationnelle.
              </p>
            </GlassDark>
          </div>
          <GlassDark className="overflow-hidden p-1.5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.1rem]">
              <ParallaxImage src={IMG.doubt} alt="Personne en doute ou réflexion" variant="dark" className="h-full" />
            </div>
          </GlassDark>
        </div>
      </section>

      {/* —— TRANSITION —— */}
      <Section
        id="transition"
        className="scroll-mt-24 border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50 py-20 text-slate-900 md:py-28"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="max-w-3xl text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
            Le problème n&apos;est pas la compétence.
            <br />
            <span className="text-slate-500">C&apos;est la manière dont les personnes fonctionnent.</span>
          </h2>
          <Link
            href="/approche"
            className="mt-8 inline-flex text-[14px] font-semibold text-violet-700 transition-colors hover:text-violet-900"
          >
            Notre approche →
          </Link>
        </div>
      </Section>

      {/* —— COMMENT ÇA FONCTIONNE (neuro) —— */}
      <Section
        id="comment"
        className="scroll-mt-24 border-t border-slate-200/80 bg-slate-50 py-24 text-slate-900 md:py-32"
      >
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="max-w-3xl text-[clamp(1.75rem,3.4vw,2.65rem)] font-semibold leading-[1.12] tracking-[-0.035em]">
            Vous ne pouvez pas améliorer ce que vous ne comprenez pas.
          </h2>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                Icon: Brain,
                label: "Rendre visible",
                d: "Nous révélons comment vos collaborateurs pensent, réagissent et prennent des décisions.",
              },
              {
                Icon: ScanSearch,
                label: "Donner du sens",
                d: "Nous transformons ces données en compréhension claire et exploitable.",
              },
              {
                Icon: Rocket,
                label: "Transformer durablement",
                d: "Nous activons des leviers concrets pour faire évoluer les comportements et la performance.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <GlassLight
                  className="h-full border-slate-200/90 bg-white/80 p-8 transition-[box-shadow,transform] duration-300 group-hover:shadow-[0_20px_50px_-20px_rgba(99,102,241,0.15)]"
                  hoverLift={false}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-200/80 bg-gradient-to-br from-violet-50 to-cyan-50 text-violet-600 transition-transform duration-300 group-hover:scale-105">
                    <item.Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{item.label}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{item.d}</p>
                </GlassLight>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* —— PRODUIT —— */}
      <Section id="plateforme" className="scroll-mt-24 border-t border-slate-100 bg-slate-50/80 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="max-w-3xl text-[clamp(1.85rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-slate-900">
            Un système conçu pour transformer la compréhension en performance.
          </h2>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-slate-600">
            Beyond ne s&apos;arrête pas à l&apos;analyse. Chaque insight devient une action concrète, intégrée dans un
            système de progression.
          </p>
          <Link
            href="/plateforme"
            className="mt-6 inline-flex text-[14px] font-semibold text-violet-700 transition-colors hover:text-violet-900"
          >
            La plateforme Beyond →
          </Link>
          <motion.div
            className="mx-auto mt-16 max-w-4xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <DashboardShowcase variant="light" imageMotion="parallax" />
          </motion.div>
          <ul className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              "Parcours personnalisés",
              "Micro-learning",
              "Mise en pratique",
              "Suivi de progression",
              "Outils intégrés",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-3 text-[15px] font-medium text-slate-800 shadow-sm backdrop-blur-sm"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* —— 6. HUMAIN (mix) —— */}
      <Section
        id="humain"
        className="relative scroll-mt-24 overflow-hidden border-t border-slate-200/80 py-24 md:py-32"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-[#0a1628]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(139,92,246,0.12),transparent)]" />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 md:px-8 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <GlassLight className="col-span-2 overflow-hidden p-1 sm:col-span-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem]">
                <ParallaxImage src={IMG.oneOnOne} alt="Échange humain, coaching" variant="light" className="h-full" />
              </div>
            </GlassLight>
            <GlassLight className="col-span-2 overflow-hidden p-1 sm:col-span-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1rem]">
                <ParallaxImage src={IMG.strategic} alt="Discussion stratégique" variant="light" className="h-full" />
              </div>
            </GlassLight>
          </div>
          <div>
            <h2 className="text-[clamp(1.85rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-slate-900">
              La technologie seule ne suffit pas.
            </h2>
            <p className="mt-6 text-[17px] leading-relaxed text-slate-600">
              Beyond combine données, compréhension humaine et accompagnement ciblé.
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-600">
              Sessions individuelles, ateliers et suivi permettent de transformer durablement les comportements.
            </p>
            <div className="mt-8 hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl lg:block">
              <p className="text-[13px] leading-relaxed text-slate-300">
                Un produit qui relie diagnostics, stratégie RH et exécution — sans se substituer à votre management.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* —— PREUVE —— */}
      <Section id="preuve" className="scroll-mt-24 border-t border-slate-100 bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <h2 className="text-[clamp(1.5rem,2.8vw,2.1rem)] font-semibold tracking-[-0.03em] text-slate-900">
            Ils se développent avec nous
          </h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            Basé sur les sciences cognitives, la psychologie comportementale et les sciences de l&apos;apprentissage.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-8 rounded-2xl border border-slate-200/80 bg-white/70 px-8 py-12 shadow-sm backdrop-blur-md md:flex-row md:gap-14 md:py-14">
            <div className="relative h-14 w-40 shrink-0 md:h-16 md:w-48">
              <Image
                src={ASSET_NEVO_LOGO}
                alt="Nevo"
                fill
                className="object-contain object-left md:object-center"
                sizes="(max-width: 768px) 160px, 192px"
              />
            </div>
            <p className="max-w-md text-center text-[15px] leading-relaxed text-slate-700 md:text-left">
              Déjà utilisé dans des environnements de formation et d&apos;accompagnement.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                q: "« Enfin une approche produit — pas un catalogue de formations recyclé. »",
                a: "[Témoignage — DRH]",
              },
              {
                q: "« Nos équipes gagnent en clarté. Les managers en légitimité. »",
                a: "[Témoignage — Direction]",
              },
            ].map((t) => (
              <GlassLight key={t.q} className="p-8">
                <p className="text-[15px] leading-relaxed text-slate-700">{t.q}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t.a}</p>
              </GlassLight>
            ))}
          </div>
        </div>
      </Section>

      {/* —— RESSOURCES —— */}
      <Section id="ressources" className="scroll-mt-24 border-t border-slate-100 bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Ressources</p>
          <h2 className="mt-3 text-[clamp(1.5rem,2.5vw,2rem)] font-semibold tracking-[-0.03em] text-slate-900">
            Insights & crédibilité
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Analyses, retours d&apos;expérience et guides — pour décider avec méthode.
          </p>
          <Link
            href="/beyond-center/ressources"
            className="mt-6 inline-flex text-[14px] font-semibold text-violet-700 transition-colors hover:text-violet-900"
          >
            Voir l&apos;espace Ressources →
          </Link>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Articles", d: "Vision produit, cognition, RH." },
              { t: "Études & analyses", d: "Données et lectures clés." },
              { t: "Cas clients", d: "Récits de déploiement." },
              { t: "Guides", d: "Méthodes et bonnes pratiques." },
            ].map((card) => (
              <div
                key={card.t}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="text-[15px] font-semibold text-slate-900">{card.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{card.d}</p>
                <span className="mt-4 inline-block text-[12px] font-medium text-violet-600/80">Bientôt</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* —— CTA —— */}
      <section id="pilote" className="relative scroll-mt-24 overflow-hidden py-24 md:py-32">
        <DarkAmbientBackground />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(139,92,246,0.2),transparent)]" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center md:px-8">
          <h2 className="text-[clamp(1.85rem,3.5vw,2.6rem)] font-semibold leading-tight tracking-[-0.035em] text-white">
            Et si vous commenciez par comprendre ?
          </h2>
          <motion.div className="mt-12" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/pilote"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-11 py-4 text-[15px] font-semibold text-white shadow-[0_0_48px_-12px_rgba(34,211,238,0.35)] backdrop-blur-[20px] transition-all duration-300 hover:border-cyan-300/40 hover:bg-white/15"
              style={{ WebkitBackdropFilter: "blur(20px)" }}
            >
              Lancer un pilote
            </Link>
          </motion.div>
        </div>
      </section>

      <BeyondCenterMarketingFooter />
    </div>
  );
}
