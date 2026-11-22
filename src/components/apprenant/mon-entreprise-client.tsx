"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileUp,
  Link2,
  Loader2,
  Mail,
  X,
} from "lucide-react";
import {
  MIN_PROOF_TEXT,
  PROGRESS_LABELS,
  progressSegments,
  type MissionStatus,
} from "@/lib/tuteur/mission-status";

const C = {
  bg: "#070B18",
  card: "#0F1428",
  border: "#1C2443",
  inner: "#151C3A",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  violetSoft: "#C9C2FF",
  blue: "#8DB8FF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  turquoise: "#5EDCC3",
  framboise: "#FF5C8A",
};

type ProofFile = { path: string; name: string; size: number; mime: string };
type ProofLink = { url: string; label?: string };

type Mission = {
  id: string;
  title: string;
  instructions: string | null;
  status: MissionStatus;
  statusLabel: string;
  statusColor: "amber" | "blue" | "green";
  dueDate: string | null;
  late: boolean;
  deliverable: string | null;
  tutorComment: string | null;
  learnerNote: string | null;
  proofUrl: string | null;
  proofLinks: ProofLink[];
  proofFiles: ProofFile[];
  submittedAt: string | null;
  validatedAt: string | null;
  tutorOpenedAt: string | null;
  skillId: string | null;
  skillLabel: string | null;
  canWithdraw: boolean;
};

type Payload = {
  assigned: boolean;
  company: null | {
    id: string;
    name: string;
    initials: string | null;
    city: string | null;
    address: string | null;
  };
  contract: null | { type: string | null; rythme: string | null };
  tutor: null | {
    id: string | null;
    name: string | null;
    shortName: string | null;
    initials: string | null;
    email: string | null;
    jobTitle: string | null;
  };
  hasActiveTutorLink?: boolean;
  missions: Mission[];
  counts: {
    todoByYou: number;
    withTutor: number;
    validated: number;
    nextDue: null | { date: string | null; title: string; id: string };
  };
};

function formatDue(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function formatDueShort(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return null;
  }
}

function statusColorHex(c: Mission["statusColor"]) {
  if (c === "green") return C.green;
  if (c === "blue") return C.blue;
  return C.amber;
}

