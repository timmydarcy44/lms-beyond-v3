"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

import { BeyondStudioNav } from "@/components/beyond-studio/beyond-studio-nav";
import { AtmosphericGlow, TextReveal, cinematicEase } from "@/components/beyond-studio/motion/cinematic";
import { CampaignHeadline } from "@/components/beyond-studio/sections/campaign-headline";
import { HeroVisual } from "@/components/beyond-studio/sections/hero-visual";
import { MetricTrio } from "@/components/beyond-studio/sections/metric-trio";
import { MonumentLaptop } from "@/components/beyond-studio/sections/monument-laptop";
import { DarkSection, LightSection } from "@/components/beyond-studio/sections/section-shell";
import { cn } from "@/lib/utils";

function BtnPrimary({
  href,
  children,
  light,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition duration-500",
        light ? "bg-[#121218] text-white hover:bg-[#1e1e24]" : "bg-white text-[#050508] hover:bg-zinc-200",
      )}
    >
      {children}
    </a>
  );
}

function BtnOutline({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-medium text-white transition duration-500 hover:border-white/30 hover:bg-white/5"
    >
      {children}
    </a>
  );
}

function Hero() {
  return (
    <DarkSection className="relative min-h-[100svh] overflow-hidden" glow mouseGlow>
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1600px] flex-col lg:grid lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-8">
        <div className="relative z-20 flex flex-col justify-center px-6 pb-8 pt-28 sm:px-12 lg:px-16 lg:py-32">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-[11px] font-medium uppercase tracking-[0.34em] text-sky-400/80"
          >
            Beyond Studio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.3, delay: 0.15, ease: cinematicEase }}
            className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-white"
          >
            Nous construisons des systèmes pensés pour les humains.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: cinematicEase }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-zinc-400"
          >
            Applications, workflows, expériences digitales et systèmes IA conçus pour réduire la
            friction, guider l’attention et accélérer l’exécution.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <BtnPrimary href="#contact">Démarrer un projet</BtnPrimary>
            <BtnOutline href="#approche">Découvrir notre approche</BtnOutline>
          </motion.div>
        </div>

        <div className="relative flex flex-1 items-center justify-center px-4 pb-12 pt-8 lg:min-h-[100svh] lg:pb-0 lg:pt-24">
          <HeroVisual />
        </div>
      </div>
    </DarkSection>
  );
}

function ComplexitySection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1, 1.04]);
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section ref={ref} id="approche" className="relative min-h-[100svh] bg-[#050508]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ scale, y }} className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1515378791035-2758da8fad1f?w=2000&q=85"
            alt="Environnement de travail — charge cognitive"
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-[#050508]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/25 to-[#050508]/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_40%,rgba(40,70,140,0.2),transparent)]" />
        </motion.div>

        <div className="relative flex h-full flex-col justify-end px-6 pb-20 sm:px-12 sm:pb-28 lg:px-20">
          <CampaignHeadline
            title={
              <>
                Trop d’outils.
                <br />
                Trop de complexité.
                <br />
                Trop de charge mentale.
              </>
            }
            subtext="Quand un système devient plus difficile à gérer que le travail lui-même, il ne crée plus de performance. Il crée de la friction."
          />
        </div>
      </div>
    </section>
  );
}

function ClaritySection() {
  return (
    <LightSection className="py-24 sm:py-36">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 sm:px-12 lg:grid-cols-2 lg:gap-20 lg:px-20">
        <CampaignHeadline
          theme="light"
          title={
            <>
              Vos équipes ne manquent pas d’outils.
              <br />
              <span className="text-[#5c5c66]">Elles manquent de clarté.</span>
            </>
          }
          subtext="Nous concevons des systèmes plus simples à comprendre, plus rapides à utiliser et plus faciles à adopter."
        />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
          <Image
            src="https://images.unsplash.com/photo-1497215728101-856f4fd090b8?w=1200&q=85"
            alt="Espace de travail lumineux — clarté"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>
    </LightSection>
  );
}

