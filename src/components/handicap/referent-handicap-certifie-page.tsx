"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  GraduationCap,
  HeartHandshake,
  Medal,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NAVY = "#1B3A5C";
const TEAL = "#028090";
const SAGE = "#84B59F";
const MINT = "#C8E6DA";
const GOLD = "#F0A500";
const BG = "#F7FAFB";
const TEXT = "#1E293B";

const PROGRAM_BLOCKS = [
  {
    key: "bloc1",
    title: "BLOC 1 — Comprendre les profils",
    meta: "Socle obligatoire · 4 modules · ~15 h",
    accent: "#028090",
    modules: [
      "Troubles dys : dyslexie, dysorthographie, dyscalculie — Définition, origines neurologiques, manifestations, regard inclusif",
      "Comprendre le TDAH — Les 3 présentations, impacts sur les apprentissages et le travail, forces associées",
      "Le spectre autistique (TSA & Asperger) — Spécificités cognitives et sensorielles, besoins, erreurs d'interprétation à éviter",
      "Les fonctions exécutives — 8 fonctions, déficits associés aux troubles, stratégies de remédiation",
    ],
  },
  {
    key: "bloc2",
    title: "BLOC 2 — Adapter & accompagner",
    meta: "3 modules · ~12 h",
    accent: "#1C7293",
    modules: [
      "Stratégies d'apprentissage adaptées aux profils neuroatypiques — Outils de compensation, différenciation, plan d'accompagnement",
      "Évaluation psychopédagogique : outils, limites et éthique — Évaluation structurée, limites légales, compte-rendu actionnable",
      "Construire un plan d'accompagnement personnalisé — Protocole complet, coordination pluridisciplinaire, mesure des progrès",
    ],
  },
  {
    key: "bloc3",
    title: "BLOC 3 — Communiquer & coordonner",
    meta: "5 modules · ~20 h",
    accent: "#84B59F",
    modules: [
      "Écouter vraiment : l'écoute active — Silence, reformulation, relance en situation d'accompagnement",
      "Communication non-violente (CNV) — 4 composantes, observation factuelle, expression des besoins, demande claire",
      "Développer son empathie en contexte professionnel — Écoute sans jugement, décentration, empathie comme levier de résolution",
      "Comportement sous stress et situations difficiles — Comportements de stress par profil, désamorçage des tensions",
      "Manager des profils différents — Niveaux d'autonomie, styles adaptés, diversité cognitive, biais de projection",
    ],
  },
  {
    key: "bloc4",
    title: "BLOC 4 — Sensibiliser & piloter",
    meta: "4 modules · ~15 h",
    accent: "#50808E",
    modules: [
      "Fondements de l'analyse comportementale — Bases scientifiques, modèles DISC/Big Five, automatismes comportementaux",
      "Adapter sa communication selon le profil — Registre, rythme, vocabulaire selon le profil — grille d'adaptation des 4 profils",
      "Recrutement inclusif — Offre inclusive, sourcing adapté, éviter les biais inconscients dès la sélection",
      "Onboarding inclusif — Parcours d'intégration structuré, prévenir le turnover précoce lié au handicap",
    ],
  },
] as const;

const OBJECTIFS = [
  "Identifier et comprendre les profils neuroatypiques (dys, TDAH, TSA) et leurs impacts sur les apprentissages et le travail",
  "Évaluer les besoins d'un apprenant ou collaborateur en situation de handicap et construire un plan d'accompagnement personnalisé",
  "Adapter ses pratiques pédagogiques et ses outils de compensation aux différents profils",
  "Conduire un entretien de guidance ou d'accompagnement avec une posture éthique et bienveillante",
  "Communiquer avec empathie et sans violence dans des situations complexes ou tendues",
  "Sensibiliser les équipes et piloter une démarche inclusive au sein de son organisation",
];

function SectionReveal({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { threshold: 0.06, rootMargin: "0px 0px -32px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "scroll-mt-24 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className,
      )}
    >
      {children}
    </section>
  );
}

