"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  COMMERCIAL_IA_AUDIENCE,
  COMMERCIAL_IA_FAQ,
  COMMERCIAL_IA_HERO_SUBTITLE,
  COMMERCIAL_IA_LIVRABLES,
  COMMERCIAL_IA_MODULE_IA_TITLE,
  COMMERCIAL_IA_TRANSFORMATION,
} from "@/lib/edge-site/commercial-ia-copy";
import { CommercialIaInvestmentSection } from "@/components/edge-site/commercial-ia-investment-section";
import { FaqAccordion } from "@/components/edge-site/faq-accordion";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { cn } from "@/lib/utils";

const PARCOURS_SLUG = "commercial-ia";
const POSTULER_HREF = EDGE_HREFS.postuler(PARCOURS_SLUG);
const HERO_IMAGE = "/images/parcours-commercial-ia.jpg";
const EXPERT_IMAGE = "/images/expert-farina.jpg";

const MODULE_BLOCKS = [
  {
    label: "MODULES 01 → 05 · IA & AUTOMATISATION",
    startNum: 1,
    visual: "image" as const,
    title: COMMERCIAL_IA_MODULE_IA_TITLE,
    modules: [
      "Comprendre l'IA : ce que c'est, ce que ce n'est pas",
      "Écrire de bons prompts : les bases du prompt engineering",
      "Utiliser l'IA pour la prospection commerciale",
      "Automatiser son CRM et son reporting commercial",
      "IA et personnalisation de la relation client",
    ],
  },
  {
    label: "MODULES 06 → 10 · NÉGOCIATION",
    startNum: 6,
    visual: "stat" as const,
    title: "Tu négocies. Vraiment.\nPas des cas fictifs — des situations réelles.",
    modules: [
      "Les bases de la négociation : positions vs intérêts",
      "Préparer une négociation : enjeux, alternatives, BATNA",
      "Assertivité : s'affirmer sans s'imposer",
      "Négocier en situation de tension ou de conflit",
      "Gérer les objections avec calme et précision",
    ],
  },
  {
    label: "MODULES 11 → 13 · COMPORTEMENT",
    startNum: 11,
    visual: "quote" as const,
    title: "Tu lis tes interlocuteurs\navant même qu'ils parlent.",
    modules: [
      "Lire le comportement de ses interlocuteurs",
      "Analyse comportementale appliquée à la vente",
      "Écouter vraiment : l'écoute active",
    ],
  },
] as const;

const LIVRABLE_PLACEHOLDERS = [
  { bg: "#1a1816", label: "Capture séquence LinkedIn", labelClass: "text-white/30" },
  { bg: "#f0ece6", label: "Simulation négociation", labelClass: "text-black/30" },
  { bg: "#1a1816", label: "Pipeline CRM", labelClass: "text-white/30" },
  { bg: "#f0ece6", label: "Analyse comportementale", labelClass: "text-black/30" },
] as const;

const LIVRABLES = COMMERCIAL_IA_LIVRABLES.map((l, i) => ({
  ...l,
  ...LIVRABLE_PLACEHOLDERS[i],
  reverse: i % 2 === 1,
}));

const HERO_STATS = [
  { value: "13", label: "modules" },
  { value: "45", label: "heures" },
  { value: "Open Badge", label: "IMS Global" },
] as const;

