"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Heart, Loader2 } from "lucide-react";
import type { LearnerSituationDetails } from "@/lib/apprenant/learner-situation";
import type { HomeNextStep, HomeTimelineStep } from "@/lib/apprenant/learner-home-v2-data";

type HomePayload = {
  dateLabel: string;
  firstName: string;
  situation: LearnerSituationDetails;
  nextStep: HomeNextStep;
  timeline: HomeTimelineStep[];
  objective: {
    title: string;
    acquiredCount: number;
    toStrengthenCount: number;
    skills: Array<{ name: string; status: "acquired" | "to_strengthen" }>;
    moreAcquired: number;
  };
  tests: {
    done: number;
    total: number;
    items: Array<{
      id: string;
      name: string;
      sub: string | null;
      done: boolean;
      date: string | null;
    }>;
  };
  badgePreview: string | null;
  profile: { filled: number; total: number; missingLabels: string[] };
  alternance: null | {
    mode: "entreprise" | "ecole" | "vacances";
    companyName: string | null;
    tutorName: string | null;
    nextChangeLabel: string | null;
    nextChangeWhen: string | null;
    daysUntil: number | null;
  };
};

const COLORS = {
  bg: "#070B18",
  card: "#0F1428",
  inner: "#151C3A",
  border: "#1C2443",
  text: "#F2F4FA",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  violetSoft: "#C9C2FF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  blue: "#8DB8FF",
  turquoise: "#5EDCC3",
  framboise: "#FF5C8A",
};

function Ring({ filled, total, label }: { filled: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(1, filled / total) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#222B4D" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={COLORS.violetSoft}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <span className="absolute max-w-[64px] text-center text-[11px] font-bold leading-tight text-white">
        {label}
      </span>
    </div>
  );
}

