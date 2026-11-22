"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { DECLARE_LEVELS } from "@/lib/skills/declare-levels";

const C = {
  card: "#0F1428",
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  blue: "#8DB8FF",
};

type Declaration = {
  id: string;
  raw_label: string;
  match_status: string;
  level: string;
  status: string;
  kind: string;
  skills: null | {
    id: string;
    label: string;
    description?: string;
    is_soft?: boolean;
    skill_domains?: { label?: string } | null;
  };
};

function levelBars(level: string) {
  return DECLARE_LEVELS.find((l) => l.id === level)?.bars ?? 2;
}

export function LearnerCompetencesV2() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/skills/declarations", { credentials: "include" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Chargement impossible");
        if (!cancelled) setDeclarations((j.declarations ?? []) as Declaration[]);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    return declarations
      .filter((d) => d.status === "declared" || d.status === "proven")
      .map((d) => {
        const name = d.skills?.label || d.raw_label;
        const pending = d.match_status === "pending_review";
        return {
          id: d.id,
          name,
          raw: d.raw_label,
          showRaw: Boolean(d.skills?.label && d.raw_label && d.skills.label !== d.raw_label),
          pending,
          status: d.status === "proven" ? ("proved" as const) : ("declared" as const),
          bars: levelBars(d.level),
          level: d.level,
        };
      });
  }, [declarations]);

  const provedCount = rows.filter((r) => r.status === "proved").length;
  const declaredCount = rows.filter((r) => r.status === "declared").length;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-2 text-[#F2F4FA] sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">Mes compétences</h1>
          <p className="mt-1 text-sm" style={{ color: C.secondary }}>
            Ce que tu sais faire, et ce que tu peux prouver
          </p>
        </div>
        <Link
          href="/dashboard/apprenant/skills/develop"
          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0A0F1E]"
        >
          ＋ Déclarer une compétence
        </Link>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { n: provedCount, label: "Prouvées", hint: "avec une preuve", color: C.green },
          { n: declaredCount, label: "Déclarées", hint: "à appuyer par une preuve", color: C.blue },
          {
            n: rows.filter((r) => r.pending).length,
            label: "En classement",
            hint: "tes mots, en cours de rattachement",
            color: C.amber,
          },
        ].map((c) => (
          <article
            key={c.label}
            className="rounded-3xl border p-4"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              <span className="text-3xl font-extrabold tabular-nums">{c.n}</span>
            </div>
            <p className="mt-1 font-bold">{c.label}</p>
            <p className="text-xs" style={{ color: C.tertiary }}>
              {c.hint}
            </p>
          </article>
        ))}
      </section>

      <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <h2 className="text-lg font-extrabold">Mon capital de compétences</h2>
        {rows.length === 0 ? (
          <p className="mt-6 text-sm" style={{ color: C.secondary }}>
            Aucune compétence pour l’instant. Déclare-en une pour démarrer.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <div
                  className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                  style={{ borderColor: C.border, background: "#151C3A" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.pending ? r.raw : r.name}</p>
                    {r.showRaw && !r.pending ? (
                      <p className="text-xs" style={{ color: C.tertiary }}>
                        Tes mots : {r.raw}
                      </p>
                    ) : null}
                    {r.pending ? (
                      <p className="text-xs" style={{ color: C.amber }}>
                        en cours de classement
                      </p>
                    ) : null}
                    <div className="mt-2 flex gap-1">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <span
                          key={i}
                          className="h-1.5 w-5 rounded-full"
                          style={{ background: i < r.bars ? C.blue : "#1A2340" }}
                        />
                      ))}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: "#1A2340",
                      color: r.status === "proved" ? C.green : C.blue,
                    }}
                  >
                    {r.status === "proved" ? "Prouvée" : "Déclarée"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}
