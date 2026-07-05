"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { EdgeSelect, EDGE_INPUT_CLASS } from "@/components/ui/edge-select";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { HardSkillProof } from "@/lib/hard-skills/hard-skills-portfolio";
import type { SkillValidationVerdict } from "@/lib/hard-skills/skill-validation";
import type { SkillAnalysisApiResult } from "@/lib/hard-skills/skill-validation-analysis";
import { verdictLabel } from "@/lib/hard-skills/skill-validation";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

const PROOF_TYPES: Array<{ value: HardSkillProof["type"]; label: string }> = [
  { value: "document", label: "Document (PDF, Word, PowerPoint)" },
  { value: "portfolio", label: "Portfolio / GitHub" },
  { value: "link", label: "Lien (certificat, vidéo…)" },
  { value: "cv", label: "CV" },
  { value: "other", label: "Autre preuve" },
];

type AnalysisResult = SkillAnalysisApiResult;

type Props = {
  open: boolean;
  skillName: string | null;
  level: HardSkillLevel;
  onClose: () => void;
  onComplete: (result: AnalysisResult, proof: HardSkillProof) => void;
};

export function HardSkillProofModal({ open, skillName, level, onClose, onComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<HardSkillProof["type"]>("document");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setType("document");
    setUrl("");
    setNote("");
    setFile(null);
    setError(null);
    setResult(null);
  }, [open, skillName]);

  if (!open || !skillName) return null;

  const canSubmit = Boolean(file || url.trim() || note.trim());

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("skillName", skillName);
      formData.append("level", level);
      formData.append("proofUrl", url.trim());
      formData.append("proofNote", note.trim());
      if (file) formData.append("file", file);

      const res = await fetch("/api/learner/skill-validation/import", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analyse impossible");

      const analysis: AnalysisResult = json;
      setResult(analysis);
      onComplete(analysis, {
        type,
        url: url.trim() || undefined,
        note: note.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'import");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0D111A] p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-wider text-[#3D7BFF]">Importer une preuve</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{skillName}</h3>
        <p className="mt-2 text-sm text-white/55">
          PDF, PowerPoint, Word, images, certificat, portfolio, GitHub, lien ou vidéo.
        </p>

        {result ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Analyse EDGE</p>
              <p className="mt-2 text-lg font-semibold text-white">{verdictLabel(result.verdict)}</p>
              <p className="mt-2 text-sm text-white/60">Score de confiance : {result.confidenceScore}%</p>
              <p className="mt-3 text-sm text-white/75">{result.summary || result.detailedAnalysis || result.analysis}</p>
            </div>
            <button type="button" onClick={onClose} className={CONNECT_BTN_PRIMARY}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <span className="text-sm text-white/70">Type de preuve</span>
              <div className="mt-2">
                <EdgeSelect
                  value={type}
                  onChange={(v) => setType(v as HardSkillProof["type"])}
                  options={PROOF_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) setFile(f);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
                dragging
                  ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/10"
                  : "border-white/15 bg-white/[0.02] hover:border-[#3D7BFF]/30",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Upload className="mx-auto h-6 w-6 text-white/40" />
              <p className="mt-2 text-sm text-white">{file ? file.name : "Glisser-déposer ou sélectionner"}</p>
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-white/70">Lien (GitHub, portfolio, certificat…)</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className={EDGE_INPUT_CLASS}
              />
            </label>

            <label className="mt-4 block text-sm">
              <span className="mb-1 block text-white/70">Description (optionnel)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Contexte de la preuve…"
                className={EDGE_INPUT_CLASS}
              />
            </label>

            {error ? <p className="mt-3 text-sm text-amber-300">{error}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={onClose} className={CONNECT_BTN_SECONDARY}>
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting || !canSubmit}
                onClick={() => void submit()}
                className={CONNECT_BTN_PRIMARY}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Analyser la preuve
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
