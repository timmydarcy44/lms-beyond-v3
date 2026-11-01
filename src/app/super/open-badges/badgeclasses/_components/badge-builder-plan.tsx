"use client";

import { useState } from "react";
import type { BadgePlan, PlannedBadge } from "@/lib/openbadges/badge-course-generation";

export function BadgeBuilderPlan({
  plan,
  busy,
  error,
  onBack,
  onGenerate,
}: {
  plan: BadgePlan;
  busy: boolean;
  error?: string | null;
  onBack: () => void;
  onGenerate: (badges: PlannedBadge[], seriesName: string, domain: string) => void;
}) {
  const [mode, setMode] = useState<"series" | "single">(plan.singleAllowed && plan.single ? "single" : "series");
  const [checked, setChecked] = useState<string[]>(plan.series.map((item) => item.key));
  const badges = mode === "single" && plan.single ? [plan.single] : plan.series.filter((item) => checked.includes(item.key));

  return (
    <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="text-lg font-semibold">Découpage proposé</h2>
      <p className="mt-2 text-sm text-[#8C94B2]">
        {plan.domain ? `Domaine proposé : ${plan.domain}${plan.domainIsNew ? " · à créer" : ""}` : "Domaine à préciser"}
        {plan.seriesName ? ` · Série ${plan.seriesName}` : ""}
        {plan.totalHours != null ? ` · ${plan.totalHours} h` : ""}
      </p>
      {plan.singleAllowed && plan.single ? (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setMode("series")} className={`rounded-full px-4 py-2 text-sm ${mode === "series" ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>Un badge par section</button>
          <button type="button" onClick={() => setMode("single")} className={`rounded-full px-4 py-2 text-sm ${mode === "single" ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>Un seul badge</button>
        </div>
      ) : null}
      <ul className="mt-4 space-y-2">
        {(mode === "single" && plan.single ? [plan.single] : plan.series).map((badge) => (
          <li key={badge.key} className="rounded-2xl border border-[#1A2340] px-3 py-3 text-sm">
            <label className="flex items-start gap-3">
              {mode === "series" ? (
                <input
                  type="checkbox"
                  checked={checked.includes(badge.key)}
                  onChange={() => setChecked((current) => current.includes(badge.key) ? current.filter((key) => key !== badge.key) : [...current, badge.key])}
                />
              ) : null}
              <span>
                <span className="block font-medium">{badge.title}</span>
                <span className="mt-1 block text-[#8C94B2]">{badge.kind === "synthesis" ? "Synthèse · exige les badges de section" : badge.sectionTitle}{badge.hours != null ? ` · ${badge.hours} h` : ""}</span>
                {badge.summary ? <span className="mt-1 block text-[#A9B0CC]">{badge.summary}</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {plan.truncations.length > 0 ? (
        <p className="mt-3 text-sm text-[#F2C15A]">{plan.truncations.map((note) => `${note.section} : ${note.originalChars - note.keptChars} caractères non envoyés`).join(" · ")}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[#F2C15A]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="rounded-full border border-[#26304F] px-4 py-2 text-sm">Retour</button>
        <button type="button" disabled={busy || badges.length === 0} onClick={() => onGenerate(badges, plan.seriesName, plan.domain)} className="bb-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-40">
          {busy ? "Rédaction…" : `Générer ${badges.length} badge${badges.length > 1 ? "s" : ""}`}
        </button>
      </div>
    </section>
  );
}
