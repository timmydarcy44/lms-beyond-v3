"use client";

import { useState } from "react";
import Link from "next/link";
import { GoogleReviewsSlider } from "@/components/jessica-contentin/google-reviews-slider";
import {
  BOOKING_URL,
  JESSICA_PROGRAMME_COLORS as C,
  type ProgrammeLandingContent,
} from "@/lib/jessica-contentin/programme-landing-content";

const serif = "var(--font-fraunces), 'Fraunces', Georgia, serif";

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="inline-block rounded-lg bg-[#c8a96e] px-8 py-4 text-[15.5px] font-semibold text-[#0d1b2e] no-underline transition hover:bg-[#b89658]"
    >
      {children}
    </a>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block rounded-lg border border-white/30 bg-transparent px-8 py-4 text-[15.5px] font-medium text-white no-underline transition hover:border-white/50"
    >
      {children}
    </a>
  );
}

function ProgrammeFAQ({ faqs }: { faqs: ProgrammeLandingContent["faqs"] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-b border-[#efeae0] py-5">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 border-none bg-transparent p-0 text-left font-medium text-[#0d1b2e]"
              aria-expanded={isOpen}
            >
              <span className="text-[16.5px]">{f.q}</span>
              <span
                className="shrink-0 text-xl text-[#a9854a] transition-transform duration-200"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                +
              </span>
            </button>
            {isOpen ? (
              <p className="mt-3.5 max-w-[640px] text-[15px] leading-relaxed text-[#6b7280]">{f.a}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ProgrammeLandingPage({ content }: { content: ProgrammeLandingContent }) {
  return (
    <main className="text-[#2d3748]" style={{ background: C.creme, fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 pb-[100px] pt-[120px] text-white"
        style={{ background: `linear-gradient(180deg, ${C.marine} 0%, ${C.marineLight} 100%)` }}
      >
        <div className="relative z-[2] mx-auto max-w-[880px]">
          <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#c8a96e]">{content.eyebrow}</p>
          <h1
            className="mb-6 max-w-[720px] text-[clamp(32px,5vw,52px)] font-semibold leading-[1.15]"
            style={{ fontFamily: serif }}
          >
            {content.heroTitle}
          </h1>
          <p className="mb-10 max-w-[560px] text-[19px] leading-relaxed text-white/78">{content.heroSubtitle}</p>
          <div className="flex flex-wrap gap-4">
            <PrimaryButton href={BOOKING_URL}>Prendre rendez-vous</PrimaryButton>
            <SecondaryButton href="#comment-ca-se-deroule">Découvrir comment ça se déroule</SecondaryButton>
          </div>
        </div>
        <svg
          viewBox="0 0 800 300"
          className="pointer-events-none absolute -right-[100px] bottom-[-40px] z-[1] w-[600px] opacity-[0.12]"
          aria-hidden
        >
          <path d="M0,200 C150,120 300,260 450,150 C600,40 700,180 800,100" stroke={C.or} strokeWidth="3" fill="none" />
        </svg>
      </section>

      {/* Preuve */}
      <section className="px-6 py-20" style={{ background: C.creme }}>
        <div className="mx-auto max-w-[880px] text-center">
          <h2
            className="mb-12 text-[clamp(24px,3vw,32px)] font-semibold leading-snug text-[#0d1b2e]"
            style={{ fontFamily: serif }}
          >
            {content.preuveTitle}
          </h2>
          <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8">
            {content.preuveStats.map((s) => (
              <div key={s.label}>
                <div className="mb-2 text-[40px] font-semibold text-[#a9854a]" style={{ fontFamily: serif }}>
                  {s.value}
                </div>
                <div className="text-[15px] leading-snug text-[#6b7280]">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-[620px] text-base italic leading-relaxed text-[#2d3748]">{content.preuveQuote}</p>
        </div>
      </section>

      {/* Recouvre */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-[1000px]">
          <h2
            className="mb-5 text-center text-[clamp(24px,3vw,34px)] font-semibold leading-snug text-[#0d1b2e]"
            style={{ fontFamily: serif }}
          >
            {content.recouvreTitle}
          </h2>
          <p className="mx-auto mb-14 max-w-[680px] text-center text-[17px] leading-relaxed text-[#2d3748]">
            {content.recouvreIntro}
          </p>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
            {content.cartes.map((c) => (
              <Link
                key={c.titre}
                href={c.lien}
                className="block rounded-xl border border-[#efeae0] bg-[#f7f5f0] p-7 text-[#2d3748] no-underline transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h3 className="mb-2.5 text-xl font-semibold text-[#0d1b2e]" style={{ fontFamily: serif }}>
                  {c.titre}
                </h3>
                <p className="m-0 text-[14.5px] leading-relaxed text-[#6b7280]">{c.def}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Étapes */}
      <section id="comment-ca-se-deroule" className="scroll-mt-20 px-6 py-[90px] text-white" style={{ background: C.marine }}>
        <div className="mx-auto max-w-[960px]">
          <p className="mb-4 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-[#c8a96e]">
            Le déroulé de l&apos;accompagnement
          </p>
          <h2
            className="mb-16 text-center text-[clamp(26px,3.5vw,36px)] font-semibold leading-snug"
            style={{ fontFamily: serif }}
          >
            {content.etapesTitle}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10">
            {content.etapes.map((e) => (
              <div key={e.n}>
                <div className="mb-4 text-[15px] font-semibold tracking-wide text-[#c8a96e]" style={{ fontFamily: serif }}>
                  {e.n}
                </div>
                <h3 className="mb-3 text-[22px] font-semibold" style={{ fontFamily: serif }}>
                  {e.titre}
                </h3>
                <p className="m-0 text-[15.5px] leading-relaxed text-white/72">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ce que ça change */}
      <section className="px-6 py-[90px]" style={{ background: C.creme }}>
        <div className="mx-auto max-w-[1000px]">
          <h2
            className="mb-14 text-center text-[clamp(24px,3vw,34px)] font-semibold leading-snug text-[#0d1b2e]"
            style={{ fontFamily: serif }}
          >
            {content.changeTitle}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8">
            {content.changeItems.map((it) => (
              <div key={it.titre} className="px-1 py-2">
                <div className="mb-5 h-0.5 w-10 bg-[#c8a96e]" />
                <h3 className="mb-3 text-[19px] font-semibold text-[#0d1b2e]" style={{ fontFamily: serif }}>
                  {it.titre}
                </h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#6b7280]">{it.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="bg-white px-6 py-[90px]">
        <div className="mx-auto max-w-[880px] text-center">
          <h2 className="mb-4 text-[clamp(24px,3vw,32px)] font-semibold text-[#0d1b2e]" style={{ fontFamily: serif }}>
            Avis Google
          </h2>
          <div className="mt-8 text-left">
            <GoogleReviewsSlider />
          </div>
        </div>
      </section>

      {/* Modalités */}
      <section className="px-6 py-[90px]" style={{ background: C.cremeDeep }}>
        <div className="mx-auto max-w-[720px] rounded-2xl border border-[#efeae0] bg-white px-10 py-14 text-center">
          <h2
            className="mb-5 text-[clamp(22px,2.8vw,28px)] font-semibold text-[#0d1b2e]"
            style={{ fontFamily: serif }}
          >
            {content.modalitesTitle}
          </h2>
          <p className="mx-auto mb-8 max-w-[560px] text-base leading-relaxed text-[#2d3748]">{content.modalitesText}</p>
          <PrimaryButton href={BOOKING_URL}>Prendre rendez-vous</PrimaryButton>
          <p className="mt-5 text-[13px] text-[#6b7280]">
            Tarifs détaillés sur la page{" "}
            <Link href="/consultations" className="text-[#a9854a] underline">
              Consultations
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-[90px]" style={{ background: C.creme }}>
        <div className="mx-auto max-w-[760px]">
          <p className="mb-4 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-[#a9854a]">
            Questions fréquentes
          </p>
          <h2 className="mb-12 text-center text-[clamp(24px,3vw,32px)] font-semibold text-[#0d1b2e]" style={{ fontFamily: serif }}>
            FAQ
          </h2>
          <ProgrammeFAQ faqs={content.faqs} />
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-[100px] text-center text-white" style={{ background: C.marine }}>
        <div className="mx-auto max-w-[640px]">
          <h2
            className="mb-6 text-[clamp(26px,3.5vw,36px)] font-semibold leading-snug"
            style={{ fontFamily: serif }}
          >
            {content.ctaTitle}
          </h2>
          <p className="mb-10 text-[17px] leading-relaxed text-white/72">{content.ctaSubtitle}</p>
          <PrimaryButton href={BOOKING_URL}>Prendre rendez-vous</PrimaryButton>
        </div>
      </section>
    </main>
  );
}
