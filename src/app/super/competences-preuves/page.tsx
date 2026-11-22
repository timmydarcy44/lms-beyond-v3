"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  raw_label: string;
  kind: string;
  level: string;
  proof_url: string | null;
  proof_note: string | null;
  proof_review_status: string;
  proof_review_note: string | null;
  status: string;
  updated_at: string;
  profiles?: {
    email?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  skills?: { label?: string } | null;
};

export default function SkillsProofsReviewPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/super-admin/skills-proofs");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Chargement impossible");
      return;
    }
    setRows(json.rows ?? []);
    setWarning(json.warning ?? null);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: string, decision: "validated" | "refused" | "needs_more") => {
    setBusy(id);
    const res = await fetch("/api/super-admin/skills-proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Action impossible");
      return;
    }
    await load();
  };

  const nameOf = (row: Row) => {
    const p = row.profiles;
    const full = String(p?.full_name ?? "").trim();
    if (full) return full;
    const parts = [p?.first_name, p?.last_name].filter(Boolean).join(" ").trim();
    return parts || p?.email || "Apprenant";
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 text-[#F2F4FA]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA3BD]">Référentiel</p>
          <h1 className="mt-1 text-3xl font-extrabold">Preuves à revoir</h1>
          <p className="mt-2 text-sm text-[#9AA3BD]">
            Analyse Byound (hors Open Badge) — valider, refuser ou demander un complément.
          </p>
        </div>
        <Link href="/super/competences-a-classer" className="text-sm font-semibold text-[#8DB8FF]">
          ← À classer
        </Link>
      </div>
      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {warning ? <p className="text-sm text-[#F2CF6B]">{warning}</p> : null}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[#9AA3BD]">Aucune preuve en attente.</p>
        ) : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded-3xl border border-[#1A2340] bg-[#111831] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{row.skills?.label || row.raw_label}</p>
                <p className="mt-1 text-xs text-[#9AA3BD]">
                  {nameOf(row)} · {row.proof_review_status} · {row.level}
                </p>
              </div>
              <span className="rounded-full bg-[#1A2340] px-3 py-1 text-[11px] font-semibold text-[#F2CF6B]">
                {row.proof_review_status}
              </span>
            </div>
            {row.proof_note ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#DADDE4]">{row.proof_note}</p>
            ) : null}
            {row.proof_url ? (
              <a
                href={row.proof_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-semibold text-[#8DB8FF] underline"
              >
                Ouvrir la preuve
              </a>
            ) : null}
            {row.proof_review_note ? (
              <p className="mt-2 text-xs text-[#9AA3BD]">Analyse : {row.proof_review_note}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === row.id}
                onClick={() => void act(row.id, "validated")}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0A0F1E] disabled:opacity-40"
              >
                Valider
              </button>
              <button
                type="button"
                disabled={busy === row.id}
                onClick={() => void act(row.id, "needs_more")}
                className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Demander complément
              </button>
              <button
                type="button"
                disabled={busy === row.id}
                onClick={() => void act(row.id, "refused")}
                className="rounded-full bg-[#3A1418] px-3 py-1.5 text-xs font-bold text-[#FF7A85] disabled:opacity-40"
              >
                Refuser
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
