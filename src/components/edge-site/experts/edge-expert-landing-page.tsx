"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Plus,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EXPERT_DOMAINS } from "@/lib/expert/specialties-referential";

const BENEFITS = [
  {
    icon: Target,
    title: "Des missions qui vous ressemblent",
    body: "Les entreprises Byound Business vous sollicitent selon vos domaines, vos spécialités et vos disponibilités.",
    gradient: "from-[#7C83FF]/30 via-[#3b2a9a]/20 to-transparent",
  },
  {
    icon: LayoutDashboard,
    title: "Un cockpit pour tout piloter",
    body: "Agenda, demandes, documents et revenus réunis dans un seul espace, pensé comme une app.",
    gradient: "from-sky-400/25 via-[#1d3a8a]/20 to-transparent",
  },
  {
    icon: Award,
    title: "Une certification qui vous distingue",
    body: "Byound Certified fait reconnaître votre posture de formateur, avec un Open Badge à valoriser sur LinkedIn.",
    gradient: "from-fuchsia-400/25 via-[#5b2a8a]/20 to-transparent",
  },
];

const PROCESS = [
  { title: "Créez votre profil", body: "Une question par écran : identité, domaines, spécialités, formats." },
  { title: "Accédez à votre espace", body: "Votre cockpit expert est disponible pendant l'étude du dossier." },
  { title: "Validation pédagogique", body: "L'équipe Byound revoit votre dossier et échange avec vous." },
  { title: "Recevez vos missions", body: "Votre profil est publié et les demandes arrivent dans votre cockpit." },
];

const METHOD = [
  "Parcours orientés livrables et mises en situation réelles",
  "Évaluation par les compétences, pas par la récitation",
  "La théorie sert la pratique, jamais l'inverse",
];

const FAQ = [
  {
    q: "Qui peut rejoindre le réseau Byound ?",
    a: "Les formateurs, consultants et experts métier qui ont une expérience concrète à transmettre : management, vente, communication, IA, RH, et bien d'autres domaines.",
  },
  {
    q: "Comment se passe la validation de mon profil ?",
    a: "Après votre inscription, vous créez votre mot de passe et accédez à votre espace. L'équipe Byound étudie ensuite votre dossier puis procède à une validation pédagogique avant de publier votre profil.",
  },
  {
    q: "Qu'est-ce que Byound Certified ?",
    a: "Un parcours optionnel qui certifie votre posture de formateur. Il vous donne une priorité dans le matching et un Open Badge à partager.",
  },
  {
    q: "Puis-je modifier mon profil après l'inscription ?",
    a: "Oui, à tout moment depuis la rubrique « Mon profil » de votre espace expert : photo, bio, spécialités, zones et disponibilités.",
  },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,131,255,0.45),transparent_65%)] blur-2xl" />
      <div className="relative rounded-[44px] border border-white/15 bg-[#05070f] p-2.5 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div className="relative overflow-hidden rounded-[36px] bg-[#070b1f] px-5 pb-6 pt-10">
          <div className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,131,255,0.5),transparent_65%)] blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#070b1f]">
                C
              </span>
              <span className="text-[11px] font-semibold text-white">Bonjour Claire</span>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <Bell className="h-3.5 w-3.5 text-white" />
            </span>
          </div>

          <div className="relative mt-7 text-center">
            <p className="text-[10px] font-medium text-white/55">CA généré · EUR</p>
            <p className="mt-1 font-semibold tracking-[-0.04em] text-white">
              <span className="text-5xl">2 840</span>
              <span className="text-2xl">,00 €</span>
            </p>
            <span className="mt-3 inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium text-white">
              Détail financier
            </span>
          </div>

          <div className="relative mt-6 flex justify-center gap-5">
            {[Plus, CalendarDays, FileText].map((Icon, i) => (
              <span key={i} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Icon className="h-4 w-4 text-white" />
              </span>
            ))}
          </div>

          <div className="relative mt-6 space-y-2">
            {[
              { title: "Atelier leadership", meta: "Mar. 14:00 · Lyon", tag: "Confirmée" },
              { title: "Prise de parole", meta: "Jeu. 09:30 · À distance", tag: "Nouvelle" },
            ].map((m) => (
              <div key={m.title} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-3 py-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Briefcase className="h-3.5 w-3.5 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-white">{m.title}</p>
                  <p className="text-[10px] text-white/50">{m.meta}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                    m.tag === "Nouvelle" ? "bg-[#7C83FF] text-white" : "bg-emerald-400/20 text-emerald-200",
                  )}
                >
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -left-16 top-24 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20">
          <Check className="h-4 w-4 text-emerald-300" strokeWidth={3} />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-white">Profil validé</p>
          <p className="text-[10px] text-white/55">Publié dans le réseau</p>
        </div>
      </div>

      <div className="absolute -right-14 bottom-28 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-white/10 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7C83FF]/30">
          <BadgeCheck className="h-4 w-4 text-[#C9CCFF]" />
        </span>
        <div>
          <p className="text-[11px] font-semibold text-white">Byound Certified</p>
          <p className="text-[10px] text-white/55">Open Badge obtenu</p>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.08]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-lg font-semibold tracking-tight text-[#070b1f]">{q}</span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] transition",
            open && "rotate-180 bg-[#070b1f] text-white",
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]")}>
        <p className="overflow-hidden pr-14 text-[15px] leading-relaxed text-black/55">{a}</p>
      </div>
    </div>
  );
}

