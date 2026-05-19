"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FaqAccordion } from "@/components/edge-site/faq-accordion";
import { ParcoursInvestmentSection } from "@/components/edge-site/parcours-investment-section";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { parcoursHeroImage } from "@/lib/parcours-builders";
import type { Parcours } from "@/lib/parcours";
import { cn } from "@/lib/utils";

const LIVRABLE_PLACEHOLDERS = [
  { bg: "#1a1816", labelClass: "text-white/30" },
  { bg: "#f0ece6", labelClass: "text-black/30" },
  { bg: "#1a1816", labelClass: "text-white/30" },
  { bg: "#f0ece6", labelClass: "text-black/30" },
] as const;

const PROFILE_ICONS: ReactNode[] = [
  <svg key="0" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
    <path d="M4 16L16 4M16 4H8M16 4V12" />
  </svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
    <path d="M4 10a6 6 0 1 1 2 4.5" />
    <path d="M4 14.5V10h4.5" />
  </svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
    <circle cx="10" cy="6" r="2.5" />
    <path d="M5 16c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    <circle cx="4" cy="8" r="2" />
    <path d="M1 16c0-2 1.3-3.6 3-4" />
    <circle cx="16" cy="8" r="2" />
    <path d="M19 16c0-2-1.3-3.6-3-4" />
  </svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#0a0a0a" strokeWidth="1.5" aria-hidden>
    <path d="M12 2L4 11h6l-2 7 8-9h-6l2-7z" />
  </svg>,
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function heroTitleLines(parcours: Parcours): string {
  const raw = parcours.titreMarketing ?? parcours.titre;
  const dot = raw.indexOf(". ");
  if (dot > 0 && dot < raw.length - 2) {
    return `${raw.slice(0, dot + 1)}\n${raw.slice(dot + 2)}`;
  }
  return raw;
}

type Props = { parcours: Parcours };

export function ParcoursNarrativePage({ parcours }: Props) {
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());
  const [stickyVisible, setStickyVisible] = useState(false);
  const [heroError, setHeroError] = useState(false);

  const postulerHref = EDGE_HREFS.postuler(parcours.slug);
  const heroSrc = parcours.imageUrl ?? parcoursHeroImage(parcours.slug);
  const moduleCount = parcours.modules.length;
  const hoursNum = parcours.duree.replace(/[^0-9]/g, "") || parcours.duree;
  const profils = parcours.profils ?? [];
  const avantApres = parcours.avantApres;
  const faqItems = (parcours.faq ?? []).map((f) => ({ q: f.q, a: f.r }));
  const livrables = parcours.livrables.slice(0, 4);

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
      <section className="relative flex min-h-[90vh] flex-col">
        {!heroError ? (
          <Image
            src={heroSrc}
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            onError={() => setHeroError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-[#1a1816]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-10 py-16 text-center">
          <div className="flex max-w-3xl flex-col items-center px-5">
            <p className="mb-6 text-[11px] text-white/30">
              <Link href={EDGE_HREFS.parcours} className="transition-colors hover:text-white/50">
                Parcours
              </Link>
              <span className="mx-1.5">→</span>
              <span>{parcours.familleLabel}</span>
            </p>
            <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">
              {parcours.familleLabel}
            </p>
            <h1 className="mt-4 whitespace-pre-line text-[clamp(2.25rem,6vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
              {heroTitleLines(parcours)}
            </h1>
            <p className="mx-auto mt-6 max-w-[440px] text-[15px] leading-relaxed text-white/[0.45]">
              {parcours.promesse ?? parcours.description}
            </p>
            <p className="mt-4 text-center text-[12px] text-white/30">
              {parcours.duree} · Open Badge IMS Global · Certifié Beyond
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
            <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-4 sm:py-5">
              <span className="text-[13px] font-medium text-white">{moduleCount}</span>
              <span className="text-[13px] text-white/40">modules</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-4 sm:py-5">
              <span className="text-[13px] font-medium text-white">{hoursNum}</span>
              <span className="text-[13px] text-white/40">heures</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-0.5 px-4 py-4 sm:py-5">
              <span className="text-[13px] font-medium text-white">Open Badge</span>
              <span className="text-[13px] text-white/40">IMS Global</span>
            </div>
          </div>
        </div>
      </section>

      {profils.length > 0 ? (
        <section
          id="prerequis"
          className="relative z-10 border-t border-black/[0.06] bg-[#f5f5f3] px-10 py-[64px]"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-medium text-edge-black">À qui s&apos;adresse ce parcours</h2>
            <div className="mt-10 grid grid-cols-2 gap-0.5 sm:grid-cols-4">
              {profils.map((profile, i) => (
                <div key={profile.titre} className="border border-black/[0.06] bg-white px-6 py-7">
                  <span className="mb-4 block">{PROFILE_ICONS[i % PROFILE_ICONS.length]}</span>
                  <p className="text-[13px] font-medium text-edge-black">{profile.titre}</p>
                  <p className="mt-2 whitespace-pre-line text-[12px] leading-[1.6] text-black/45">
                    {profile.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative z-10 flex min-h-[50vh] flex-col items-center justify-center bg-white px-10 py-20 text-center">
        <p className="text-[clamp(5rem,18vw,7.5rem)] font-medium leading-none text-edge-black">
          {moduleCount}
        </p>
        <p className="mt-4 text-lg text-black/40">modules. Un seul objectif.</p>
        <p className="mt-2 max-w-md text-sm text-black/30">{parcours.promesse ?? parcours.description}</p>
      </section>

      <section id="programme" className="bg-white">
        <div className="grid min-h-[400px] border-t border-black/[0.06] lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col justify-center px-10 py-12 lg:py-16 lg:pr-12">
            <p className="text-[10px] font-normal uppercase tracking-[0.15em] text-edge-red">
              Programme · {moduleCount} modules
            </p>
            <h2 className="mt-6 max-w-[600px] text-[clamp(1.75rem,4vw,2.25rem)] font-medium leading-tight tracking-[-0.01em] text-edge-black">
              {parcours.titre}
            </h2>
            <ul className="mt-10 max-w-2xl">
              {parcours.modules.map((mod, i) => (
                <li
                  key={mod.code}
                  className="border-b border-black/[0.06] py-3 text-[15px] text-edge-black last:border-b-0"
                >
                  <span className="font-mono text-[13px] text-edge-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mx-2 text-black/20">·</span>
                  {mod.titre}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[280px] bg-[#1a1816] lg:min-h-[400px]">
            {!heroError ? (
              <Image
                src={heroSrc}
                alt=""
                fill
                className="object-cover object-center"
                sizes="40vw"
                onError={() => setHeroError(true)}
              />
            ) : null}
          </div>
        </div>
      </section>

      {avantApres ? (
        <section className="bg-edge-black px-10 py-[64px]">
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-2 lg:gap-0">
            <div className="lg:border-r lg:border-white/[0.08] lg:pr-10">
              <p className="text-[10px] uppercase text-white/25">Tu arrives avec</p>
              <h3 className="mt-3 text-lg font-medium text-white">Ce qui te freine aujourd&apos;hui</h3>
              <ul className="mt-6 space-y-0">
                {avantApres.avant.map((item) => (
                  <li key={item} className="text-[13px] leading-[1.9] text-white/40">
                    <span className="text-white/20">· </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:pl-10">
              <p className="text-[10px] uppercase text-edge-red">Tu repars avec</p>
              <h3 className="mt-3 text-lg font-medium text-white">Ce que tu maîtrises</h3>
              <ul className="mt-6 space-y-0">
                {avantApres.apres.map((item) => (
                  <li key={item} className="text-[13px] leading-[1.9] text-white/80">
                    <span className="text-edge-red">→ </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {parcours.expert ? (
        <section className="flex min-h-[40vh] flex-col items-center justify-center bg-edge-black px-10 py-16 text-center">
          <blockquote className="max-w-[640px] font-serif text-[clamp(1.25rem,3vw,1.75rem)] italic leading-[1.4] text-white/[0.8]">
            &ldquo;{parcours.expert.citation}&rdquo;
          </blockquote>
          <p className="mt-5 text-[12px] text-white/30">
            — {parcours.expert.nom}, {parcours.expert.titre} · {parcours.expert.institution}
          </p>
        </section>
      ) : null}

      {livrables.length > 0 ? (
        <section className="bg-white px-10 py-20 sm:py-[80px]">
          <h2 className="mb-20 text-center text-[clamp(2rem,4vw,2.5rem)] font-medium text-edge-black">
            Ce que tu vas produire.
          </h2>
          {livrables.map((titre, i) => {
            const ph = LIVRABLE_PLACEHOLDERS[i % LIVRABLE_PLACEHOLDERS.length];
            const reverse = i % 2 === 1;
            const num = String(i + 1).padStart(2, "0");
            return (
              <div
                key={titre}
                className={cn(
                  "grid min-h-[400px] border-t border-black/[0.06] lg:grid-cols-2",
                  reverse && "lg:[&>div:first-child]:order-2",
                )}
              >
                <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-12">
                  <p className="absolute right-6 top-6 text-[80px] font-medium leading-none text-edge-red/10 lg:right-10 lg:top-10">
                    {num}
                  </p>
                  <h3 className="pr-16 text-2xl font-medium text-edge-black lg:pr-24">{titre}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-black/45">
                    Livrable évalué et intégré à ton Open Badge.
                  </p>
                </div>
                <div
                  className="relative flex aspect-[4/3] min-h-[200px] items-center justify-center"
                  style={{ backgroundColor: ph.bg }}
                >
                  <p className={cn("px-6 text-center text-[11px] italic", ph.labelClass)}>{titre}</p>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <ParcoursInvestmentSection
        parcours={parcours}
        selectedAddons={selectedAddons}
        onToggleAddon={toggleAddon}
      />

      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-edge-black px-10 py-20 text-center">
        <p className="mb-5 text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">
          Open Badge IMS Global
        </p>
        <div
          className="mx-auto mb-7 h-[140px] w-[140px] rounded-lg border border-edge-red/30 bg-white/[0.04]"
          aria-hidden
        />
        <p className="text-lg font-medium text-white">{parcours.badge}</p>
        <ul className="mt-6 space-y-1 text-[13px] leading-loose text-white/40">
          <li>· Vérifiable en un clic sur LinkedIn</li>
          <li>· Pointe vers tes livrables réels</li>
          <li>· Signé cryptographiquement — infalsifiable</li>
        </ul>
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 divide-x divide-white/[0.08] bg-white/[0.04] text-left">
          <div className="px-6 py-6">
            <p className="text-[10px] font-normal uppercase tracking-[0.15em] text-white/30">
              Attestation classique
            </p>
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

      {parcours.expert ? (
        <section className="grid min-h-[480px] bg-white lg:grid-cols-2">
          <div className="relative min-h-[280px] bg-[#e8e4de] lg:min-h-[480px]">
            <Image
              src={parcours.expert.image}
              alt={parcours.expert.nom}
              fill
              className="object-cover object-top"
              sizes="50vw"
            />
          </div>
          <div className="flex flex-col justify-center px-10 py-12 sm:px-12 lg:px-12 lg:py-16">
            <p className="mb-5 text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">
              Expert associé
            </p>
            <blockquote className="font-serif text-[22px] italic leading-snug text-edge-black">
              &ldquo;{parcours.expert.citation}&rdquo;
            </blockquote>
            <p className="mt-6 text-lg font-medium text-edge-black">{parcours.expert.nom}</p>
            <p className="mt-1 text-[13px] text-black/40">
              {parcours.expert.titre} · {parcours.expert.institution}
            </p>
          </div>
        </section>
      ) : null}

      {faqItems.length > 0 ? (
        <section className="bg-white px-10 py-[64px]">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-[32px] font-medium text-edge-black">Tes questions.</h2>
            <FaqAccordion items={faqItems} icon="chevron" defaultOpen={null} />
          </div>
        </section>
      ) : null}

      <section className="bg-edge-red px-10 py-20 text-center">
        <h2 className="text-[clamp(2rem,4vw,2.5rem)] font-medium text-white">Prêt à performer ?</h2>
        <p className="mt-4 text-[15px] text-white/70">Candidature gratuite. Réponse sous 48h.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={postulerHref}
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

      {stickyVisible ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-edge-black px-10 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-[13px] text-white">{parcours.titreMarketing ?? parcours.titre}</p>
              <p className="text-[11px] text-white/30">
                {parcours.duree} · Open Badge
              </p>
            </div>
            <Link
              href={postulerHref}
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
