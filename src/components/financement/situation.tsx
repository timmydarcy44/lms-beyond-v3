"use client";

import Link from "next/link";
import { useState } from "react";
import { SITUATIONS, situationCards, type SituationId } from "@/lib/financement";
import { Band, H2, focusRing } from "@/components/financement/ui";

export function FinancementSituation({
  offresHref,
  recruterHref,
}: {
  offresHref: string;
  recruterHref: string;
}) {
  const [active, setActive] = useState<SituationId>("etudiant");
  const cards = situationCards(active, { offres: offresHref, recruter: recruterHref });

  function select(id: SituationId, scroll: boolean) {
    setActive(id);
    if (scroll && id === "entreprise") {
      document.getElementById("recruter")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = SITUATIONS.findIndex((item) => item.id === active);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? SITUATIONS[(index + 1) % SITUATIONS.length]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? SITUATIONS[(index - 1 + SITUATIONS.length) % SITUATIONS.length]
          : event.key === "Home"
            ? SITUATIONS[0]
            : event.key === "End"
              ? SITUATIONS[SITUATIONS.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    select(next.id, true);
    document.getElementById(`situation-${next.id}`)?.focus();
  }

  return (
    <Band id="situation">
      <H2>Vous êtes…</H2>
      <p className="mt-4 max-w-xl text-[18px] text-[#4A4F5C]">Choisissez votre situation. On vous indique le financement le plus direct.</p>
      <div role="tablist" aria-label="Votre situation" className="mt-8 flex flex-wrap gap-2" onKeyDown={onKeyDown}>
        {SITUATIONS.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              id={`situation-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="situation-panel"
              tabIndex={selected ? 0 : -1}
              className={`min-h-11 rounded-full px-4 text-[14px] font-extrabold ${focusRing} ${selected ? "bg-[#0B0D14] text-white" : "bg-white text-[#0B0D14]"}`}
              onClick={() => select(item.id, true)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div id="situation-panel" role="tabpanel" aria-labelledby={`situation-${active}`} className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const body = (
            <>
              {card.eyebrow ? <p className="text-[13px] font-extrabold text-[#C9C2FF]">{card.eyebrow}</p> : null}
              <h3 className={`text-[28px] font-extrabold leading-tight tracking-[-1px] ${card.tone === "dark" ? "text-white" : "text-[#0B0D14]"} ${card.eyebrow ? "mt-4" : ""}`}>
                {card.title}
              </h3>
              <p className={`mt-3 text-[16px] leading-relaxed ${card.tone === "dark" ? "text-white/75" : "text-[#4A4F5C]"}`}>{card.text}</p>
              {card.facts ? (
                <ul className="mt-6 space-y-2">
                  {card.facts.map((fact) => (
                    <li key={fact.label} className="flex items-center justify-between gap-3 text-[15px]">
                      <span className={card.tone === "dark" ? "text-white/60" : "text-[#4A4F5C]"}>{fact.label}</span>
                      <span className={fact.paid ? "rounded-full bg-[#6BE39B] px-2.5 py-1 text-[13px] font-extrabold text-[#0B0D14]" : "font-extrabold"}>
                        {fact.value}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {card.cta ? <span className="mt-6 inline-flex text-[15px] font-extrabold">{card.cta} →</span> : null}
            </>
          );
          const className = `flex min-h-[280px] flex-col rounded-[32px] p-7 ${card.tone === "dark" ? "bg-[#0B0D14] text-white md:col-span-1" : "bg-white"} ${card.href ? focusRing : ""}`;
          if (card.href) {
            return (
              <Link key={card.title} href={card.href} className={`${className} no-underline`}>
                {body}
              </Link>
            );
          }
          return (
            <article key={card.title} className={className}>
              {body}
            </article>
          );
        })}
      </div>
    </Band>
  );
}
