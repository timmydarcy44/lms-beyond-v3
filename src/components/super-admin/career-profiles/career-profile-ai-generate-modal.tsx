"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (content: Partial<CareerProfile>) => void;
  defaults?: { title?: string; sector?: string };
  existing?: {
    title?: string;
    sector?: string;
    description?: string;
    key_skills?: string;
    soft_skills?: string;
    behavioral_expectations?: string;
    typical_challenges?: string;
    success_factors?: string;
    main_missions?: string;
    useful_qualities?: string;
    recommended_badges?: string;
  };
};

function linesToArray(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#635BFF]/40 focus:ring-2 focus:ring-[#635BFF]/10";

export function CareerProfileAiGenerateModal({ open, onOpenChange, onGenerated, defaults, existing }: Props) {
  const [title, setTitle] = useState(defaults?.title ?? "");
  const [sector, setSector] = useState(defaults?.sector ?? "");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Partial<CareerProfile> | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null);
      setPreview(null);
    } else {
      setTitle(defaults?.title ?? "");
      setSector(defaults?.sector ?? "");
    }
    onOpenChange(next);
  };

  const handleGenerate = async (mode: "generate" | "improve" = "generate") => {
    if (mode === "generate" && !title.trim() && !prompt.trim()) {
      setError("Indiquez un titre de métier ou un brief.");
      return;
    }
    setGenerating(true);
    setError(null);
    setPreview(null);
    try {
      const existingPayload =
        mode === "improve" && existing
          ? {
              title: existing.title,
              sector: existing.sector,
              description: existing.description,
              key_skills: linesToArray(existing.key_skills),
              soft_skills: linesToArray(existing.soft_skills),
              behavioral_expectations: linesToArray(existing.behavioral_expectations),
              typical_challenges: linesToArray(existing.typical_challenges),
              success_factors: linesToArray(existing.success_factors),
              main_missions: linesToArray(existing.main_missions),
              useful_qualities: linesToArray(existing.useful_qualities),
              recommended_badges: linesToArray(existing.recommended_badges),
            }
          : undefined;

      const res = await fetch("/api/super/career-profiles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: title.trim(),
          sector: sector.trim(),
          prompt: prompt.trim(),
          existing: existingPayload,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la génération");
      setPreview(json.content as Partial<CareerProfile>);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!preview) return;
    onGenerated(preview);
    handleOpenChange(false);
    setPrompt("");
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-gray-200 p-0 sm:max-w-3xl">
        <div className="border-b border-gray-100 bg-gradient-to-br from-[#635BFF]/6 to-white px-6 py-6">
          <DialogHeader className="text-left">
            <div className="mb-2 flex items-center gap-2 text-[#635BFF]">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">EDGE IA · ChatGPT</span>
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
              Générer hard skills & soft skills
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              ChatGPT rédige la fiche métier complète : compétences techniques, soft skills alignées au test EDGE,
              missions et défis. Vous relisez et enregistrez manuellement.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Titre du métier</span>
              <input
                className={INPUT}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chargé de clientèle B2B"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Secteur</span>
              <input
                className={INPUT}
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="Commerce / Services"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700">Brief optionnel</span>
            <textarea
              className={cn(INPUT, "min-h-[120px] resize-y")}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex. : Métier en alternance, public jeunes diplômés, focus relation client et prospection terrain…"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {preview ? (
            <div className="rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5 p-4 text-sm text-gray-800">
              <p className="font-semibold text-gray-900">{preview.title}</p>
              <p className="mt-1 text-xs text-gray-500">{preview.sector}</p>
              <p className="mt-3 text-gray-700">{preview.description}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hard skills</p>
                  <ul className="mt-2 space-y-1">
                    {(preview.key_skills ?? []).map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Soft skills</p>
                  <ul className="mt-2 space-y-1">
                    {(preview.soft_skills ?? []).map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleGenerate("improve")}
              disabled={generating || !existing?.title}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              <Wand2 className="h-4 w-4" />
              Améliorer la fiche actuelle
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate("generate")}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Générer
              </button>
              {preview ? (
                <button
                  type="button"
                  onClick={handleInsert}
                  className="rounded-xl bg-[#050505] px-4 py-2 text-sm font-semibold text-white"
                >
                  Insérer dans le formulaire
                </button>
              ) : null}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
