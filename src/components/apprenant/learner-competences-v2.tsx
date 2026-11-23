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
  framboise: "#FF5C8A",
};

type Declaration = {
  id: string;
  raw_label: string;
  match_status: string;
  level: string;
  status: string;
  kind: string;
  proof_review_status?: string | null;
  proof_review_note?: string | null;
  skills: null | {
    id: string;
    label: string;
    description?: string;
    is_soft?: boolean;
    skill_domains?: { label?: string } | null;
  };
};

type RowStatus = "proved" | "declared" | "pending_proof" | "needs_more" | "refused";

function levelBars(level: string) {
  return DECLARE_LEVELS.find((l) => l.id === level)?.bars ?? 2;
}

function resolveProofStatus(d: Declaration): RowStatus {
  const review = String(d.proof_review_status ?? "none");
  if (d.status === "proven" || review === "validated") return "proved";
  if (review === "pending") return "pending_proof";
  if (review === "needs_more") return "needs_more";
  if (review === "refused") return "refused";
  return "declared";
}

function statusMeta(status: RowStatus) {
  switch (status) {
    case "proved":
      return { label: "Prouvée", color: C.green };
    case "pending_proof":
      return { label: "Preuve en analyse", color: C.amber };
    case "needs_more":
      return { label: "Complément demandé", color: C.amber };
    case "refused":
      return { label: "Preuve refusée", color: C.framboise };
    default:
      return { label: "Déclarée", color: C.blue };
  }
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
        const status = resolveProofStatus(d);
        return {
          id: d.id,
          name,
          raw: d.raw_label,
          showRaw: Boolean(d.skills?.label && d.raw_label && d.skills.label !== d.raw_label),
          pending,
          status,
          reviewNote: d.proof_review_note || null,
          bars: levelBars(d.level),
          level: d.level,
        };
      });
  }, [declarations]);

  const provedCount = rows.filter((r) => r.status === "proved").length;
  const declaredCount = rows.filter((r) => r.status === "declared").length;
  const reviewCount = rows.filter((r) =>
    ["pending_proof", "needs_more", "refused"].includes(r.status),
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-16 pt-1 text-[#F2F4FA]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">Mes compétences</h1>
          <p className="mt-1 text-sm" style={{ color: C.secondary }}>
            Ce que tu sais faire — « Prouvée » seulement après validation Byound
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

      <section className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { n: provedCount, label: "Prouvées", hint: "validées par Byound", color: C.green },
          { n: declaredCount, label: "Déclarées", hint: "sans preuve validée", color: C.blue },
          { n: reviewCount, label: "Preuves", hint: "en analyse / complément / refus", color: C.amber },
          {
            n: rows.filter((r) => r.pending).length,
            label: "En classement",
            hint: "tes mots, rattachement",
            color: C.violet,
          },
        ].map((c) => (
          <div key={c.label}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              <span className="text-3xl font-extrabold tabular-nums">{c.n}</span>
            </div>
            <p className="mt-1 font-bold">{c.label}</p>
            <p className="text-xs" style={{ color: C.tertiary }}>
              {c.hint}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-extrabold">Mon capital de compétences</h2>
        {rows.length === 0 ? (
          <p className="mt-6 text-sm" style={{ color: C.secondary }}>
            Aucune compétence pour l’instant. Déclare-en une pour démarrer.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#1C2443]">
            {rows.map((r) => {
              const meta = statusMeta(r.status);
              return (
                <li key={r.id} className="flex items-center gap-3 py-3.5">
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
                    {r.reviewNote && r.status !== "proved" ? (
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: C.secondary }}>
                        {r.reviewNote}
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
                  <span className="shrink-0 text-[11px] font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
