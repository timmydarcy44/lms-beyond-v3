"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { Lock, X } from "lucide-react";
import type { MesBilansViewModel } from "@/lib/salarie/build-mes-bilans";
import type { SalarieHomePayload } from "@/lib/salarie/load-employee-home";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"] });

type Home = SalarieHomePayload & {
  mesBilans?: MesBilansViewModel | null;
  preview?: { active: boolean } | null;
};

function formatDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", opts ?? { day: "numeric", month: "short" });
}

function formatDateLong(iso: string | null) {
  return formatDate(iso, { day: "numeric", month: "short", year: "numeric" });
}

function ScoreBar({
  value,
  color,
  track = "rgba(255,255,255,0.08)",
  showMid = true,
}: {
  value: number;
  color: string;
  track?: string;
  showMid?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: track }}>
      {showMid ? (
        <span
          aria-hidden
          className="absolute inset-y-0 w-px bg-white/70"
          style={{ left: "50%" }}
        />
      ) : null}
      <span
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

function SummaryCard({
  href,
  children,
  muted,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  muted?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "block min-h-[168px] rounded-[22px] border p-5 text-left transition",
    muted
      ? "border-[#1C2443] bg-[#0A0F1C] text-white/45"
      : "border-[#1C2443] bg-[#0F1428] hover:border-[#6E5BFF]/50",
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(className, "w-full")}>
      {children}
    </button>
  );
}