export function EdgeExpertLandingPage() {
  const { links } = useEdgePremiumConfig();
  const signup = links.expertSignup;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#070b1f] px-5 pb-24 pt-32 text-white sm:px-8 lg:px-10 lg:pb-32 lg:pt-40">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 left-1/4 h-[700px] w-[900px] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,80,255,0.35),transparent_62%)] blur-3xl" />
          <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,120,255,0.2),transparent_62%)] blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-[#A9AEFF]" />
              Réseau formateurs & experts
            </span>
            <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
              Transmettez votre expertise.
              <span className="block bg-gradient-to-r from-[#A9AEFF] via-[#C9CCFF] to-[#9BD0FF] bg-clip-text text-transparent">
                On s&apos;occupe du reste.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
              Rejoignez Byound et intervenez sur des parcours structurés, exigeants et orientés impact, avec un
              cockpit qui gère vos missions, votre agenda et vos revenus.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signup}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-[#070b1f] transition hover:bg-white/90"
              >
                Créer mon compte expert
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#comment-ca-marche"
                className="inline-flex h-14 items-center justify-center rounded-full bg-white/[0.08] px-8 text-[15px] font-semibold text-white transition hover:bg-white/[0.14]"
              >
                Comment ça marche
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
              {["Inscription en quelques minutes", "Sans engagement", "Profil validé par Byound"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#A9AEFF]" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Bénéfices */}
      <section className="bg-[#070b1f] px-5 pb-24 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Tout ce qu&apos;il faut pour vous concentrer sur l&apos;essentiel : former.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, body, gradient }) => (
              <article
                key={title}
                className="relative overflow-hidden rounded-[32px] border border-white/[0.07] bg-[#10173a]/70 p-7"
              >
                <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", gradient)} aria-hidden />
                <div className="relative">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#070b1f]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-16 text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/60">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Cockpit */}
      <section className="bg-[#f4f4f2] px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#5B50FF]">Votre espace expert</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#070b1f]">
              Votre activité de formateur, aussi simple qu&apos;une app bancaire.
            </h2>
            <ul className="mt-8 space-y-5">
              {[
                { icon: Briefcase, title: "Demandes en un geste", body: "Acceptez ou refusez les missions entreprises directement depuis votre cockpit." },
                { icon: CalendarDays, title: "Agenda synchronisé", body: "Connectez votre agenda pour recevoir des propositions sur vos créneaux libres." },
                { icon: Wallet, title: "Revenus en temps réel", body: "Suivez votre chiffre d'affaires mois par mois et retrouvez vos documents." },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#070b1f] text-white">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#070b1f]">{title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-black/55">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[36px] bg-[#070b1f] p-6 text-white shadow-[0_40px_100px_rgba(7,11,31,0.35)] sm:p-8">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,131,255,0.45),transparent_65%)] blur-2xl" />
            <div className="relative grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/[0.06] p-5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Mes revenus</p>
                  <span className="text-[11px] text-white/45">6 derniers mois</span>
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">2 840 €</p>
                <div className="mt-5 flex h-20 items-end gap-2">
                  {[30, 45, 38, 62, 70, 100].map((h, i) => (
                    <div
                      key={i}
                      className={cn("flex-1 rounded-full", i === 5 ? "bg-[#9AA0FF] shadow-[0_0_16px_rgba(154,160,255,0.6)]" : "bg-white/15")}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white/[0.06] p-5">
                <p className="text-xs text-white/55">Missions</p>
                <p className="mt-4 text-3xl font-semibold">12</p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-[#2a3a8f] to-[#1a2466] p-5">
                <p className="text-xs text-white/70">Profil complété</p>
                <p className="mt-4 text-3xl font-semibold">100%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profils recherchés */}
      <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#5B50FF]">Les profils recherchés</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#070b1f]">
              Une expérience terrain à partager ? Votre place est ici.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-black/55">
              Formateurs, consultants et experts métier, dans tous ces domaines :
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {EXPERT_DOMAINS.map((d) => (
              <span
                key={d.id}
                className="rounded-full border border-black/[0.08] bg-[#f4f4f2] px-5 py-2.5 text-sm font-medium text-[#070b1f]"
              >
                {d.label}
              </span>
            ))}
          </div>

          <div className="mt-16 grid gap-4 rounded-[32px] bg-[#f4f4f2] p-8 md:grid-cols-[1fr_1.4fr] md:items-center">
            <div>
              <p className="text-sm font-semibold text-[#5B50FF]">Notre méthode pédagogique</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#070b1f]">Apprendre en faisant.</p>
            </div>
            <ul className="space-y-3">
              {METHOD.map((m) => (
                <li key={m} className="flex items-start gap-3 text-[15px] text-[#070b1f]/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#070b1f] text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Processus */}
      <section id="comment-ca-marche" className="scroll-mt-24 bg-[#070b1f] px-5 py-24 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-[#A9AEFF]">Comment ça marche</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            De l&apos;inscription à votre première mission, en 4 étapes.
          </h2>
          <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <li key={p.title} className="relative rounded-[28px] border border-white/[0.07] bg-[#10173a]/70 p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#070b1f]">
                  {i + 1}
                </span>
                <p className="mt-10 text-lg font-semibold tracking-tight">{p.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
              </li>
            ))}
          </ol>
          <Link
            href={signup}
            className="mt-12 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-[#070b1f] transition hover:bg-white/90"
          >
            Commencer mon inscription
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white px-5 py-24 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-[#5B50FF]">Questions fréquentes</p>
            <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#070b1f]">
              Tout savoir avant de vous lancer.
            </h2>
          </div>
          <div className="border-t border-black/[0.08]">
            {FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-white px-5 pb-24 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-[#070b1f] px-8 py-16 text-center text-white sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,131,255,0.45),transparent_62%)] blur-3xl" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
              Prêt à rejoindre le réseau Byound ?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-white/60">
              Créez votre profil en quelques minutes et accédez immédiatement à votre espace expert.
            </p>
            <Link
              href={signup}
              className="mt-10 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-semibold text-[#070b1f] transition hover:bg-white/90"
            >
              Créer mon compte expert
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
