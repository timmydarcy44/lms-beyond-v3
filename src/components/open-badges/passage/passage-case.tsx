"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCaseStudyContext, getCaseStudyLearnerPrompt, type BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { PassageButton } from "@/components/open-badges/passage/passage-chrome";

function promptsOf(text: string): string[] {
  const numbered = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+[\).\s]/.test(line));
  return numbered.length > 0 ? numbered : [text.trim() || "Rédigez votre réponse."];
}

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function PassageCase({
  method,
  warning,
  secondsLeft,
  onSubmit,
}: {
  method: BadgeMethodConfig;
  warning: string;
  secondsLeft?: number | null;
  onSubmit: (text: string) => void;
}) {
  const context = getCaseStudyContext(method);
  const brief = getCaseStudyLearnerPrompt(method) || method.learnerInstruction || method.evaluationPrompt;
  const prompts = useMemo(() => promptsOf(brief), [brief]);
  const [sections, setSections] = useState<string[]>(() => prompts.map(() => ""));
  const [tab, setTab] = useState<"dossier" | "reponse">("dossier");
  const [dossierOpen, setDossierOpen] = useState(true);
  const [confirm, setConfirm] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const pasteRef = useRef(0);
  const sentRef = useRef(false);
  const count = sections.reduce((sum, section) => sum + words(section), 0);
  const ago = savedAt == null ? null : Math.max(0, Math.round((Date.now() - savedAt) / 1000));

  const send = () => {
    if (sentRef.current) return;
    sentRef.current = true;
    const body = prompts.map((prompt, index) => `${prompt}\n${sections[index] || ""}`).join("\n\n");
    const pasted = pasteRef.current > 0 ? `\n\nCollage depuis l'extérieur : ${pasteRef.current} caractères.` : "";
    onSubmit(body + pasted);
  };

  useEffect(() => {
    if (secondsLeft === 0) send();
  }, [secondsLeft]);

  const dossier = (
    <div className="space-y-4">
      <button type="button" onClick={() => setDossierOpen((v) => !v)} className="text-sm text-[#C9C2FF]">
        {dossierOpen ? "Masquer le dossier" : "Le dossier"}
      </button>
      {dossierOpen ? (
        <>
          {context ? <p className="whitespace-pre-wrap text-sm text-[#B4B8C8]">{context}</p> : null}
          <div className="rounded-2xl bg-[#0B0C10] p-4 text-sm text-[#B4B8C8]">{brief}</div>
          <div>
            <p className="text-sm font-semibold">Votre travail</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#B4B8C8]">
              {prompts.map((prompt) => (
                <li key={prompt}>{prompt.replace(/^\d+[\).\s]+/, "")}</li>
              ))}
            </ol>
          </div>
        </>
      ) : null}
    </div>
  );

  const editor = (
    <div>
      <p className="text-sm text-[#8A8FA3]">{count} / 600 mots</p>
      {warning ? <p className="mt-2 text-sm text-[#F2C15A]">{warning}</p> : null}
      <div className="mt-3 space-y-4">
        {prompts.map((prompt, index) => (
          <label key={prompt} className="block">
            <span className="text-sm font-semibold">{prompt.length > 140 ? "Votre réponse" : prompt.replace(/^\d+[\).\s]+/, "")}</span>
            <textarea
              value={sections[index] ?? ""}
              onChange={(event) => {
                const next = [...sections];
                next[index] = event.target.value;
                setSections(next);
                setSavedAt(Date.now());
              }}
              onPaste={(event) => {
                pasteRef.current += event.clipboardData.getData("text").length;
              }}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-[#1E2130] bg-[#0B0C10] p-3 text-sm outline-none focus:border-[#6E5BFF]"
            />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-4 flex gap-2 sm:hidden">
        <button type="button" onClick={() => setTab("dossier")} style={tab === "dossier" ? { background: "#F2F2F5", color: "#0B0C10" } : undefined} className={`rounded-full px-3 py-1 text-sm ${tab === "dossier" ? "" : "text-[#B4B8C8]"}`}>
          Dossier
        </button>
        <button type="button" onClick={() => setTab("reponse")} style={tab === "reponse" ? { background: "#F2F2F5", color: "#0B0C10" } : undefined} className={`rounded-full px-3 py-1 text-sm ${tab === "reponse" ? "" : "text-[#B4B8C8]"}`}>
          Ma réponse
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className={tab === "reponse" ? "hidden lg:block" : ""}>{dossier}</section>
        <section className={tab === "dossier" ? "hidden lg:block" : ""}>{editor}</section>
      </div>
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1E2130] pt-4">
        <p className="text-xs text-[#8A8FA3]">
          {ago == null ? "Enregistrement en cours" : `Enregistré il y a ${ago} s · restez sur cette page jusqu'à l'envoi`}
        </p>
        <PassageButton onClick={() => setConfirm(true)}>Envoyer ma réponse</PassageButton>
      </footer>
      {confirm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="max-w-md rounded-3xl bg-[#15171E] p-6">
            <p className="text-sm text-[#B4B8C8]">Vous ne pourrez plus modifier votre réponse.</p>
            <div className="mt-4 flex gap-3">
              <PassageButton
                onClick={send}
              >
                Envoyer
              </PassageButton>
              <button type="button" onClick={() => setConfirm(false)} className="text-sm text-[#B4B8C8]">
                Revenir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