export function MesBilans() {
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [softExpanded, setSoftExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dashboard/salarie/home", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("home"))))
      .then((json: Home) => {
        if (!cancelled) setHome(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = home?.mesBilans ?? null;

  const pending = useMemo(() => {
    if (!home) return [];
    return [
      !home.bilans.disc
        ? { key: "disc", href: "/dashboard/salarie/test-disc", label: "Profil comportemental · DISC" }
        : null,
      !home.bilans.idmc
        ? { key: "idmc", href: "/dashboard/salarie/test-idmc", label: "Aptitudes" }
        : null,
      !home.bilans.soft
        ? { key: "soft", href: "/dashboard/salarie/test-soft-skills", label: "Soft skills" }
        : null,
    ].filter((item): item is { key: string; href: string; label: string } => Boolean(item));
  }, [home]);

  if (error) {
    return (
      <div className={cn(manrope.className, "mx-auto max-w-[1100px] px-4 py-16 text-white")}>
        <p>Impossible de charger tes bilans.</p>
        <button
          type="button"
          className="mt-4 h-11 rounded-full bg-white px-5 text-sm font-bold text-[#070B18]"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!home || !view) {
    return (
      <div className={cn(manrope.className, "mx-auto max-w-[1100px] space-y-4 px-4 py-8")}>
        <div className="h-16 animate-pulse rounded-2xl bg-[#0F1428]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#0F1428]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-40 animate-pulse rounded-[22px] bg-[#0F1428]" />
          <div className="h-40 animate-pulse rounded-[22px] bg-[#0F1428]" />
          <div className="h-40 animate-pulse rounded-[22px] bg-[#0F1428]" />
        </div>
      </div>
    );
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={cn(
        manrope.className,
        "mx-auto w-full max-w-[1100px] px-4 pb-20 pt-6 text-[#F4F5F7] sm:px-6",
      )}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[34px]">Mes bilans</h1>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Tes résultats expliqués simplement. Ils t&apos;appartiennent.
          </p>
        </div>
        {home.analysis ? (
          <button
            type="button"
            onClick={() => setAnalysisOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] px-5 text-sm font-bold text-white"
          >
            Synthèse croisée →
          </button>
        ) : (
          <span
            className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-[#6E5BFF]/35 px-5 text-sm font-bold text-white/60"
            title="Disponible quand les trois tests sont croisés"
          >
            Synthèse croisée →
          </span>
        )}
      </header>

      <aside className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#1C2443] bg-[#10183A] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="flex items-start gap-3 text-sm leading-relaxed text-[#C9D4FF]">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#8DB8FF]" aria-hidden />
          <span>{view.privacyBanner}</span>
        </p>
        <Link
          href={view.partageHref}
          className="shrink-0 text-sm font-semibold text-[#C9C2FF] hover:underline"
        >
          Gérer le partage →
        </Link>
      </aside>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Résumé des bilans">
        {view.disc ? (
          <SummaryCard onClick={() => scrollTo("section-disc")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#FF9B54]">
                Profil comportemental · DISC
              </p>
              <span className="text-xs text-white/45">{formatDate(view.disc.takenAt)}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-white">{view.disc.dominantLabel}</p>
            <p className="mt-1 text-sm text-white/55">{view.disc.nuanceLabel}</p>
            <p className="mt-4 text-sm font-semibold text-white/80">{view.disc.scoresLine}</p>
          </SummaryCard>
        ) : null}

        {view.idmc ? (
          <SummaryCard onClick={() => scrollTo("section-aptitudes")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8DB8FF]">Aptitudes</p>
              <span className="text-xs text-white/45">{formatDate(view.idmc.takenAt)}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold leading-tight text-white">{view.idmc.strong}</p>
            {view.idmc.weak ? (
              <p className="mt-2 text-sm text-white/55">À renforcer : {view.idmc.weak}</p>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-[#6BE39B]">
              Point fort {view.idmc.strongScore} / 100
            </p>
          </SummaryCard>
        ) : null}

        {view.soft ? (
          <SummaryCard onClick={() => scrollTo("section-soft")}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5EDCC3]">Soft skills</p>
              <span className="text-xs text-white/45">{formatDate(view.soft.takenAt)}</span>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-white">{view.soft.top[0]?.skill ?? "—"}</p>
            <p className="mt-2 text-sm text-white/55">
              puis {view.soft.top.slice(1).map((row) => row.skill).join(", ")}
            </p>
            <p className="mt-4 text-sm font-semibold text-white/80">
              Top 3 sur {view.soft.evaluatedCount} évaluées
            </p>
          </SummaryCard>
        ) : null}

        {pending.map((item) => (
          <SummaryCard key={item.key} href={item.href} muted>
            <p className="text-sm text-white/40">Pas encore passé</p>
            <p className="mt-3 text-xl font-extrabold text-white/70">{item.label}</p>
            <span className="mt-8 inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white">
              Passer le test
            </span>
          </SummaryCard>
        ))}
      </section>

      {view.disc ? (
        <section
          id="section-disc"
          className="mt-10 scroll-mt-8 rounded-[24px] border border-[#1C2443] bg-[#0F1428] p-5 sm:p-7"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#FF9B54]">
                Profil comportemental · test DISC · {view.disc.questionCount} questions
                {view.disc.takenAt ? ` · ${formatDateLong(view.disc.takenAt)}` : ""}
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-[28px]">
                {view.disc.interpretiveTitle}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
                {view.disc.observation}
              </p>
            </div>
            <Link
              href={view.disc.retakeHref}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white"
            >
              Repasser le test
            </Link>
          </div>

          <div className="mt-8">
            <p className="mb-4 text-right text-[11px] text-white/40">{view.disc.scaleLegend}</p>
            <ul className="space-y-5">
              {view.disc.bars.map((bar) => (
                <li key={bar.key} className="grid gap-2 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold text-[#070B18]"
                        style={{ background: bar.color }}
                      >
                        {bar.letter}
                      </span>
                      {bar.name}
                    </p>
                    <p className="mt-1 text-xs text-white/45">{bar.definition}</p>
                  </div>
                  <ScoreBar value={bar.value} color={bar.color} />
                  <span className="text-sm font-bold tabular-nums text-white">{bar.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#151C3A] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6BE39B]">Tes points d&apos;appui</p>
              {view.disc.appui.length ? (
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {view.disc.appui.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/40">À RÉDIGER</p>
              )}
            </div>
            <div className="rounded-2xl bg-[#151C3A] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#F2CF6B]">Points de vigilance</p>
              {view.disc.vigilance.length ? (
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {view.disc.vigilance.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/40">À RÉDIGER</p>
              )}
            </div>
            <div className="rounded-2xl bg-[#151C3A] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#C9C2FF]">
                Pour bien travailler avec toi
              </p>
              {view.disc.travailler.length ? (
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  {view.disc.travailler.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-white/40">À RÉDIGER</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {(view.soft || view.idmc) && (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {view.soft ? (
            <div
              id="section-soft"
              className="scroll-mt-8 rounded-[24px] border border-[#1C2443] bg-[#0F1428] p-5 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#5EDCC3]">
                Soft skills · {view.soft.evaluatedCount} évaluées
              </p>
              <p className="mt-2 text-sm text-white/50">{view.soft.scaleLegend}</p>

              <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#6BE39B]">
                Tes points forts
              </p>
              <ul className="mt-3 space-y-3">
                {view.soft.top.map((row) => (
                  <li key={row.skill} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-sm text-white/80">{row.skill}</span>
                    <ScoreBar value={row.percent} color="#6BE39B" showMid={false} />
                    <span className="w-10 text-right text-sm font-bold tabular-nums">{row.percent}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[#F2CF6B]">
                À développer
              </p>
              <ul className="mt-3 space-y-3">
                {view.soft.develop.map((row) => (
                  <li key={row.skill} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-sm text-white/80">{row.skill}</span>
                    <ScoreBar value={row.percent} color="#F2CF6B" showMid={false} />
                    <span className="w-10 text-right text-sm font-bold tabular-nums">{row.percent}</span>
                  </li>
                ))}
              </ul>

              {softExpanded ? (
                <ul className="mt-6 space-y-2 border-t border-white/10 pt-4">
                  {view.soft.all.map((row) => (
                    <li key={row.skill} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-white/75">{row.skill}</span>
                      <span className="font-bold tabular-nums text-white">{row.percent}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => setSoftExpanded((open) => !open)}
                className="mt-5 text-sm font-semibold text-[#C9C2FF]"
              >
                {softExpanded
                  ? "Masquer la liste"
                  : `Voir les ${view.soft.evaluatedCount} soft skills →`}
              </button>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#1C2443] bg-[#0A0F1C] p-6 text-sm text-white/40">
              Soft skills — pas encore passé.{" "}
              <Link href="/dashboard/salarie/test-soft-skills" className="text-[#C9C2FF]">
                Passer le test →
              </Link>
            </div>
          )}

          {view.idmc ? (
            <div
              id="section-aptitudes"
              className="scroll-mt-8 rounded-[24px] border border-[#1C2443] bg-[#0F1428] p-5 sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8DB8FF]">Aptitudes</p>
              <p className="mt-2 text-sm text-white/50">{view.idmc.scaleLegend}</p>
              <ul className="mt-6 space-y-3">
                {view.idmc.axes.map((axis) => (
                  <li key={axis.key} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-sm text-white/80 sm:w-48">{axis.name}</span>
                    <ScoreBar
                      value={axis.value}
                      color={axis.tone === "amber" ? "#F2CF6B" : "#8DB8FF"}
                    />
                    <span className="w-10 text-right text-sm font-bold tabular-nums">{axis.value}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-2xl bg-[#1A1540] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#C9C2FF]">
                  Ce que ça veut dire
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{view.idmc.meaning}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#1C2443] bg-[#0A0F1C] p-6 text-sm text-white/40">
              Aptitudes — pas encore passé.{" "}
              <Link href="/dashboard/salarie/test-idmc" className="text-[#C9C2FF]">
                Passer le test →
              </Link>
            </div>
          )}
        </section>
      )}

      <section className="mt-10 rounded-[24px] border border-[#1C2443] bg-[#0F1428] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Et maintenant ?</p>
        <p className="mt-3 max-w-3xl text-lg font-semibold leading-snug text-white">
          {view.nextStep.summary}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {view.nextStep.formation ? (
            <Link
              href={view.nextStep.formation.href}
              className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#070B18]"
            >
              Formation « {view.nextStep.formation.title} » →
            </Link>
          ) : null}
          <Link
            href={view.nextStep.coachHref}
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-semibold text-white"
          >
            Parler à un coach
          </Link>
        </div>
      </section>

      {analysisOpen && home.analysis ? (
        <dialog
          open
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setAnalysisOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-[28px] border border-[#1C2443] bg-[#0F1428] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Synthèse croisée</h3>
              <button type="button" aria-label="Fermer" onClick={() => setAnalysisOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#DADDE4]">{home.analysis}</p>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
