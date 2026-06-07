"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParcoursGuide } from "@/lib/jessica-contentin/parcours-guide-catalog";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export function ParcoursGuideDetail({ parcours }: { parcours: ParcoursGuide }) {
  const [openModule, setOpenModule] = useState(parcours.modules[0]?.id ?? "");

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      <section className="relative overflow-hidden bg-[#2F2A25] text-white">
        <div className="absolute inset-0 opacity-40">
          <Image src={parcours.imageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#2F2A25] via-[#2F2A25]/80 to-[#2F2A25]/40" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 md:px-8 md:py-24">
          <Link
            href="/parcours-guide"
            className="text-sm font-medium text-[#E8D5B5] underline-offset-4 hover:underline"
          >
            ← Parcours guidés
          </Link>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.35em] text-[#C6A664]">
            {parcours.kicker}
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight md:text-4xl lg:text-5xl">
            {parcours.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{parcours.subtitle}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-12 md:px-8 md:py-16">
        <section className="space-y-4">
          {parcours.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-[#4A4339] md:text-lg">
              {paragraph}
            </p>
          ))}
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25]">Objectifs du parcours</h2>
          <ul className="mt-6 space-y-3">
            {parcours.objectives.map((obj) => (
              <li key={obj} className="flex gap-3 text-[#4A4339]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C6A664]" />
                <span className="leading-relaxed">{obj}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25]">Les modules</h2>
          <div className="mt-6 divide-y divide-[#E6D9C6] rounded-2xl border border-[#E6D9C6] bg-white/60">
            {parcours.modules.map((mod) => {
              const isOpen = openModule === mod.id;
              return (
                <div key={mod.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#FAF7F2]/80"
                    onClick={() => setOpenModule(isOpen ? "" : mod.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-[#2F2A25]">{mod.title}</span>
                    <ChevronDown
                      className={cn("h-5 w-5 shrink-0 text-[#8B6914] transition", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen ? (
                    <ul className="space-y-2 px-5 pb-5">
                      {mod.items.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-[#5C5348]">
                          <span className="text-[#C6A664]">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E6D9C6] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold text-[#2F2A25]">Entretien expérientiel</h2>
          <p className="mt-4 leading-relaxed text-[#4A4339]">{parcours.entretien}</p>
        </section>

        <section className="rounded-2xl border border-[#C6A664]/30 bg-[#FFFCF9] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-[#C6A664]" />
            <div>
              <h2 className="text-xl font-semibold text-[#2F2A25]">Assistant IA intégré</h2>
              <p className="mt-3 leading-relaxed text-[#4A4339]">
                Posez vos questions, reformulez les notions abordées et retrouvez facilement les outils proposés
                tout au long du parcours.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight text-[#2F2A25]">Livrables</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {parcours.livrables.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-[#E6D9C6] bg-white px-4 py-3 text-sm text-[#4A4339]"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-[#2F2A25] p-8 text-white">
          <h2 className="text-xl font-semibold">Promesse du parcours</h2>
          <p className="mt-4 leading-relaxed text-white/90">{parcours.promesse}</p>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-[#C6A664] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#B88A44]"
          >
            Prendre rendez-vous
          </a>
        </section>
      </div>
    </div>
  );
}