function ModuleVisual({ visual }: { visual: (typeof MODULE_BLOCKS)[number]["visual"] }) {
  if (visual === "image") {
    return (
      <div className="relative min-h-[280px] lg:min-h-[400px]">
        <Image src={HERO_IMAGE} alt="" fill className="object-cover object-center" sizes="40vw" />
      </div>
    );
  }
  if (visual === "stat") {
    return (
      <div className="flex min-h-[280px] items-center justify-center bg-edge-black px-8 text-center lg:min-h-[400px]">
        <p className="max-w-sm text-lg italic leading-relaxed text-white/60">
          73% des commerciaux perdent en négociation faute de préparation.
        </p>
      </div>
    );
  }
  return (
    <div className="flex min-h-[280px] items-center justify-center bg-[#141412] px-8 text-center lg:min-h-[400px]">
      <blockquote className="max-w-sm font-serif text-lg italic leading-relaxed text-white/70">
        &ldquo;La différence entre un bon commercial et un excellent — c&apos;est ce qu&apos;il fait quand
        l&apos;autre ne parle pas.&rdquo;
      </blockquote>
    </div>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const AUDIENCE_PROFILE_ICONS: Record<
  (typeof COMMERCIAL_IA_AUDIENCE.profiles)[number]["id"],
  ReactNode
> = {
  poste: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
      <path d="M4 16L16 4M16 4H8M16 4V12" />
    </svg>
  ),
  reconversion: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
      <path d="M4 10a6 6 0 1 1 2 4.5" />
      <path d="M4 14.5V10h4.5" />
    </svg>
  ),
  manager: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
      <circle cx="10" cy="6" r="2.5" />
      <path d="M5 16c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="4" cy="8" r="2" />
      <path d="M1 16c0-2 1.3-3.6 3-4" />
      <circle cx="16" cy="8" r="2" />
      <path d="M19 16c0-2-1.3-3.6-3-4" />
    </svg>
  ),
  entrepreneur: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
      <path d="M12 2L4 11h6l-2 7 8-9h-6l2-7z" />
    </svg>
  ),
};

