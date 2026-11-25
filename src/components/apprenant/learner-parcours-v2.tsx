"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

type Payload = {
  objectiveTitle: string | null;
  resume: null | {
    title: string;
    href: string;
    moduleIndex: number;
    done: number;
    total: number;
    minutesLeft: number | null;
  };
  modules: Array<{
    id: string;
    title: string;
    href: string;
    status: "done" | "current" | "upcoming";
    done: number;
    total: number;
    meta: string | null;
    badgeHint: string | null;
  }>;
  week: {
    totalLabel: string;
    bars: Array<{ label: string; ratio: number; seconds: number }>;
  };
  expertHref: string;
};

const C = {
  card: "#0F1428",
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  green: "#6BE39B",
  blue: "#8DB8FF",
};

export function LearnerParcoursV2() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/apprenant/parcours-v2", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Chargement impossible");
        if (!cancelled) setData(j as Payload);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="p-6 text-sm text-[#FF8A9B]">{error}</p>;
  if (!data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-0 pb-20 pt-1 text-[#F2F4FA] sm:px-0 lg:px-0">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-extrabold tracking-tight sm:text-[34px] lg:text-[40px]">Mon parcours</h1>
          <p className="mt-1 text-sm" style={{ color: C.secondary }}>
            {[data.objectiveTitle, "Training center"].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link
          href="/dashboard/apprenant/profil-comportemental/projet"
          className="inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold sm:w-auto"
          style={{ borderColor: C.border, color: C.secondary }}
        >
          Modifier mon objectif
        </Link>
      </header>

      <section
        className="flex flex-col gap-4 rounded-[22px] border p-4 sm:rounded-[28px] sm:p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: "#2E3570",
          background:
            "radial-gradient(110% 160% at 0% 0%, #3A2C9A 0%, #1C1F52 50%, #0F1428 100%)",
        }}
      >
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#C9C2FF]">
            {data.resume ? "Reprendre où tu t’es arrêté·e" : "Commencer"}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">
            {data.resume?.title || "Ton premier module"}
          </h2>
          {data.resume ? (
            <p className="mt-2 text-sm" style={{ color: C.secondary }}>
              Module {data.resume.moduleIndex}
              {data.resume.total > 0
                ? ` · chapitre ${data.resume.done} sur ${data.resume.total}`
                : ""}
              {data.resume.minutesLeft != null && data.resume.minutesLeft > 0
                ? ` · environ ${data.resume.minutesLeft} min restantes`
                : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm" style={{ color: C.secondary }}>
              Aucun module en cours — ouvre le catalogue pour démarrer.
            </p>
          )}
        </div>
        <Link
          href={data.resume?.href || (data.modules[0]?.href ?? "/dashboard/apprenant/formations")}
          className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E] sm:w-auto"
        >
          {data.resume ? "Continuer →" : "Commencer →"}
        </Link>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <article className="rounded-3xl border p-4 sm:p-5" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Mon programme</h2>
            <Link href="/dashboard/apprenant/formations" className="text-sm font-semibold text-[#A99BFF]">
              Mes formations →
            </Link>
          </div>
          {data.modules.length === 0 ? (
            <p className="mt-6 text-sm" style={{ color: C.secondary }}>
              Aucune formation assignée pour l’instant.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.modules.map((m, i) => (
                <li key={m.id}>
                  <Link
                    href={m.href}
                    className="flex gap-3 rounded-2xl border p-3 transition hover:brightness-110"
                    style={{ borderColor: C.border, background: "#151C3A" }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{
                        background:
                          m.status === "done"
                            ? "#14301F"
                            : m.status === "current"
                              ? C.violet
                              : "#1A2340",
                        color:
                          m.status === "done"
                            ? C.green
                            : m.status === "current"
                              ? "#fff"
                              : C.tertiary,
                      }}
                    >
                      {m.status === "done" ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold">{m.title}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            background: "#1A2340",
                            color:
                              m.status === "done"
                                ? C.green
                                : m.status === "current"
                                  ? C.blue
                                  : C.tertiary,
                          }}
                        >
                          {m.status === "done"
                            ? "Terminé"
                            : m.status === "current"
                              ? "En cours"
                              : "À venir"}
                        </span>
                      </div>
                      {m.meta || m.badgeHint ? (
                        <p className="mt-1 text-xs" style={{ color: C.tertiary }}>
                          {[m.meta, m.badgeHint].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      {m.total > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1A2340]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.round((m.done / m.total) * 100)}%`,
                                background: m.status === "done" ? C.green : C.violet,
                              }}
                            />
                          </div>
                          <span className="text-xs tabular-nums" style={{ color: C.tertiary }}>
                            {m.done} / {m.total}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <h3 className="font-extrabold">Construire ton parcours avec un expert</h3>
            <p className="mt-2 text-sm" style={{ color: C.secondary }}>
              Un échange de 30 min pour prioriser les modules et ton premier badge.
            </p>
            <Link
              href={data.expertHref}
              className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ background: C.violet }}
            >
              Prendre rendez-vous
            </Link>
          </article>

          <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <h3 className="font-extrabold">Cette semaine</h3>
            <p className="mt-2 text-2xl font-extrabold">{data.week.totalLabel} d’apprentissage</p>
            <div className="mt-4 flex h-24 items-end gap-1.5">
              {data.week.bars.map((b, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${Math.max(4, Math.round(b.ratio * 72))}px`,
                      background: b.seconds > 0 ? C.violet : "#1A2340",
                    }}
                  />
                  <span className="text-[10px]" style={{ color: C.tertiary }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
