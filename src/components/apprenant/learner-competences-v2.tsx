"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import { DECLARE_LEVELS } from "@/lib/skills/declare-levels";
import { formatProofNoteForLearner } from "@/lib/skills/proof-note-display";

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
  proof_url?: string | null;
  proof_note?: string | null;
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

type Row = {
  id: string;
  name: string;
  raw: string;
  showRaw: boolean;
  pending: boolean;
  status: RowStatus;
  reviewNote: string | null;
  proofUrl: string | null;
  proofNote: string | null;
  bars: number;
  level: string;
};

export function LearnerCompetencesV2() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const r = await fetch("/api/skills/declarations", { credentials: "include" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Chargement impossible");
    setDeclarations((j.declarations ?? []) as Declaration[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void reload()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const rows = useMemo(() => {
    return declarations
      .filter((d) => d.status === "declared" || d.status === "proven")
      .map((d): Row => {
        const name = d.skills?.label || d.raw_label;
        const pending = d.match_status === "pending_review";
        const status = resolveProofStatus(d);
        const reviewNote = formatProofNoteForLearner(d.proof_review_note, status);
        return {
          id: d.id,
          name,
          raw: d.raw_label,
          showRaw: Boolean(d.skills?.label && d.raw_label && d.skills.label !== d.raw_label),
          pending,
          status,
          reviewNote,
          proofUrl: d.proof_url || null,
          proofNote: d.proof_note || null,
          bars: levelBars(d.level),
          level: d.level,
        };
      });
  }, [declarations]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const canComplement = selected?.status === "needs_more" || selected?.status === "declared";
  const readOnly = selected?.status === "proved" || selected?.status === "pending_proof";

  const provedCount = rows.filter((r) => r.status === "proved").length;
  const declaredCount = rows.filter((r) => r.status === "declared").length;
  const reviewCount = rows.filter((r) =>
    ["pending_proof", "needs_more", "refused"].includes(r.status),
  ).length;

  async function submitComplement() {
    if (!selected || !canComplement) return;
    if (!proofUrl.trim() && !proofNote.trim() && !proofFile) {
      setPanelError("Ajoute un fichier, un lien ou une note.");
      return;
    }
    setBusy(true);
    setPanelError(null);
    try {
      const form = new FormData();
      if (proofUrl.trim()) form.set("proofUrl", proofUrl.trim());
      if (proofNote.trim()) form.set("proofNote", proofNote.trim());
      if (proofFile) form.set("file", proofFile);
      const res = await fetch(`/api/skills/declarations/${selected.id}/proof`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof json?.error === "string" ? json.error : `Envoi impossible (${res.status})`,
        );
      }
      setProofUrl("");
      setProofNote("");
      setProofFile(null);
      await reload();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSkill() {
    if (!selected) return;
    if (!window.confirm(`Supprimer la compétence « ${selected.name} » ?`)) return;
    setBusy(true);
    setPanelError(null);
    try {
      const res = await fetch(`/api/skills/declarations/${selected.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof json?.error === "string" ? json.error : "Suppression impossible");
      }
      setSelectedId(null);
      await reload();
    } catch (e) {
      setPanelError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

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
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id);
                      setPanelError(null);
                      setProofUrl("");
                      setProofNote("");
                      setProofFile(null);
                    }}
                    className="flex w-full items-center gap-3 py-3.5 text-left transition hover:bg-white/[0.03]"
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
                      {r.reviewNote && r.status !== "proved" ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: C.secondary }}>
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
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-5 shadow-xl"
            style={{ background: C.card, borderColor: C.border }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="skill-panel-title"
          >
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
              onClick={() => setSelectedId(null)}
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            <p id="skill-panel-title" className="pr-8 text-lg font-extrabold">
              {selected.name}
            </p>
            <p className="mt-1 text-xs font-semibold" style={{ color: statusMeta(selected.status).color }}>
              {statusMeta(selected.status).label}
            </p>
            {selected.reviewNote ? (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: C.secondary }}>
                {selected.reviewNote}
              </p>
            ) : null}

            {(selected.proofUrl || selected.proofNote) && readOnly ? (
              <div className="mt-4 space-y-2 rounded-xl border p-3 text-sm" style={{ borderColor: C.border }}>
                {selected.proofUrl ? (
                  <p>
                    <span style={{ color: C.tertiary }}>Lien · </span>
                    <a
                      href={selected.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8DB8FF] underline-offset-2 hover:underline"
                    >
                      Voir la preuve
                    </a>
                  </p>
                ) : null}
                {selected.proofNote ? (
                  <p style={{ color: C.secondary }}>
                    <span style={{ color: C.tertiary }}>Note · </span>
                    {selected.proofNote}
                  </p>
                ) : null}
                <p className="text-xs" style={{ color: C.tertiary }}>
                  Compétence validée — consultation uniquement.
                </p>
              </div>
            ) : null}

            {canComplement ? (
              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.tertiary }}>
                  Ajouter un élément
                </p>
                <label className="block text-xs" style={{ color: C.secondary }}>
                  Fichier
                  <input
                    type="file"
                    className="mt-1 block w-full text-sm text-white/80"
                    onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="block text-xs" style={{ color: C.secondary }}>
                  Lien
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                    style={{ borderColor: C.border }}
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-xs" style={{ color: C.secondary }}>
                  Note
                  <textarea
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-white outline-none"
                    style={{ borderColor: C.border }}
                    placeholder="Faits concrets liés à la compétence…"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submitComplement()}
                  className="w-full rounded-full bg-white py-2.5 text-sm font-bold text-[#0A0F1E] disabled:opacity-50"
                >
                  {busy ? "Envoi…" : "Envoyer le complément"}
                </button>
              </div>
            ) : null}

            {selected.status === "refused" ? (
              <p className="mt-4 text-xs" style={{ color: C.tertiary }}>
                Tu peux supprimer cette déclaration ou en créer une nouvelle si tu as une autre preuve.
              </p>
            ) : null}

            {panelError ? <p className="mt-3 text-sm text-[#FF8A9B]">{panelError}</p> : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void deleteSkill()}
                className="rounded-full border px-4 py-2 text-xs font-semibold text-[#FF8A9B] disabled:opacity-50"
                style={{ borderColor: "#5A2030" }}
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-full border px-4 py-2 text-xs font-semibold text-white/70"
                style={{ borderColor: C.border }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