function SystemsSection() {
  return (
    <DarkSection className="overflow-hidden py-20 sm:py-28" glow>
      <div className="mx-auto max-w-[1600px] px-6 sm:px-12 lg:px-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-16">
          <CampaignHeadline
            title="Des systèmes qui travaillent pour vous."
            subtext="IA, automatisation, design produit et données connectées pour transformer vos idées, vos process et vos interfaces en leviers de croissance."
          />
          <p className="hidden text-sm uppercase tracking-[0.3em] text-zinc-600 lg:block lg:text-right">
            Studio produit · IA-native
          </p>
        </div>
      </div>
      <div className="relative mt-12 sm:mt-16">
        <AtmosphericGlow />
        <div className="relative px-4 sm:px-8">
          <MonumentLaptop />
        </div>
      </div>
    </DarkSection>
  );
}

function EngagementSection() {
  return (
    <LightSection className="py-24 sm:py-36">
      <div className="mx-auto max-w-[1600px] px-6 sm:px-12 lg:px-20">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-20">
          <div>
            <CampaignHeadline
              theme="light"
              title="Une expérience fluide crée de l’engagement."
              subtext="Un site, une application ou un workflow bien conçu guide l’attention, réduit l’hésitation et facilite l’action."
            />
            <MetricTrio className="mt-16" />
          </div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] lg:mt-8">
            <Image
              src="https://images.unsplash.com/photo-1524758631624-e2822f304c36?w=1200&q=85"
              alt="Interface et expérience utilisateur"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </div>
      </div>
    </LightSection>
  );
}

function IdentitySection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.5, 1, 0.7]);

  return (
    <section ref={ref} className="relative min-h-[min(80vh,700px)] overflow-hidden bg-[#050508]">
      <motion.div style={{ opacity }} className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=85"
          alt="Architecture — ambition et structure"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#050508]/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/95 via-[#050508]/60 to-transparent" />
      </motion.div>

      <div className="relative flex min-h-[min(80vh,700px)] items-center px-6 py-28 sm:px-12 lg:px-20">
        <CampaignHeadline
          size="lg"
          title="Beyond Studio construit des systèmes cognitivement fluides."
          subtext="Des outils pensés autour de la manière dont les humains pensent, décident, travaillent et achètent."
        />
      </div>
    </section>
  );
}

function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section id="contact" ref={ref} className="relative min-h-[92svh] overflow-hidden bg-[#050508]">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2400&q=90"
          alt="Horizon — le bon système"
          fill
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[#050508]/65" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent" />

      <div className="relative flex min-h-[92svh] flex-col items-center justify-center px-6 py-28 text-center sm:px-12">
        <TextReveal>
          <h2 className="max-w-5xl text-[clamp(2.25rem,6.5vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white">
            Vous n’avez pas besoin de plus d’outils.
            <br />
            <span className="text-zinc-500">Vous avez besoin du bon système.</span>
          </h2>
        </TextReveal>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 1.1, ease: cinematicEase }}
          className="mt-14"
        >
          <BtnPrimary href="mailto:studio@beyond-learning.fr?subject=Projet%20Beyond%20Studio">
            Démarrer un projet
            <ArrowRight className="h-4 w-4" />
          </BtnPrimary>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-[#050508] py-12">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-4 px-6 text-sm text-zinc-600 sm:flex-row sm:px-12 lg:px-20">
        <span>© {new Date().getFullYear()} Beyond Studio</span>
        <Link href="/" className="transition hover:text-zinc-400">
          Retour Beyond LMS
        </Link>
      </div>
    </footer>
  );
}

export function BeyondStudioPage() {
  return (
    <>
      <BeyondStudioNav />
      <main>
        <Hero />
        <ComplexitySection />
        <ClaritySection />
        <SystemsSection />
        <EngagementSection />
        <IdentitySection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
