"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ALTERNANCE_CARD,
  COVERAGE_NOTE,
  PLAN_MOINS_50,
  PLAN_PLUS_50,
  RECONVERSION_CARD,
  SIZE_TABS,
  type SizeTabId,
} from "@/lib/financement-opco";
import { Band, H2, focusRing } from "@/components/site/ui";

export function OpcoCoverage({ recruterHref }: { recruterHref: string }) {
  const [active, setActive] = useState<SizeTabId>("moins-50");
  const plan = active === "moins-50" ? PLAN_MOINS_50 : PLAN_PLUS_50;

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = SIZE_TABS.findIndex((item) => item.id === active);
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? SIZE_TABS[(index + 1) % SIZE_TABS.length]
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? SIZE_TABS[(index - 1 + SIZE_TABS.length) % SIZE_TABS.length]
          : event.key === "Home"
            ? SIZE_TABS[0]
            : event.key === "End"
              ? SIZE_TABS[SIZE_TABS.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    setActive(next.id);
    document.getElementById(`opco-size-${next.id}`)?.focus();
  }

  const cards = [
    { key: "plan", tag: plan.tag, title: plan.title, text: plan.text, foot: plan.foot, href: null as string | null, linkLabel: null as string | null, dark: true },
    { key: "alternance", tag: ALTERNANCE_CARD.tag, title: ALTERNANCE_CARD.title, text: ALTERNANCE_CARD.text, foot: ALTERNANCE_CARD.foot.text, href: recruterHref, linkLabel: ALTERNANCE_CARD.linkLabel, dark: false },
    { key: "reconversion", tag: RECONVERSION_CARD.tag, title: RECONVERSION_CARD.title, text: RECONVERSION_CARD.text, foot: RECONVERSION_CARD.foot.text, href: null, linkLabel: null, dark: false },
  ];

  return (
    <Band>
      <H2>Ce que votre OPCO peut financer.</H2>
      <div role="tablist" aria-label="Taille de l'entreprise" className="mt-8 inline-flex max-w-full flex-wrap gap-2 rounded-full bg-white p-1.5" onKeyDown={onKeyDown}>
        {SIZE_TABS.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              id={`opco-size-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="opco-coverage-panel"
              tabIndex={selected ? 0 : -1}
              className={`min-h-11 rounded-full px-4 text-[14px] font-extrabold ${focusRing} ${selected ? "bg-[#0B0D14] text-white" : "text-[#0B0D14]"}`}
              onClick={() => setActive(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div id="opco-coverage-panel" role="tabpanel" aria-labelledby={`opco-size-${active}`} className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.key} className={`flex flex-col rounded-[32px] p-6 sm:p-8 ${card.dark ? "bg-[#0B0D14] text-white" : "bg-white text-[#0B0D14]"}`}>
            <p className={`text-[13px] font-extrabold ${card.dark ? "text-[#C9C2FF]" : "text-[#6E5BFF]"}`}>{card.tag}</p>
            <h3 className="mt-4 text-[28px] font-extrabold leading-tight tracking-[-1px]">{card.title}</h3>
            <p className={`mt-3 flex-1 text-[16px] leading-relaxed ${card.dark ? "text-white/75" : "text-[#4A4F5C]"}`}>{card.text}</p>
            <p className={`mt-6 border-t pt-4 text-[14px] font-extrabold ${card.dark ? "border-white/10 text-white" : "border-[#0B0D14]/10"}`}>{card.foot}</p>
            {card.href && card.linkLabel ? (
              <Link href={card.href} className={`mt-3 text-[15px] font-extrabold underline ${focusRing}`}>
                {card.linkLabel}
              </Link>
            ) : null}
          </article>
        ))}
      </div>
      <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-[#4A4F5C]">{COVERAGE_NOTE}</p>
    </Band>
  );
}
