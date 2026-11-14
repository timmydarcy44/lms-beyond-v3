"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HandicapHomePayload } from "@/lib/handicap/home-data";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";

const TONE_BAR: Record<string, string> = {
  amber: T.amber,
  teal: T.accent,
  red: T.red,
  blue: T.blue,
};

const NEXT_TONE: Record<string, string> = {
  green: T.green,
  amber: T.amber,
  red: T.red,
  blue: T.blue,
  muted: T.muted,
};

const STATUS_PILL: Record<string, { bg: string; color: string }> = {
  active: { bg: "rgba(107,227,155,0.15)", color: T.green },
  plan: { bg: "rgba(107,227,155,0.15)", color: T.green },
  request: { bg: "rgba(242,207,107,0.15)", color: T.amber },
  interview: { bg: "rgba(141,184,255,0.15)", color: T.blue },
  review: { bg: "rgba(141,184,255,0.15)", color: T.blue },
  closed: { bg: "rgba(108,117,147,0.2)", color: T.muted },
};

type Filter = "cours" | "demandes" | "plans" | "clos";

export function HandicapHome({ data }: { data: HandicapHomePayload }) {
  const [filter, setFilter] = useState<Filter>("cours");
  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  const filtered = data.people.filter((p) => {
    if (filter === "demandes") return p.status === "request";
    if (filter === "plans") return p.status === "active" || p.status === "plan";
    if (filter === "clos") return p.status === "closed";
    return p.status !== "closed";
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[13px] capitalize" style={{ color: T.muted }}>
          {dateLabel}
        </p>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">
          Bonjour {data.firstName}
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: T.muted }}>
          {data.counts.accompanied} personnes accompagnées · {data.counts.requests} nouvelles
          demandes · {data.counts.meetingsToday} rendez-vous aujourd&apos;hui
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section
          className="rounded-[24px] border p-5"
          style={{
            background: T.card,
            borderColor: T.border,
            borderTop: `3px solid ${T.accent}`,
          }}
        >
          <h2 className="text-[16px] font-extrabold">À faire</h2>
          {data.todos.length === 0 ? (
            <p className="mt-4 text-sm" style={{ color: T.muted }}>
              Rien d&apos;urgent pour le moment.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-stretch gap-3 rounded-2xl border px-3 py-3"
                  style={{ background: T.inner, borderColor: T.borderSoft }}
                >
                  <span
                    className="w-[3px] shrink-0 rounded-full"
                    style={{ background: TONE_BAR[todo.tone] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: TONE_BAR[todo.tone] }}
                    >
                      {todo.tag}
                    </p>
                    <p className="mt-0.5 text-[14px] font-bold">{todo.title}</p>
                    <p className="text-[12px]" style={{ color: T.muted }}>
                      {todo.subtitle}
                    </p>
                  </div>
                  <Link
                    href={todo.href}
                    className="self-center rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{
                      background: todo.tone === "red" ? "rgba(255,138,155,0.12)" : "rgba(255,255,255,0.06)",
                      color: todo.tone === "red" ? T.red : T.text,
                    }}
                  >
                    {todo.cta}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-4">
          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold">Prochains rendez-vous</h2>
              <Link href="/handicap/rendez-vous" className="text-[12px] font-semibold" style={{ color: T.accent }}>
                Agenda ›
              </Link>
            </div>
            {data.upcomingMeetings.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                Aucun rendez-vous planifié.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.upcomingMeetings.slice(0, 3).map((m) => {
                  const d = new Date(m.scheduledAt);
                  const day = d.getDate();
                  const mon = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
                  const hour = d.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <div
                        className="grid h-[52px] w-[48px] place-content-center rounded-2xl text-center"
                        style={{
                          background: m.isToday ? T.accent : T.inner,
                          color: m.isToday ? T.bg : T.text,
                        }}
                      >
                        <span className="text-[16px] font-extrabold leading-none">{day}</span>
                        <span className="text-[10px] font-bold uppercase">{mon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold">{m.personName}</p>
                        <p className="text-[12px]" style={{ color: T.muted }}>
                          {hour} · {m.title}
                          {m.mode ? ` · ${m.mode}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold">Registre Qualiopi</h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(94,220,195,0.12)", color: T.accent }}
              >
                Indicateur 26
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3" style={{ background: T.inner }}>
                <p className="text-[22px] font-extrabold">
                  {data.counts.plansFormalized}
                  <span style={{ color: T.muted }}> / {data.counts.casesOutsideRequests}</span>
                </p>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  plans formalisés
                </p>
              </div>
              <div className="rounded-2xl p-3" style={{ background: T.inner }}>
                <p className="text-[22px] font-extrabold">{data.counts.partnersDistinct}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  partenaires mobilisés
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: T.muted }}>
              Le registre ne contient que des données anonymisées : besoins, actions et dates,
              jamais la nature du handicap.
            </p>
            <a
              href="/api/handicap/registre?format=pdf"
              className="mt-4 inline-flex rounded-full px-4 py-2.5 text-[13px] font-bold"
              style={{ background: T.accent, color: T.bg }}
            >
              Exporter le registre (PDF)
            </a>
          </section>
        </div>
      </div>

      <section
        className="rounded-[24px] border p-5"
        style={{ background: T.card, borderColor: T.border }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-extrabold">Personnes accompagnées</h2>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["cours", `En cours (${data.counts.inProgress + data.counts.requests})`],
                ["demandes", `Demandes (${data.counts.requests})`],
                ["plans", `Plans actifs (${data.counts.plansActive})`],
                ["clos", `Clos (${data.counts.closed})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{
                  background: filter === id ? T.accent : "transparent",
                  color: filter === id ? T.bg : T.muted,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr style={{ color: T.tertiary }}>
                <th className="pb-3 font-semibold">Personne</th>
                <th className="pb-3 font-semibold">Étape</th>
                <th className="pb-3 font-semibold">Aménagements</th>
                <th className="pb-3 font-semibold">Prochaine étape</th>
                <th className="pb-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8" style={{ color: T.muted }}>
                    Aucune personne dans ce filtre.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const pill = STATUS_PILL[p.status] ?? STATUS_PILL.closed;
                  const shown = p.accommodations.slice(0, 3);
                  const extra = p.accommodations.length - shown.length;
                  return (
                    <tr key={p.id} className="border-t" style={{ borderColor: T.border }}>
                      <td className="py-3.5 pr-3">
                        <p className="font-bold">{p.personName}</p>
                        <p className="text-[12px]" style={{ color: T.muted }}>
                          {p.roleLine}
                        </p>
                      </td>
                      <td className="py-3.5 pr-3">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: pill.bg, color: pill.color }}
                        >
                          {p.statusLabel}
                        </span>
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="flex flex-wrap gap-1">
                          {shown.length === 0 ? (
                            <span style={{ color: T.tertiary }}>—</span>
                          ) : (
                            shown.map((a) => (
                              <span
                                key={a}
                                className="rounded-full px-2 py-1 text-[11px] font-semibold"
                                style={{ background: T.inner, color: T.muted }}
                              >
                                {a}
                              </span>
                            ))
                          )}
                          {extra > 0 ? (
                            <span
                              className="rounded-full px-2 py-1 text-[11px] font-semibold"
                              style={{ background: T.inner, color: T.muted }}
                            >
                              +{extra}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td
                        className="py-3.5 pr-3 font-semibold"
                        style={{ color: NEXT_TONE[p.nextStep.tone] }}
                      >
                        {p.nextStep.text}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/handicap/personnes/${p.id}`}
                          className="text-[16px] font-bold"
                          style={{ color: T.muted }}
                        >
                          ›
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
