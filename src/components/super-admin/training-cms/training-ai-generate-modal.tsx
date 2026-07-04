"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type TrainingAiGeneratePayload = {
  prompt: string;
  domain: string;
  duration: string;
  level: string;
  audience: string;
  formats: string;
  inter_price: string;
  intra_price: string;
};

export type TrainingAiGeneratedContent = {
  title?: string;
  slug?: string;
  short_description?: string;
  long_description?: string;
  domain?: string;
  cover_prompt?: string;
  duration?: string;
  level?: string;
  formats?: string[];
  objectives?: string[];
  skills?: string[];
  why_choose?: string[];
  prerequisites?: string;
  audience?: string[];
  inter_price?: number;
  intra_price?: number;
  max_intra_participants?: number;
  badge_name?: string;
  seo_tags?: string[];
  meta_description?: string;
  faq?: { q: string; a: string }[];
  benefits?: string[];
  case_studies?: string[];
  deliverables?: string[];
  methodology?: string[];
  program_structure?: unknown[];
};

const EXAMPLE_PROMPTS = [
  "Crée une formation de 2 jours pour des managers de proximité sur la gestion des conflits. Niveau initiation. Public : managers débutants. Format : présentiel et distanciel. Inclure des cas pratiques, un programme en 4 modules, un Open Badge, un prix inter et un prix intra.",
  "Formation IA générative pour les équipes marketing : 1 jour, niveau intermédiaire, distanciel. Objectifs opérationnels, 6 compétences clés, cas pratiques ChatGPT et Midjourney, badge « IA Marketing EDGE ».",
  "Parcours leadership inclusif — 3 jours, niveau avancé, blended learning. Public : DRH et managers seniors. Programme en 5 modules, certification Open Badge, tarifs intra jusqu'à 12 participants.",
];

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#635BFF]/40 focus:ring-2 focus:ring-[#635BFF]/10";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (content: TrainingAiGeneratedContent) => void;
  defaults?: Partial<TrainingAiGeneratePayload>;
};

export function TrainingAiGenerateModal({ open, onOpenChange, onGenerated, defaults }: Props) {
  const [prompt, setPrompt] = useState("");
  const [domain, setDomain] = useState(defaults?.domain ?? "");
  const [duration, setDuration] = useState(defaults?.duration ?? "");
  const [level, setLevel] = useState(defaults?.level ?? "");
  const [audience, setAudience] = useState(defaults?.audience ?? "");
  const [formats, setFormats] = useState(defaults?.formats ?? "");
  const [interPrice, setInterPrice] = useState(defaults?.inter_price ?? "");
  const [intraPrice, setIntraPrice] = useState(defaults?.intra_price ?? "");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TrainingAiGeneratedContent | null>(null);

  useEffect(() => {
    if (!open) return;
    setDomain(defaults?.domain ?? "");
    setDuration(defaults?.duration ?? "");
    setLevel(defaults?.level ?? "");
    setAudience(defaults?.audience ?? "");
    setFormats(defaults?.formats ?? "");
    setInterPrice(defaults?.inter_price ?? "");
    setIntraPrice(defaults?.intra_price ?? "");
  }, [open, defaults]);

  const resetPreview = () => setPreview(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null);
      resetPreview();
    }
    onOpenChange(next);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Décrivez la formation souhaitée.");
      return;
    }
    setGenerating(true);
    setError(null);
    resetPreview();
    try {
      const res = await fetch("/api/super/formations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          domain: domain.trim() || undefined,
          duration: duration.trim() || undefined,
          level: level.trim() || undefined,
          audience: audience.trim() || undefined,
          formats: formats.trim() || undefined,
          inter_price: interPrice.trim() ? Number(interPrice) : undefined,
          intra_price: intraPrice.trim() ? Number(intraPrice) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la génération");
      setPreview(json.content as TrainingAiGeneratedContent);
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
    resetPreview();
  };

  const programSections = Array.isArray(preview?.program_structure) ? preview.program_structure.length : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-gray-200 p-0 sm:max-w-3xl">
        <div className="border-b border-gray-100 bg-gradient-to-br from-[#635BFF]/6 to-white px-6 py-6">
          <DialogHeader className="text-left">
            <div className="mb-2 flex items-center gap-2 text-[#635BFF]">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">EDGE IA</span>
            </div>
            <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-900">
              Créer une formation avec l&apos;IA
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-gray-600">
              Décrivez précisément la formation souhaitée. EDGE générera automatiquement la fiche, le programme
              détaillé, les objectifs, les compétences, les tarifs et les éléments SEO.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-800">Brief formation</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              placeholder={`Exemple :
"Crée une formation de 2 jours pour des managers de proximité sur la gestion des conflits. Niveau initiation. Public : managers débutants. Format : présentiel et distanciel. Inclure des cas pratiques, un programme en 4 modules, un Open Badge, un prix inter et un prix intra."`}
              className={cn(INPUT, "min-h-[180px] resize-y leading-relaxed")}
            />
          </label>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Exemples cliquables</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example.slice(0, 40)}
                  type="button"
                  onClick={() => setPrompt(example)}
                  className="rounded-full border border-[#635BFF]/20 bg-[#635BFF]/5 px-3 py-1.5 text-left text-xs text-[#635BFF] transition hover:bg-[#635BFF]/10"
                >
                  {example.slice(0, 72)}…
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Champs optionnels</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Domaine</span>
                <input className={INPUT} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Management" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Durée</span>
                <input className={INPUT} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="2 jours" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Niveau</span>
                <input className={INPUT} value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Initiation" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Format</span>
                <input className={INPUT} value={formats} onChange={(e) => setFormats(e.target.value)} placeholder="Présentiel, distanciel" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-gray-600">Public cible</span>
                <input className={INPUT} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Managers, DRH…" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Prix inter (€ HT)</span>
                <input className={INPUT} type="number" min={0} value={interPrice} onChange={(e) => setInterPrice(e.target.value)} placeholder="890" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">Prix intra (€ HT)</span>
                <input className={INPUT} type="number" min={0} value={intraPrice} onChange={(e) => setIntraPrice(e.target.value)} placeholder="4500" />
              </label>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {generating ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/5 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#635BFF]" />
              <p className="text-sm font-medium text-gray-700">Génération de la fiche en cours…</p>
            </div>
          ) : null}

          {preview && !generating ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Aperçu</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{preview.title}</p>
              <p className="mt-1 text-sm text-gray-600">{preview.short_description}</p>
              <ul className="mt-4 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                <li>{preview.objectives?.length ?? 0} objectifs</li>
                <li>{preview.skills?.length ?? 0} compétences</li>
                <li>{programSections} sections programme</li>
                <li>{preview.faq?.length ?? 0} questions FAQ</li>
                {preview.inter_price != null ? <li>Inter : {preview.inter_price} € HT</li> : null}
                {preview.intra_price != null ? <li>Intra : {preview.intra_price} € HT</li> : null}
              </ul>
              {preview.cover_prompt ? (
                <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Prompt cover :</span> {preview.cover_prompt}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:justify-between">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <div className="flex flex-wrap gap-2">
            {!preview ? (
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleGenerate()}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Générer la fiche formation
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInsert}
                className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7B74FF]"
              >
                Insérer dans le formulaire
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
