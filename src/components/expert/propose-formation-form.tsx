"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LineList } from "@/components/formation-builder/line-list";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const field =
  "w-full rounded-2xl border border-[#E3E0D8] bg-white px-3 py-3 text-sm text-[#07080B] outline-none placeholder:text-[#8A8F98] focus:border-[#6E5BFF]";

const aiButton = "rounded-full bg-[#EEEBFF] px-4 py-2 text-sm font-semibold text-[#4B3BD1] disabled:opacity-50";

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
    if (!title.trim() || presentation.trim().length < 40 || !objectiveText || !prerequisiteText || !audiences.length || !formats.length || content.trim().length < 20 || price.trim() === "") {
      toast.error("Complétez le nom, la description, les objectifs, les prérequis, les publics, le tarif, les formats et le contenu.");
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
          priceEur: Number(price),
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
    <div className="space-y-8">
      {sent ? (
        <p className="rounded-[24px] bg-[#E3F6EC] px-5 py-4 text-sm font-semibold text-[#126B3B]" role="status">
          Proposition envoyée. Byound a reçu l’alerte.
        </p>
      ) : null}
      <form
        className="space-y-5 rounded-[28px] bg-white p-6 text-[#07080B] sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Nom de la formation</span>
          <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
        </label>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Décrire la formation</p>
            <button type="button" className={aiButton} disabled={ai === "presentation"} onClick={() => void draft("presentation")}>
              {ai === "presentation" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <textarea className={`${field} min-h-32`} value={presentation} onChange={(event) => setPresentation(event.target.value)} maxLength={4000} placeholder="À la main, ou avec Byound AI" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Objectifs pédagogiques</p>
            <button type="button" className={aiButton} disabled={ai === "objectifs"} onClick={() => void draftLines("objectifs")}>
              {ai === "objectifs" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <p className="text-xs text-[#6B6F7A]">Byound AI lit la description ci-dessus.</p>
          <LineList value={objectives} onChange={setObjectives} placeholder="Objectif" kind="objectifs" title={title} hideAi />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Prérequis</p>
            <button type="button" className={aiButton} disabled={ai === "prerequis"} onClick={() => void draftLines("prerequis")}>
              {ai === "prerequis" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <LineList value={prerequisites} onChange={setPrerequisites} placeholder="Prérequis" kind="prerequis" title={title} hideAi />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Publics</p>
          <div className="flex flex-wrap gap-2">
            {PUBLICS.map((item) => {
              const selected = audiences.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAudiences((current) => toggle(current, item))}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold">Tarif souhaité (€)</span>
          <input
            className={field}
            type="number"
            min={0}
            max={100000}
            inputMode="numeric"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Formats</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((item) => {
              const selected = formats.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFormats((current) => toggle(current, item))}
                  className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">Contenu</p>
            <button type="button" className={aiButton} disabled={ai === "content"} onClick={() => void draft("content")}>
              {ai === "content" ? "Byound AI…" : "Byound AI"}
            </button>
          </div>
          <textarea className={`${field} min-h-36`} value={content} onChange={(event) => setContent(event.target.value)} maxLength={6000} placeholder="Les modules, à la main ou avec Byound AI" />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C] disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Proposer la formation"}
        </button>
      </form>

      {proposals.length ? (
        <ul className="space-y-3">
          {proposals.map((item) => (
            <li key={item.id} className="rounded-[24px] border border-[#1E2130] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-extrabold text-[#F4F5F7]">{item.title}</p>
                <span className="shrink-0 text-xs font-bold text-[#B5BAC6]">{STATUS_LABEL[item.status]}</span>
              </div>
              {item.reviewNote ? <p className="mt-2 text-sm text-[#B5BAC6]">{item.reviewNote}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#B5BAC6]">Aucune proposition envoyée.</p>
      )}
    </div>
  );
}
