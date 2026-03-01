"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { BarChart3, Home, Map, Search, Settings, Share2, User, Wallet } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const as [number, number, number, number] },
  },
};

const TRENDING = [
  {
    title: "Neuro-Négociation",
    tag: "TOP 10",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    coSign: ["Ligue 1"],
    href: "/beyond-no-school/competences/negociation",
  },
  {
    title: "IA & Automation",
    tag: "NEW",
    image: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80",
    coSign: ["Tech-Board"],
    href: "/beyond-no-school/competences/analyse-donnees-decisionnelle",
  },
  {
    title: "Immobilier : Le Closing",
    tag: "TOP 10",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    coSign: ["Nexity", "Bouygues"],
    href: "/beyond-no-school/competences/gestion-projet-complexe",
  },
  {
    title: "Stratégie RSE",
    tag: "NEW",
    image: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=800&q=80",
    coSign: ["Pro A"],
    href: "/beyond-no-school/competences/rse-impact",
  },
];

const CONTINUE = [
  {
    title: "Prospection B2B",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80",
    progress: 62,
  },
  {
    title: "Storytelling d'Impact",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    progress: 38,
  },
  {
    title: "Automation CRM",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    progress: 74,
  },
];

export function BeyondNoSchoolPage() {
  return (
    <main className="min-h-screen bg-[#050505] pb-20 text-white md:pb-0">
      <SideNav />
      <div className="flex-1 md:pl-20">
        <DynamicHero />
        <RailsSection />
        <OriginalsSection />
      </div>
    </main>
  );
}

function SideNav() {
  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-16 flex-col items-center gap-6 border-r border-white/10 bg-white/5 px-3 py-6 backdrop-blur-xl transition-all duration-300 hover:w-48 md:flex">
        <Link
          href="/beyond-no-school"
          className="max-w-[120px] text-xs font-semibold uppercase tracking-[0.28em] text-white/80"
        >
          Beyond
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80"
          aria-label="Rechercher"
        >
          <Search className="h-4 w-4" />
        </button>
        <nav className="flex flex-col gap-4 text-white/70">
          <NavItem icon={<Home className="h-4 w-4" />} label="Accueil" href="/beyond-no-school/catalogue" />
          <NavItem icon={<Map className="h-4 w-4" />} label="Mon Parcours" href="/beyond-no-school/trajectoire" />
          <NavItem icon={<BarChart3 className="h-4 w-4" />} label="Progression" href="/beyond-no-school/progression" />
          <NavItem icon={<Wallet className="h-4 w-4" />} label="Wallet" href="/beyond-no-school/wallet" />
          <NavItem icon={<Share2 className="h-4 w-4" />} label="Beyond Connect" href="/beyond-connect" />
          <NavItem icon={<User className="h-4 w-4" />} label="Profil" href="/beyond-no-school/profil" />
          <NavItem icon={<Settings className="h-4 w-4" />} label="Paramètres" href="/beyond-no-school/compte" />
        </nav>
      </aside>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-black/80 px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-white/70 backdrop-blur md:hidden">
        <Link href="/beyond-no-school/catalogue" className="flex flex-col items-center gap-1">
          <Home className="h-4 w-4" />
          Accueil
        </Link>
        <Link href="/beyond-no-school/trajectoire" className="flex flex-col items-center gap-1">
          <Map className="h-4 w-4" />
          Parcours
        </Link>
        <Link href="/beyond-no-school/wallet" className="flex flex-col items-center gap-1">
          <Wallet className="h-4 w-4" />
          Wallet
        </Link>
        <Link href="/beyond-no-school/profil" className="flex flex-col items-center gap-1">
          <User className="h-4 w-4" />
          Profil
        </Link>
      </nav>
    </>
  );
}

function NavItem({ icon, label, href }: { icon: ReactNode; label: string; href?: string }) {
  const content = (
    <>
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10">
        {icon}
      </span>
      <span className="hidden whitespace-nowrap group-hover:inline-block">{label}</span>
    </>
  );

  return href ? (
    <Link href={href} className="flex items-center gap-3 text-sm font-medium hover:text-white">
      {content}
    </Link>
  ) : (
    <div className="flex items-center gap-3 text-sm font-medium">
      {content}
    </div>
  );
}

function DynamicHero() {
  return (
    <section className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden px-8 pb-32 pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-left"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=80)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-black/60 to-black"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% 18%, rgba(255,59,48,0.22) 0%, rgba(12,12,18,0.7) 40%, rgba(5,5,7,0.96) 85%)",
        }}
      />
      <Link
        href="/beyond-no-school/catalogue"
        className="absolute left-8 top-8 max-w-[120px] text-xs font-semibold uppercase tracking-[0.28em] text-white/85"
      >
        Beyond
      </Link>
      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <motion.h1
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-[40px] font-semibold leading-[0.92] tracking-tight text-white md:text-[60px] lg:text-[72px]"
        >
          IA & AUTOMATION : ASSISTANT
        </motion.h1>
        <motion.p
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
          className="max-w-2xl text-base text-white/75 md:text-lg"
        >
          Une certification co-signée par le consortium Tech & Sport de Haut Niveau.
        </motion.p>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={fadeUp}
          className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.35em] text-zinc-300"
        >
          <span>2026</span>
          <span>Durée : 2h</span>
          <span>Niveau : Élite</span>
          <span>★★★★★</span>
            </motion.div>
        <div className="mt-4 space-y-4">
          <div className="h-[3px] w-full max-w-md rounded-full bg-white/20">
            <div className="h-[3px] w-[90%] rounded-full bg-[#FF3B30]" />
        </div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">90% complété</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/beyond-no-school/competences/analyse-donnees-decisionnelle"
              className="inline-flex items-center justify-center rounded-full bg-[#FF3B30] px-7 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-transform duration-300 hover:scale-[1.04]"
          >
              ▶ Commencer la certification
          </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur"
            >
              + Ajouter à ma liste
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RailsSection() {
  return (
    <section className="space-y-12 px-8 pb-24">
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Tendances actuelles</h2>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {TRENDING.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative aspect-[2/3] w-56 shrink-0 overflow-hidden rounded-xl bg-white/5 transition-transform duration-300 hover:scale-110"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="rounded-full bg-black/70 px-4 py-2 text-[10px] uppercase tracking-[0.35em] text-white/80">
                  Preview
                </span>
              </div>
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-black">
                {item.tag}
              </span>
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <div className="flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.coSign.map((coSign) => (
                    <span
                      key={coSign}
                      className="rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[9px] uppercase tracking-[0.35em] text-white/75"
                    >
                      {coSign}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Reprendre votre progression</h2>
        <div className="flex gap-5 overflow-x-auto pb-4">
          {CONTINUE.map((item) => (
            <div
              key={item.title}
              className="group relative aspect-video w-80 shrink-0 overflow-hidden rounded-xl bg-white/5 transition-transform duration-300 hover:scale-105"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${item.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-3">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <div className="h-[3px] w-full rounded-full bg-white/20">
                  <div
                    className="h-[3px] rounded-full bg-[#FF3B30]"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OriginalsSection() {
  return (
    <section className="px-8 pb-24">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,59,48,0.25),transparent_60%)]" />
        <div className="relative space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Beyond Originals</p>
          <h2 className="text-3xl font-semibold text-white">
            Pack Immersion Week-end · 149€
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/beyond-no-school/competences/marketing-sportif"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-black"
            >
              Lecture · Accès Immédiat
          </Link>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/80"
            >
              + Ajouter à ma liste
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BeyondNoSchoolPage;