export function LearnerHomeV2() {
  const [data, setData] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/apprenant/home-v2", { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Chargement impossible");
        if (!cancelled) setData(json as HomePayload);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="p-6 text-sm text-[#FF8A9B]">{error}</p>;
  }
  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  const apprentice = data.situation.showAlternanceNav;
  const totalSkills = data.objective.acquiredCount + data.objective.toStrengthenCount;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-2 sm:px-6 lg:px-8" style={{ color: COLORS.text }}>
      <header>
        <p className="text-sm capitalize" style={{ color: COLORS.secondary }}>
          {data.dateLabel}
        </p>
        <h1 className="mt-1 text-[40px] font-extrabold leading-tight tracking-tight">
          Bonjour {data.firstName || "toi"}.
        </h1>
      </header>

      {apprentice && data.alternance ? (
        <section
          className="grid overflow-hidden rounded-[28px] border md:grid-cols-2"
          style={{ borderColor: "#1A4A42" }}
        >
          <div
            className="p-6"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, #1A5C52 0%, #0F2A28 55%, #0F1428 100%)",
            }}
          >
            <p className="text-sm font-semibold" style={{ color: COLORS.turquoise }}>
              Cette semaine
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {data.alternance.mode === "ecole"
                ? "Tu es à l’école"
                : data.alternance.mode === "vacances"
                  ? "Tu es en vacances"
                  : "Tu es en entreprise"}
            </p>
            {data.alternance.companyName ? (
              <p className="mt-2 text-sm" style={{ color: COLORS.secondary }}>
                {data.alternance.companyName}
                {data.alternance.tutorName ? ` · ${data.alternance.tutorName}` : ""}
              </p>
            ) : null}
          </div>
          <div className="border-t p-6 md:border-l md:border-t-0" style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <p className="text-sm font-semibold" style={{ color: COLORS.blue }}>
              {data.alternance.nextChangeLabel || "Prochain changement"}
            </p>
            <p className="mt-2 text-lg font-bold">
              {data.alternance.nextChangeWhen || "Dès que ton planning est synchronisé"}
            </p>
            {data.alternance.daysUntil != null ? (
              <p className="mt-2 text-sm" style={{ color: COLORS.tertiary }}>
                dans {data.alternance.daysUntil} jour{data.alternance.daysUntil > 1 ? "s" : ""}
              </p>
            ) : (
              <Link href="/dashboard/apprenant/planning" className="mt-3 inline-block text-sm font-semibold text-[#A99BFF]">
                Voir mon planning →
              </Link>
            )}
          </div>
        </section>
      ) : null}

      {apprentice ? (
        <section className="grid gap-3 md:grid-cols-3">
          <article className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <p className="text-xs font-bold" style={{ color: COLORS.tertiary }}>
              Mon tuteur
            </p>
            <p className="mt-3 text-lg font-extrabold">{data.alternance?.tutorName || "À rattacher"}</p>
            <Link href="/dashboard/apprenant/entreprise" className="mt-4 inline-block text-sm font-semibold" style={{ color: COLORS.turquoise }}>
              Lui écrire →
            </Link>
          </article>
          <article className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <p className="text-xs font-bold" style={{ color: COLORS.amber }}>
              Livret d’apprentissage
            </p>
            <p className="mt-3 text-lg font-extrabold">Éléments à remplir</p>
            <Link
              href="/dashboard/apprenant/livret"
              className="mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: COLORS.amber, color: COLORS.amber }}
            >
              Remplir →
            </Link>
          </article>
          <article className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <p className="text-xs font-bold" style={{ color: COLORS.tertiary }}>
              Mon entreprise
            </p>
            <p className="mt-3 text-lg font-extrabold">{data.alternance?.companyName || "—"}</p>
            <Link href="/dashboard/apprenant/entreprise" className="mt-4 inline-block text-sm font-semibold text-[#A99BFF]">
              Missions et à faire →
            </Link>
          </article>
        </section>
      ) : null}

      {!apprentice ? (
        <section
          className="flex flex-col gap-5 rounded-[28px] border p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{
            borderColor: "#2E3570",
            background:
              "radial-gradient(110% 160% at 0% 0%, #3A2C9A 0%, #1C1F52 50%, #0F1428 100%)",
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold" style={{ color: COLORS.violetSoft }}>
              Ta prochaine étape
            </p>
            <h2 className="mt-2 text-[30px] font-extrabold leading-tight">{data.nextStep.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: COLORS.secondary }}>
              {data.nextStep.body}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={data.nextStep.ctaHref}
                className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E]"
              >
                {data.nextStep.ctaLabel}
              </Link>
              <span className="text-xs" style={{ color: COLORS.tertiary }}>
                {data.nextStep.nextHint}
              </span>
            </div>
          </div>
          <Ring
            filled={data.nextStep.ringFilled}
            total={data.nextStep.ringTotal}
            label={data.nextStep.ringLabel}
          />
        </section>
      ) : null}

      <section className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">
            {apprentice ? "Ton année d’alternance" : "Où tu en es"}
          </h2>
          <Link
            href={apprentice ? "/dashboard/apprenant/planning" : "/dashboard/apprenant/parcours"}
            className="text-sm font-semibold text-[#A99BFF]"
          >
            {apprentice ? "Voir mon planning →" : "Voir mon parcours →"}
          </Link>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
          {data.timeline.map((step, i) => (
            <div key={step.id} className="flex min-w-[110px] flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                {i > 0 ? (
                  <div
                    className="h-px flex-1"
                    style={{
                      background:
                        data.timeline[i - 1]?.status === "done" ? COLORS.green : COLORS.border,
                    }}
                  />
                ) : (
                  <div className="flex-1" />
                )}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    background:
                      step.status === "done"
                        ? "#14301F"
                        : step.status === "current"
                          ? COLORS.violet
                          : "transparent",
                    color:
                      step.status === "done"
                        ? COLORS.green
                        : step.status === "current"
                          ? "#fff"
                          : COLORS.tertiary,
                    boxShadow:
                      step.status === "current" ? "0 0 0 6px rgba(110,91,255,0.25)" : undefined,
                    border:
                      step.status === "upcoming" ? `1.5px solid ${COLORS.border}` : undefined,
                  }}
                >
                  {step.status === "done" ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < data.timeline.length - 1 ? (
                  <div
                    className="h-px flex-1"
                    style={{
                      background: step.status === "done" ? COLORS.green : COLORS.border,
                    }}
                  />
                ) : (
                  <div className="flex-1" />
                )}
              </div>
              <p className="mt-2 text-sm font-bold">{step.label}</p>
              <p className="text-xs" style={{ color: COLORS.tertiary }}>
                {step.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
          <p className="text-xs font-bold" style={{ color: COLORS.tertiary }}>
            Mon objectif
          </p>
          <h3 className="mt-1 text-xl font-extrabold">{data.objective.title}</h3>
          {totalSkills > 0 ? (
            <p className="mt-2 text-sm" style={{ color: COLORS.secondary }}>
              {data.objective.acquiredCount} compétence
              {data.objective.acquiredCount > 1 ? "s" : ""} déjà acquise
              {data.objective.acquiredCount > 1 ? "s" : ""},{" "}
              {data.objective.toStrengthenCount} à renforcer
            </p>
          ) : (
            <p className="mt-2 text-sm" style={{ color: COLORS.secondary }}>
              Définis ton objectif pour voir les compétences à travailler.
            </p>
          )}

          {totalSkills > 0 ? (
            <div className="mt-4 flex gap-1">
              {[...data.objective.skills, ...Array(Math.max(0, totalSkills - data.objective.skills.length)).fill(null)].slice(0, Math.min(12, totalSkills || 8)).map((s, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background: s
                      ? s.status === "acquired"
                        ? COLORS.green
                        : COLORS.amber
                      : COLORS.inner,
                  }}
                />
              ))}
            </div>
          ) : null}

          <ul className="mt-4 space-y-2">
            {data.objective.skills.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{s.name}</span>
                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: s.status === "acquired" ? COLORS.green : COLORS.amber }}
                >
                  {s.status === "acquired" ? "Acquise" : "À renforcer"}
                </span>
              </li>
            ))}
          </ul>
          {data.objective.moreAcquired > 0 ? (
            <p className="mt-3 text-xs" style={{ color: COLORS.tertiary }}>
              + {data.objective.moreAcquired} compétence
              {data.objective.moreAcquired > 1 ? "s" : ""} acquise
              {data.objective.moreAcquired > 1 ? "s" : ""}
            </p>
          ) : null}
          <Link
            href="/dashboard/apprenant/parcours"
            className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: COLORS.violet }}
          >
            Ouvrir le Training center
          </Link>
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border p-5" style={{ background: COLORS.card, borderColor: COLORS.border }}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Mes tests</h3>
              <span className="text-sm font-bold" style={{ color: COLORS.blue }}>
                {data.tests.done} sur {data.tests.total}
                {data.tests.done >= data.tests.total ? " ✓" : ""}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {data.tests.items.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-2 text-sm">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    {t.sub ? (
                      <p className="text-xs" style={{ color: COLORS.tertiary }}>
                        {t.sub}
                      </p>
                    ) : null}
                  </div>
                  {t.done ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: COLORS.blue }} />
                  ) : (
                    <span className="text-xs" style={{ color: COLORS.tertiary }}>
                      À faire
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/apprenant/tests" className="mt-3 inline-block text-sm font-semibold text-[#A99BFF]">
              Voir Mes tests →
            </Link>
          </article>

          <article
            className="rounded-3xl border border-dashed p-5"
            style={{ background: COLORS.card, borderColor: "#2A3358" }}
          >
            <p className="text-xs font-bold" style={{ color: COLORS.tertiary }}>
              Ton premier Open Badge
            </p>
            <p className="mt-2 font-extrabold">
              {data.badgePreview || "À préparer dans le Training center"}
            </p>
            <Link href="/dashboard/apprenant/skills" className="mt-3 inline-block text-sm font-semibold text-[#A99BFF]">
              Mes compétences →
            </Link>
          </article>

          <Link
            href="/dashboard/apprenant/care"
            className="flex items-start gap-3 rounded-3xl border p-5 transition hover:brightness-110"
            style={{ background: "#3A0F22", borderColor: "#5A1A35" }}
          >
            <Heart className="mt-0.5 h-5 w-5 shrink-0" style={{ color: COLORS.framboise }} />
            <div>
              <p className="font-extrabold">Besoin de souffler ?</p>
              <p className="mt-1 text-sm" style={{ color: "#E8B4C4" }}>
                Des professionnels t’écoutent, en toute confidentialité.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
