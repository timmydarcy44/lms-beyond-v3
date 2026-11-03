"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectChip } from "@/components/expert/register/expert-register-ui";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3.5 text-[15px] font-medium text-white outline-none placeholder:text-white/35 focus:border-[#7C83FF]";

const aiButton =
  "rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

const PUBLICS = ["Managers", "Commerciaux", "Équipes RH", "Direction", "Nouveaux arrivants", "Tous les collaborateurs"];
const FORMATS = ["En entreprise", "Au sein de Byound (Caen)", "E-learning", "Visio"];

const STATUS_LABEL: Record<FormationProposal["status"], string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function priceAmount(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return null;
  return Math.round(amount);
}

function RevolutLines({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const rows = value.length ? value : [""];
  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={`${placeholder}-${index}`} className="flex items-center gap-2">
          <input
            className={field}
            value={row}
            placeholder={`${placeholder} ${index + 1}`}
            onChange={(event) => {
              const next = [...rows];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            aria-label="Supprimer"
            onClick={() => {
              const next = rows.filter((_, rowIndex) => rowIndex !== index);
              onChange(next.length ? next : [""]);
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/70"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]"
      >
        Ajouter une ligne
      </button>
    </div>
  );
}

export function ProposeFormationForm({ proposals }: { proposals: FormationProposal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [presentation, setPresentation] = useState("");
  const [objectives, setObjectives] = useState<string[]>([""]);
  const [prerequisites, setPrerequisites] = useState<string[]>([""]);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [formats, setFormats] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<"presentation" | "content" | "objectifs" | "prerequis" | null>(null);
  const [sent, setSent] = useState(false);

  const draftLines = async (kind: "objectifs" | "prerequis") => {
    if (title.trim().length < 3) {
      toast.error("Indiquez d'abord le nom de la formation.");
      return;
    }
    if (presentation.trim().length < 40) {
      toast.error("Décrivez d'abord la formation.");
      return;
    }
    setAi(kind);
    try {
      const res = await fetch("/api/course-builder/lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, title, context: presentation }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(json?.lines) || !json.lines.length) {
        throw new Error(json?.error || "Byound AI n'a pas répondu.");
      }
      const next = json.lines.map((line: unknown) => String(line));
      if (kind === "objectifs") setObjectives(next);
      else setPrerequisites(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Byound AI n'a pas répondu.");
    } finally {
      setAi(null);
    }
  };

  const draft = async (kind: "presentation" | "content") => {
    if (title.trim().length < 3) {
      toast.error("Indiquez d'abord le nom de la formation.");
      return;
    }
    if (kind === "content" && presentation.trim().length < 40) {
      toast.error("Décrivez d'abord la formation.");
      return;
    }
    setAi(kind);
    try {
      const res = await fetch("/api/expert/formations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          presentation,
          objectives: objectives.filter((line) => line.trim()).join("\n"),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.text) throw new Error(json?.error || "Byound AI n'a pas répondu.");
      if (kind === "presentation") setPresentation(String(json.text));
      else setContent(String(json.text));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Byound AI n'a pas répondu.");
    } finally {
      setAi(null);
    }
  };

  const submit = async () => {
    const objectiveText = objectives.map((line) => line.trim()).filter(Boolean).join("\n");
    const prerequisiteText = prerequisites.map((line) => line.trim()).filter(Boolean).join("\n");
    const amount = priceAmount(price);
    const missing =
      title.trim().length < 3
        ? "Indiquez le nom de la formation."
        : presentation.trim().length < 8
          ? "Décrivez la formation."
          : !objectiveText
            ? "Ajoutez au moins un objectif pédagogique."
            : !prerequisiteText
              ? "Ajoutez au moins un prérequis."
              : !audiences.length
                ? "Choisissez au moins un public."
                : amount == null
                  ? "Indiquez le tarif souhaité."
                  : !formats.length
                    ? "Choisissez au moins un format."
                    : content.trim().length < 8
                      ? "Décrivez le contenu de la formation."
                      : null;
    if (missing || amount == null) {
      toast.error(missing ?? "Indiquez le tarif souhaité.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/expert/formations/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          presentation,
          objectives: objectiveText,
          prerequisites: prerequisiteText,
          audiences,
          priceEur: amount,
          formats,
          content,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Envoi impossible.");
      setTitle("");
      setPresentation("");
      setObjectives([""]);
      setPrerequisites([""]);
      setAudiences([]);
      setPrice("");
      setFormats([]);
      setContent("");
      setSent(true);
      toast.success(json?.mailed ? "Proposition envoyée. Byound a été prévenu." : "Proposition envoyée.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {sent ? (
        <p className="rounded-[24px] border border-white/10 bg-white/[0.06] px-5 py-4 text-sm font-semibold text-white" role="status">
          Proposition envoyée. Byound a reçu l’alerte.
        </p>
      ) : null}
      <form
        className="space-y-6 rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-xl sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">Nom de la formation</span>
          <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
        </label>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Décrire la formation</p>
            <button type="button" className={aiButton} disabled={ai === "presentation"} onClick={() => void draft("presentation")}>
              {ai === "presentation" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <textarea className={`${field} min-h-32`} value={presentation} onChange={(event) => setPresentation(event.target.value)} maxLength={4000} placeholder="À la main, ou avec Byound AI" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Objectifs pédagogiques</p>
            <button type="button" className={aiButton} disabled={ai === "objectifs"} onClick={() => void draftLines("objectifs")}>
              {ai === "objectifs" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <p className="text-xs text-white/40">Byound AI lit la description ci-dessus.</p>
          <RevolutLines value={objectives} onChange={setObjectives} placeholder="Objectif" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Prérequis</p>
            <button type="button" className={aiButton} disabled={ai === "prerequis"} onClick={() => void draftLines("prerequis")}>
              {ai === "prerequis" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <RevolutLines value={prerequisites} onChange={setPrerequisites} placeholder="Prérequis" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Publics</p>
          <div className="flex flex-wrap gap-2">
            {PUBLICS.map((item) => (
              <SelectChip key={item} label={item} selected={audiences.includes(item)} onToggle={() => setAudiences((current) => toggle(current, item))} />
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">Tarif souhaité (€)</span>
          <input
            className={field}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="1500"
            value={price}
            onChange={(event) => setPrice(event.target.value.replace(/[^\d\s.,]/g, ""))}
          />
        </label>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">Formats</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((item) => (
              <SelectChip key={item} label={item} selected={formats.includes(item)} onToggle={() => setFormats((current) => toggle(current, item))} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Contenu</p>
            <button type="button" className={aiButton} disabled={ai === "content"} onClick={() => void draft("content")}>
              {ai === "content" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <textarea className={`${field} min-h-36`} value={content} onChange={(event) => setContent(event.target.value)} maxLength={6000} placeholder="Les modules, à la main ou avec Byound AI" />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center rounded-full bg-white text-[15px] font-extrabold text-[#07080B] disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Proposer la formation"}
        </button>
      </form>

      {proposals.length ? (
        <ul className="space-y-3">
          {proposals.map((item) => (
            <li key={item.id} className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-extrabold text-white">{item.title}</p>
                <span className="shrink-0 text-xs font-bold text-white/45">{STATUS_LABEL[item.status]}</span>
              </div>
              {item.reviewNote ? <p className="mt-2 text-sm text-white/55">{item.reviewNote}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/45">Aucune proposition envoyée.</p>
      )}
    </div>
  );
}