function ProgressBar({ status }: { status: MissionStatus }) {
  const segs = progressSegments(status);
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex gap-1">
        {segs.map((s, i) => (
          <span
            key={PROGRESS_LABELS[i]}
            className="h-1.5 flex-1 rounded-full"
            style={{
              background: s === "done" ? C.green : s === "current" ? C.amber : "#1A2340",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px]" style={{ color: C.tertiary }}>
        {PROGRESS_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export function MonEntrepriseClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "validated">("open");
  const [mobileDetail, setMobileDetail] = useState(false);

  const [note, setNote] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [links, setLinks] = useState<ProofLink[]>([]);
  const [files, setFiles] = useState<ProofFile[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/dashboard/apprenant/entreprise", { credentials: "include" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Chargement impossible");
    setData(j as Payload);
    return j as Payload;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load()
      .then((payload) => {
        if (cancelled) return;
        const firstAction =
          payload.missions.find((m) => m.status === "changes_requested" || m.status === "assigned") ??
          payload.missions.find((m) => m.status === "submitted") ??
          payload.missions[0];
        setSelectedId(firstAction?.id ?? null);
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
  }, [load]);

  const selected = useMemo(
    () => data?.missions.find((m) => m.id === selectedId) ?? null,
    [data, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setNote(selected.learnerNote ?? "");
    setLinks(selected.proofLinks?.length ? selected.proofLinks : selected.proofUrl ? [{ url: selected.proofUrl }] : []);
    setFiles(selected.proofFiles ?? []);
    setPendingFile(null);
    setLinkDraft("");
    setDraftSaved(false);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave brouillon
  useEffect(() => {
    if (!selected || !["assigned", "changes_requested"].includes(selected.status)) return;
    if (note === (selected.learnerNote ?? "") && !pendingFile && links.length === (selected.proofLinks?.length ?? 0)) {
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        const form = new FormData();
        form.set("action", "save_draft");
        form.set("learnerNote", note);
        form.set("proofLinks", JSON.stringify(links));
        if (pendingFile) form.set("file", pendingFile);
        const r = await fetch(`/api/dashboard/apprenant/entreprise/missions/${selected.id}`, {
          method: "PATCH",
          body: form,
        });
        if (r.ok) {
          setDraftSaved(true);
          setPendingFile(null);
          const j = await r.json().catch(() => null);
          if (Array.isArray(j?.proofFiles)) setFiles(j.proofFiles);
          await load();
        }
      })();
    }, 900);
    return () => window.clearTimeout(t);
  }, [note, links, pendingFile, selected?.id, selected?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!selected) return;
    if (note.trim().length < MIN_PROOF_TEXT) {
      setError(`Écris au moins ${MIN_PROOF_TEXT} caractères pour décrire ton travail.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("action", "submit");
      form.set("learnerNote", note.trim());
      form.set("proofLinks", JSON.stringify(links));
      if (pendingFile) form.set("file", pendingFile);
      const r = await fetch(`/api/dashboard/apprenant/entreprise/missions/${selected.id}`, {
        method: "PATCH",
        body: form,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Envoi impossible");
      await load();
      setMobileDetail(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!selected?.canWithdraw) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/dashboard/apprenant/entreprise/missions/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Retrait impossible");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const addLink = () => {
    const url = linkDraft.trim();
    if (!url) return;
    setLinks((prev) => [...prev, { url }]);
    setLinkDraft("");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  if (!data?.assigned || !data.company) {
    return (
      <div className="mx-auto max-w-3xl pb-16 pt-1 text-[#F2F4FA]">
        <h1 className="text-[34px] font-extrabold tracking-tight">Mon entreprise</h1>
        <p className="mt-3 text-sm" style={{ color: C.secondary }}>
          Aucune entreprise d’accueil n’est encore rattachée.
        </p>
        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}
      </div>
    );
  }

  const { company, tutor, contract, missions, counts } = data;
  const openMissions = missions.filter((m) => m.status !== "validated");
  const validatedMissions = missions.filter((m) => m.status === "validated");
  const list = filter === "open" ? openMissions : validatedMissions;

  const metaBits = [
    company.city,
    contract?.type,
    contract?.rythme,
  ].filter(Boolean);

  const writeHref = tutor?.email ? `mailto:${tutor.email}` : null;

  const selectMission = (id: string) => {
    setSelectedId(id);
    setMobileDetail(true);
    setError(null);
  };

  const detailPanel = selected ? (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: statusColorHex(selected.statusColor) }}>
          Mission · {selected.statusLabel.toLowerCase()}
        </p>
        <button type="button" onClick={() => setMobileDetail(false)} aria-label="Fermer" className="rounded-full p-2" style={{ background: C.inner }}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="hidden text-xs font-semibold uppercase tracking-wide lg:block" style={{ color: statusColorHex(selected.statusColor) }}>
        Mission · {selected.statusLabel.toLowerCase()}
      </p>
      <h2 className="mt-2 text-xl font-extrabold text-white">{selected.title}</h2>

      {selected.instructions ? (
        <div className="mt-4">
          <p className="text-xs font-semibold" style={{ color: C.tertiary }}>
            Ce qu’on attend de toi
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: C.secondary }}>
            {selected.instructions}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {selected.deliverable ? (
          <div className="rounded-xl p-3" style={{ background: C.inner }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: C.tertiary }}>
              Livrable
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{selected.deliverable}</p>
          </div>
        ) : null}
        {selected.dueDate ? (
          <div className="rounded-xl p-3" style={{ background: C.inner }}>
            <p className="text-[10px] font-semibold uppercase" style={{ color: C.tertiary }}>
              Échéance
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{formatDue(selected.dueDate)}</p>
          </div>
        ) : null}
      </div>

      {["assigned", "changes_requested"].includes(selected.status) ? (
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <p className="text-sm font-extrabold text-white">Prouve ton travail</p>
          {selected.status === "changes_requested" && selected.tutorComment ? (
            <div className="mt-3 rounded-xl border p-3 text-sm" style={{ borderColor: C.amber, color: C.amber }}>
              Message du tuteur : {selected.tutorComment}
            </div>
          ) : null}
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setDraftSaved(false);
            }}
            rows={5}
            placeholder="Ce que tu as fait, en quelques lignes. Ex. : 180 entreprises listées, 64 appels, 9 rendez-vous pris…"
            className="mt-3 w-full resize-none rounded-xl border bg-transparent p-3 text-sm text-white outline-none placeholder:text-white/25"
            style={{ borderColor: C.border, background: C.bg }}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-4 text-center text-xs"
              style={{ borderColor: C.border, color: C.secondary }}
            >
              <FileUp className="h-4 w-4" />
              {pendingFile ? pendingFile.name : "Ajouter un fichier"}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xls,.xlsx,.csv,.doc,.docx"
                className="sr-only"
                onChange={(e) => {
                  setPendingFile(e.target.files?.[0] ?? null);
                  setDraftSaved(false);
                }}
              />
            </label>
            <div className="rounded-xl border border-dashed px-3 py-3" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: C.secondary }}>
                <Link2 className="h-4 w-4" /> Ajouter un lien
              </div>
              <input
                type="url"
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onBlur={addLink}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
                placeholder="https://…"
                className="mt-2 w-full bg-transparent text-xs text-white outline-none placeholder:text-white/25"
              />
            </div>
          </div>
          {files.length || links.length ? (
            <ul className="mt-2 space-y-1 text-xs" style={{ color: C.secondary }}>
              {files.map((f) => (
                <li key={f.path}>📎 {f.name}</li>
              ))}
              {links.map((l) => (
                <li key={l.url} className="flex items-center justify-between gap-2">
                  <span className="truncate">🔗 {l.url}</span>
                  <button type="button" className="text-[10px]" onClick={() => setLinks((prev) => prev.filter((x) => x.url !== l.url))}>
                    retirer
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selected.skillLabel ? (
            <div className="mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed" style={{ background: "rgba(110,91,255,0.18)", color: C.violetSoft }}>
              ✦ Une fois validée, cette preuve s’ajoute aussi à ta compétence <strong>{selected.skillLabel}</strong>.
            </div>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-xs" style={{ color: draftSaved ? C.green : C.tertiary }}>
              {draftSaved ? "Brouillon enregistré" : "Brouillon…"}
            </p>
            <button
              type="button"
              disabled={busy || note.trim().length < MIN_PROOF_TEXT}
              onClick={() => void submit()}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E] disabled:opacity-40"
            >
              {busy ? "Envoi…" : "Envoyer à mon tuteur →"}
            </button>
          </div>
        </div>
      ) : null}

      {selected.status === "submitted" ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-extrabold text-white">Preuve envoyée</p>
          {selected.learnerNote ? (
            <p className="whitespace-pre-wrap text-sm" style={{ color: C.secondary }}>
              {selected.learnerNote}
            </p>
          ) : null}
          {selected.submittedAt ? (
            <p className="text-xs" style={{ color: C.tertiary }}>
              Envoyée le {formatDue(selected.submittedAt)}
            </p>
          ) : null}
          <p className="text-sm font-semibold" style={{ color: C.blue }}>
            En attente de ton tuteur
          </p>
          {selected.canWithdraw ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void withdraw()}
              className="rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: C.border }}
            >
              Retirer l’envoi
            </button>
          ) : (
            <p className="text-xs" style={{ color: C.tertiary }}>
              Ton tuteur a déjà ouvert la preuve.
            </p>
          )}
        </div>
      ) : null}

      {selected.status === "validated" ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm font-extrabold" style={{ color: C.green }}>
            Validée
            {selected.validatedAt ? ` · ${formatDue(selected.validatedAt)}` : ""}
          </p>
          {tutor?.shortName ? (
            <p className="text-sm" style={{ color: C.secondary }}>
              Par {tutor.shortName}
            </p>
          ) : null}
          {selected.tutorComment ? (
            <p className="text-sm" style={{ color: C.secondary }}>
              {selected.tutorComment}
            </p>
          ) : null}
          {selected.learnerNote ? (
            <div className="rounded-xl p-3" style={{ background: C.inner }}>
              <p className="text-xs font-semibold" style={{ color: C.tertiary }}>
                Ta preuve
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-white">{selected.learnerNote}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : (
    <p className="text-sm" style={{ color: C.secondary }}>
      Sélectionne une mission pour voir le détail.
    </p>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 pt-1 text-[#F2F4FA]">
      {/* Header entreprise */}
      <section
        className="overflow-hidden rounded-[28px] p-5 sm:p-6"
        style={{
          background: "linear-gradient(135deg, #0B3D3A 0%, #0F2A3A 45%, #12203A 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-[#0A0F1E]"
              style={{ background: C.green }}
            >
              {company.initials || "E"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: C.turquoise }}>
                Entreprise d’accueil
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{company.name}</h1>
              {metaBits.length ? (
                <p className="mt-2 text-sm" style={{ color: C.secondary }}>
                  {metaBits.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
          {tutor?.shortName || tutor?.email ? (
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: "rgba(7,11,24,0.35)" }}>
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: C.inner, color: C.blue }}
              >
                {tutor.initials || "T"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{tutor.shortName || tutor.name}</p>
                <p className="text-[11px]" style={{ color: C.tertiary }}>
                  Ton tuteur
                </p>
              </div>
              {writeHref ? (
                <a
                  href={writeHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#0A0F1E]"
                >
                  <Mail className="h-3.5 w-3.5" /> Écrire
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* Compteurs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            n: String(counts.todoByYou),
            label: "À faire par toi",
            hint: counts.todoByYou ? "Ajouter une preuve" : "Rien pour l’instant",
          },
          {
            n: String(counts.withTutor),
            label: "Chez ton tuteur",
            hint: "En attente de validation",
          },
          {
            n: String(counts.validated),
            label: "Validées",
            hint: "Elles comptent pour ton titre pro.",
          },
          {
            n: counts.nextDue?.date ? formatDueShort(counts.nextDue.date) || "—" : "—",
            label: "Prochaine échéance",
            hint: counts.nextDue?.title || "Aucune échéance",
          },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border p-4" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-2xl font-extrabold tabular-nums">
              {c.n}{" "}
              <span className="text-sm font-bold" style={{ color: C.secondary }}>
                {c.label}
              </span>
            </p>
            <p className="mt-1 text-xs" style={{ color: C.tertiary }}>
              {c.hint}
            </p>
          </div>
        ))}
      </section>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {/* Grille liste + détail */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_520px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold">Mes missions</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("open")}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: filter === "open" ? C.violet : C.inner,
                  color: filter === "open" ? "#fff" : C.secondary,
                }}
              >
                En cours · {openMissions.length}
              </button>
              <button
                type="button"
                onClick={() => setFilter("validated")}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: filter === "validated" ? C.violet : C.inner,
                  color: filter === "validated" ? "#fff" : C.secondary,
                }}
              >
                Validées · {validatedMissions.length}
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {list.length === 0 ? (
              <li className="text-sm" style={{ color: C.secondary }}>
                Aucune mission dans ce filtre.
              </li>
            ) : null}
            {list.map((m) => {
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectMission(m.id)}
                    className="w-full rounded-2xl border p-4 text-left transition"
                    style={{
                      background: C.card,
                      borderColor: active ? C.violet : C.border,
                      boxShadow: active ? `0 0 0 1px ${C.violet}` : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] font-bold" style={{ color: statusColorHex(m.statusColor) }}>
                        {m.statusLabel}
                      </span>
                      {m.dueDate ? (
                        <span className="text-[11px]" style={{ color: C.tertiary }}>
                          {formatDue(m.dueDate)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 font-bold text-white">{m.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.skillLabel ? (
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(110,91,255,0.2)", color: C.violetSoft }}>
                          ✦ {m.skillLabel}
                        </span>
                      ) : null}
                      {m.deliverable ? (
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: C.inner, color: C.secondary }}>
                          Livrable · {m.deliverable}
                        </span>
                      ) : null}
                    </div>
                    {m.learnerNote && m.status === "submitted" ? (
                      <p className="mt-2 line-clamp-2 text-xs italic" style={{ color: C.secondary }}>
                        « {m.learnerNote} »
                      </p>
                    ) : null}
                    <ProgressBar status={m.status} />
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard/apprenant/planning" className="text-sm font-semibold" style={{ color: C.blue }}>
              Planning →
            </Link>
            <Link href="/dashboard/apprenant/livret" className="text-sm font-semibold" style={{ color: C.blue }}>
              Livret →
            </Link>
          </div>
        </div>

        {/* Desktop detail */}
        <aside
          className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-y-auto rounded-[28px] border p-5 lg:block"
          style={{ background: C.card, borderColor: C.border }}
        >
          {detailPanel}
        </aside>
      </section>

      {/* Mobile full-screen detail */}
      {mobileDetail && selected ? (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 lg:hidden" style={{ background: C.bg }}>
          <div className="mx-auto min-h-full max-w-lg rounded-[28px] border p-5" style={{ background: C.card, borderColor: C.border }}>
            {detailPanel}
          </div>
        </div>
      ) : null}
    </div>
  );
}