export default function ReferentHandicapPage() {
  const [progTab, setProgTab] = useState(0);
  const active = PROGRAM_BLOCKS[progTab];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG, color: TEXT }}>
      {/* HERO */}
      <section
        className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 md:pb-28 md:pt-20"
        style={{ backgroundColor: NAVY }}
      >
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full opacity-[0.12]" style={{ backgroundColor: TEAL }} />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rotate-12 rounded-3xl opacity-[0.08]" style={{ backgroundColor: MINT }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex flex-wrap items-center justify-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
              style={{ backgroundColor: `${TEAL}cc` }}
            >
              Parcours certifiant
            </span>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: `${GOLD}33`, color: GOLD }}
            >
              Beyond LMS
            </span>
          </div>
          <h1 className="text-balance text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            Référent Handicap Certifié Beyond
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-white/85 sm:text-lg">
            Le seul parcours qui combine neurosciences cliniques et outils pratiques pour agir au quotidien.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {[
              { label: "4 blocs", Icon: Sparkles },
              { label: "14 modules", Icon: GraduationCap },
              { label: "~60h · 100% en ligne", Icon: BadgeCheck },
            ].map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {label}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              className="w-full rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 sm:w-auto"
              style={{ backgroundColor: TEAL }}
            >
              Démarrer le parcours
            </button>
            <a
              href="#programme"
              className="text-sm font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline"
            >
              Voir le programme complet ↓
            </a>
          </div>
        </div>
      </section>

      {/* POUR QUI */}
      <SectionReveal className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
          À qui s&apos;adresse ce parcours ?
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Référents handicap",
              desc: "Entreprises, structures OETH soumises à l'obligation légale d'emploi",
              Icon: HeartHandshake,
            },
            {
              title: "Coordinateurs pédagogiques",
              desc: "CFA, lycées professionnels, universités, centres de formation",
              Icon: GraduationCap,
            },
            {
              title: "Formateurs référents",
              desc: "En charge du suivi individualisé d'apprenants à besoins spécifiques",
              Icon: Users,
            },
            {
              title: "Responsables RH & inclusivité",
              desc: "RRH et DRH structurant leur démarche handicap et diversité",
              Icon: Building2,
            },
          ].map(({ title, desc, Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <Icon className="h-8 w-8" style={{ color: TEAL }} aria-hidden />
              <h3 className="mt-4 text-lg font-semibold" style={{ color: NAVY }}>
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </SectionReveal>

      {/* OBJECTIFS */}
      <SectionReveal className="border-y border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
            Ce que vous saurez faire
          </h2>
          <ul className="mt-12 space-y-4">
            {OBJECTIFS.map((text) => (
              <li key={text.slice(0, 48)} className="flex gap-3 rounded-xl bg-[#F7FAFB] p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0" style={{ color: TEAL }} aria-hidden />
                <span className="text-sm leading-relaxed md:text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </SectionReveal>

      {/* PROGRAMME */}
      <SectionReveal id="programme" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
          Le programme
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 md:text-base">
          4 blocs progressifs · 14 modules · ~60 heures
        </p>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {PROGRAM_BLOCKS.map((b, i) => (
            <button
              key={b.key}
              type="button"
              onClick={() => setProgTab(i)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-xs font-semibold transition sm:min-w-[140px] sm:text-center md:text-sm",
                progTab === i ? "border-transparent text-white shadow-md" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              )}
              style={progTab === i ? { backgroundColor: b.accent } : undefined}
            >
              <span className="block opacity-90">{b.title.split(" — ")[0]}</span>
              <span className="mt-1 block text-[10px] font-normal opacity-80 md:text-xs">{b.meta}</span>
            </button>
          ))}
        </div>

        <div
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          style={{ borderTopWidth: 4, borderTopColor: active.accent }}
        >
          <h3 className="text-lg font-bold md:text-xl" style={{ color: NAVY }}>
            {active.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{active.meta}</p>
          <ul className="mt-6 space-y-4">
            {active.modules.map((m) => (
              <li key={m.slice(0, 40)} className="flex gap-3 border-l-4 pl-4 text-sm leading-relaxed md:text-base" style={{ borderColor: active.accent }}>
                {m}
              </li>
            ))}
          </ul>
        </div>

        {/* Accordéon mobile-friendly : tous les blocs repliables */}
        <details className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 md:hidden">
          <summary className="flex cursor-pointer items-center justify-between font-semibold text-slate-800">
            Voir tous les blocs (accordéon)
            <ChevronDown className="h-5 w-5 text-slate-500" />
          </summary>
          <div className="mt-4 space-y-6 border-t border-slate-100 pt-4">
            {PROGRAM_BLOCKS.map((b) => (
              <div key={b.key}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: b.accent }}>
                  {b.title}
                </p>
                <ul className="mt-2 space-y-2 text-xs text-slate-600">
                  {b.modules.map((m) => (
                    <li key={m.slice(0, 30)}>• {m}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </SectionReveal>

      {/* MODALITÉS */}
      <SectionReveal className="border-t border-slate-200/80 bg-[#F7FAFB] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
            Comment ça fonctionne ?
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-lg font-semibold" style={{ color: TEAL }}>
                Format 100% en ligne
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  "Accès permanent au contenu après inscription",
                  "Progression à son rythme, sans contrainte d'agenda",
                  "Hébergé sur la plateforme Beyond LMS",
                  "Compatible mobile, tablette et desktop",
                  "Durée estimée : 50 à 60 heures de formation",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
              <h3 className="text-lg font-semibold" style={{ color: NAVY }}>
                Types de livrables
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {[
                  "QCM automatique — Score minimum 75% requis",
                  "Dépôt PDF — Études de cas, plans, analyses rédigés",
                  "Enregistrement audio — Restitutions orales 3 à 4 min",
                  "Vidéo de présentation — Face caméra, 5 à 8 min",
                  "Session Q&R IA — Questions orales évaluées en temps réel",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* CERTIFICATION */}
      <SectionReveal className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl" style={{ color: NAVY }}>
          Votre certification
        </h2>
        <div
          className="mt-10 rounded-3xl px-8 py-10 text-center text-white shadow-xl md:px-12 md:py-12"
          style={{ backgroundColor: NAVY }}
        >
          <Medal className="mx-auto h-14 w-14" style={{ color: GOLD }} aria-hidden />
          <p className="mt-6 text-xl font-bold md:text-2xl">Référent Handicap Certifié Beyond</p>
          <p className="mt-2 text-sm italic text-white/80">Open Badge IMS Global · 1EdTech v2.0+</p>
          <div className="mt-8 flex flex-col gap-3 text-sm text-white/90 sm:items-center">
            <span className="inline-flex items-center gap-2">
              <Award className="h-4 w-4" style={{ color: GOLD }} aria-hidden />
              Partageable LinkedIn en 1 clic
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4" style={{ color: GOLD }} aria-hidden />
              Vérifiable publiquement
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: GOLD }} aria-hidden />
              Valide 3 ans · Renouvelable
            </span>
          </div>
        </div>
        <p className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-xs leading-relaxed text-slate-600 md:text-sm">
          <strong className="text-slate-800">Conditions d&apos;obtention :</strong> 4 blocs validés · Score ≥ 75% à chaque
          évaluation · Tous les livrables soumis et approuvés
        </p>
      </SectionReveal>

      {/* CTA FINAL */}
      <section className="px-4 py-20 sm:px-6" style={{ backgroundColor: TEAL }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Prêt à faire la différence ?</h2>
          <p className="mt-4 text-sm text-white/90 md:text-base">
            Rejoignez les référents handicap qui agissent avec méthode et légitimité.
          </p>
          <button
            type="button"
            className="mt-8 w-full rounded-xl bg-white px-8 py-3.5 text-sm font-semibold shadow-lg transition hover:bg-slate-50 sm:w-auto"
            style={{ color: NAVY }}
          >
            Démarrer le parcours
          </button>
          <div className="mt-6">
            <Link href="/landing" className="text-sm font-semibold text-white underline-offset-4 hover:underline">
              En savoir plus sur Beyond →
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 bg-white px-4 py-6 text-center">
        <Link
          href="/dashboard/ecole/handicap/formations"
          className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          ← Retour aux formations handicap
        </Link>
      </div>
    </div>
  );
}