export function CommercialIaNarrativePage() {
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [stickyVisible, setStickyVisible] = useState(false);


  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <article className={cn("font-sans text-edge-black antialiased", stickyVisible && "pb-20")}>
      {/* §1 Hero */}
      <section className="relative flex min-h-[90vh] flex-col">
        <Image src={HERO_IMAGE} alt="" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-10 py-16 text-center">
          <div className="flex max-w-3xl flex-col items-center px-5">
          <p className="mb-6 text-[11px] text-white/30">
            <Link href={EDGE_HREFS.parcours} className="transition-colors hover:text-white/50">
              Parcours
            </Link>
            <span className="mx-1.5">→</span>
            <span>Performance commerciale</span>
          </p>
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Performance commerciale</p>
          <h1 className="mt-4 whitespace-pre-line text-[clamp(2.25rem,6vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
            Commercial{"\n"}Augmenté par l&apos;IA.
          </h1>
          <p className="mx-auto mt-6 max-w-[440px] text-[15px] leading-relaxed text-white/[0.45]">
            {COMMERCIAL_IA_HERO_SUBTITLE}
          </p>
          <p className="mt-4 text-center text-[12px] text-white/30">
            45h · Open Badge IMS Global · Certifié Beyond
          </p>
          <button
            type="button"
            onClick={() => scrollToId("programme")}
            className="mt-8 rounded-full border border-white px-8 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Voir le programme ↓
          </button>
          </div>
        </div>
        <div className="relative z-[1] w-full border-t border-white/10 bg-black/60">
          <div className="mx-auto flex max-w-4xl divide-x divide-white/10">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-1 flex-col items-center gap-0.5 px-4 py-4 sm:py-5">
                <span className="text-[13px] font-medium text-white">{stat.value}</span>
                <span className="text-[13px] text-white/40">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §2 À qui s'adresse ce parcours */}
      <section
        id="prerequis"
        className="relative z-10 border-t border-black/[0.06] bg-[#f5f5f3] px-10 py-[64px]"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-medium text-edge-black">{COMMERCIAL_IA_AUDIENCE.title}</h2>
          <div className="mt-10 grid grid-cols-4 gap-0.5">
            {COMMERCIAL_IA_AUDIENCE.profiles.map((profile) => (
              <div
                key={profile.id}
                className="border border-black/[0.06] bg-white px-6 py-7"
              >
                <span className="mb-4 block">{AUDIENCE_PROFILE_ICONS[profile.id]}</span>
                <p className="text-[13px] font-medium text-edge-black">{profile.title}</p>
                <p className="mt-2 whitespace-pre-line text-[12px] leading-[1.6] text-black/45">
                  {profile.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §3 Stat */}
      <section className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center bg-white px-10 py-20 text-center">
        <p className="text-[clamp(5rem,18vw,7.5rem)] font-medium leading-none text-edge-black">13</p>
        <p className="mt-4 text-lg text-black/40">modules. Un seul objectif.</p>
        <p className="mt-2 text-sm text-black/30">De la prospection IA au closing — tout est terrain réel.</p>
      </section>

      {/* §3 Modules */}
      <section id="programme" className="bg-white">
        {MODULE_BLOCKS.map((block) => (
          <div
            key={block.label}
            className="grid min-h-[400px] border-t border-black/[0.06] lg:grid-cols-[3fr_2fr]"
          >
            <div className="flex flex-col justify-center px-10 py-12 lg:py-16 lg:pr-12">
              <p className="text-[10px] font-normal uppercase tracking-[0.15em] text-edge-red">{block.label}</p>
              <h2 className="mt-6 max-w-[600px] whitespace-pre-line text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-tight tracking-[-0.01em] text-edge-black">
                {block.title}
              </h2>
              <ul className="mt-10 max-w-2xl">
                {block.modules.map((mod, i) => (
                  <li
                    key={mod}
                    className="border-b border-black/[0.06] py-3 text-[15px] text-edge-black last:border-b-0"
                  >
                    <span className="font-mono text-[13px] text-edge-red">
                      {String(block.startNum + i).padStart(2, "0")}
                    </span>
                    <span className="mx-2 text-black/20">·</span>
                    {mod}
                  </li>
                ))}
              </ul>
            </div>
            <ModuleVisual visual={block.visual} />
          </div>
        ))}
      </section>

      {/* §4 Tu arrives / Tu repars avec */}
      <section className="bg-edge-black px-10 py-[64px]">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-0">
          <div className="lg:border-r lg:border-white/[0.08] lg:pr-10">
            <p className="text-[10px] uppercase text-white/25">{COMMERCIAL_IA_TRANSFORMATION.before.label}</p>
            <h3 className="mt-3 text-lg font-medium text-white">
              {COMMERCIAL_IA_TRANSFORMATION.before.title}
            </h3>
            <ul className="mt-6 space-y-0">
              {COMMERCIAL_IA_TRANSFORMATION.before.items.map((item) => (
                <li key={item} className="text-[13px] leading-[1.9] text-white/40">
                  <span className="text-white/20">· </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pl-10">
            <p className="text-[10px] uppercase text-edge-red">{COMMERCIAL_IA_TRANSFORMATION.after.label}</p>
            <h3 className="mt-3 text-lg font-medium text-white">{COMMERCIAL_IA_TRANSFORMATION.after.title}</h3>
            <ul className="mt-6 space-y-0">
              {COMMERCIAL_IA_TRANSFORMATION.after.items.map((item) => (
                <li key={item} className="text-[13px] leading-[1.9] text-white/80">
                  <span className="text-edge-red">→ </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* §5 Citation */}
      <section className="flex min-h-[40vh] flex-col items-center justify-center bg-edge-black px-10 py-16 text-center">
        <blockquote className="max-w-[640px] whitespace-pre-line font-serif text-[clamp(1.25rem,3vw,1.75rem)] italic leading-[1.4] text-white/[0.8]">
          {`"La différence entre un bon commercial\net un excellent — c'est ce qu'il fait\nquand l'autre ne parle pas."`}
        </blockquote>
        <p className="mt-5 text-[12px] text-white/30">— Miguel Farina, Head of Sales · Olympique Lyonnais</p>
      </section>

      {/* §5 Livrables */}
      <section className="bg-white px-10 py-20 sm:py-[80px]">
        <h2 className="mb-20 text-center text-[clamp(2rem,4vw,2.5rem)] font-medium text-edge-black">
          Ce que tu vas produire.
        </h2>
        {LIVRABLES.map((l) => (
          <div
            key={l.num}
            className={cn(
              "grid min-h-[400px] border-t border-black/[0.06] lg:grid-cols-2",
              l.reverse && "lg:[&>div:first-child]:order-2",
            )}
          >
            <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
              <p className="absolute right-6 top-6 text-[80px] font-medium leading-none text-edge-red/10 lg:right-10 lg:top-10">
                {l.num}
              </p>
              <h3 className="pr-16 text-2xl font-medium text-edge-black lg:pr-24">{l.titre}</h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45">{l.description}</p>
            </div>
            <div
              className="relative flex aspect-[4/3] min-h-[200px] items-center justify-center"
              style={{ backgroundColor: l.bg }}
            >
              <p className={cn("px-6 text-center text-[11px] italic", l.labelClass)}>
                {l.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      <CommercialIaInvestmentSection selectedAddons={selectedAddons} onToggleAddon={toggleAddon} />

      {/* §7 Open Badge */}
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-edge-black px-10 py-20 text-center">
        <p className="mb-5 text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Open Badge IMS Global</p>
        <div
          className="mx-auto mb-7 h-[140px] w-[140px] rounded-lg border border-edge-red/30 bg-white/[0.04]"
          aria-hidden
        />
        <p className="text-lg font-medium text-white">Commercial Augmenté par l&apos;IA — Certifié Beyond</p>
        <ul className="mt-6 space-y-1 text-[13px] leading-loose text-white/40">
          <li>· Vérifiable en un clic sur LinkedIn</li>
          <li>· Pointe vers tes livrables réels</li>
          <li>· Signé cryptographiquement — infalsifiable</li>
        </ul>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 divide-x divide-white/[0.08] bg-white/[0.04] text-left">
          <div className="px-6 py-6">
            <p className="text-[10px] font-normal uppercase tracking-[0.15em] text-white/30">Attestation classique</p>
            <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-white/30">
              <li className="line-through">· Prouve que tu étais présent</li>
              <li className="line-through">· Non vérifiable</li>
              <li className="line-through">· Aucune preuve de compétence</li>
            </ul>
          </div>
          <div className="px-6 py-6">
            <p className="text-[10px] font-normal uppercase tracking-[0.15em] text-edge-red">Open Badge EDGE</p>
            <ul className="mt-4 space-y-2 text-[12px] leading-relaxed text-white/70">
              <li>· Prouve ce que tu sais faire</li>
              <li>· Vérifiable en 1 clic sur LinkedIn</li>
              <li>· Pointe vers tes livrables réels</li>
            </ul>
          </div>
        </div>
      </section>

      {/* §8 Expert */}
      <section className="grid min-h-[480px] bg-white lg:grid-cols-2">
        <div className="relative min-h-[280px] bg-[#e8e4de] lg:min-h-[480px]">
          <Image src={EXPERT_IMAGE} alt="Miguel Farina" fill className="object-cover object-top" sizes="50vw" />
        </div>
        <div className="flex flex-col justify-center px-10 py-12 sm:px-12 lg:px-12 lg:py-16">
          <p className="mb-5 text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Expert associé</p>
          <blockquote className="font-serif text-[22px] italic leading-snug text-edge-black">
            &ldquo;J&apos;ai construit ce parcours sur ce que les clubs et les PME cherchent vraiment — pas sur ce
            que les écoles pensent qu&apos;elles cherchent.&rdquo;
          </blockquote>
          <p className="mt-6 text-lg font-medium text-edge-black">Miguel Farina</p>
          <p className="mt-1 text-[13px] text-black/40">Head of Sales · Olympique Lyonnais</p>
        </div>
      </section>

      {/* §9 FAQ */}
      <section className="bg-white px-10 py-[64px]">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-[32px] font-medium text-edge-black">Tes questions.</h2>
          <FaqAccordion items={COMMERCIAL_IA_FAQ} icon="chevron" defaultOpen={null} />
        </div>
      </section>

      {/* §10 CTA final */}
      <section className="bg-edge-red px-10 py-20 text-center">
        <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-medium text-white">Prêt à performer ?</h2>
        <p className="mt-4 text-[15px] text-white/70">Candidature gratuite. Réponse sous 48h.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={POSTULER_HREF}
            className="inline-flex rounded-full bg-white px-8 py-2.5 text-[13px] font-medium text-edge-red transition-opacity hover:opacity-90"
          >
            {EDGE_CTA_LABELS.apply}
          </Link>
          <a
            href="mailto:contact@edgebs.fr"
            className="inline-flex rounded-full border border-white px-8 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-white/10"
          >
            Poser une question
          </a>
        </div>
      </section>

      {/* Sticky CTA */}
      {stickyVisible ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-edge-black px-10 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[13px] text-white">Commercial Augmenté par l&apos;IA</p>
              <p className="text-[11px] text-white/30">45h · Open Badge</p>
            </div>
            <Link
              href={POSTULER_HREF}
              className="font-sf-pro-bold shrink-0 rounded-full bg-edge-red px-6 py-2.5 text-[14px] text-white transition-opacity hover:opacity-90"
            >
              {EDGE_CTA_LABELS.apply}
            </Link>
          </div>
        </div>
      ) : null}
    </article>
  );
}
