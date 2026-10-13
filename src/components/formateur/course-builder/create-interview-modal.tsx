"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import type { CourseBuilderChapter } from "@/types/course-builder";
import { extractChapterPlainText } from "@/lib/course-builder/chapter-content-text";
import {
  buildAssessmentPlacementOptions,
  insertSubchapterAtPlacement,
  parsePlacementValue,
} from "@/lib/course-builder/assessment-placement";
import {
  formatSituationIssues,
  situationFileSchema,
  situationPublicView,
  type SituationScenario,
} from "@/lib/interview/situation-schema";

type CreateInterviewModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chapitre courant (pré-sélection du contexte et emplacement par défaut). */
  chapter: CourseBuilderChapter;
  sectionTitle: string;
};

function chapterHasInterview(chapter: CourseBuilderChapter): boolean {
  return (chapter.subchapters ?? []).some((s) => (s as { kind?: string }).kind === "experiential_interview");
}

export function CreateInterviewModal({
  open,
  onOpenChange,
  chapter,
  sectionTitle,
}: CreateInterviewModalProps) {
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const hydrateFromSnapshot = useCourseBuilder((s) => s.hydrateFromSnapshot);
  const formationObjectifs = useMemo(
    () =>
      (snapshot.general.objectifs ?? [])
        .map((x) => String(x ?? "").trim())
        .filter(Boolean),
    [snapshot.general.objectifs],
  );
  const [placementValue, setPlacementValue] = useState(`after_chapter:${chapter.id}`);
  const [objectives, setObjectives] = useState("");
  const [interviewStyle, setInterviewStyle] = useState<"experiential" | "coaching" | "mise_en_situation">("coaching");
  const [situation, setSituation] = useState<SituationScenario | null>(null);
  const [importError, setImportError] = useState("");
  const [interviewAudience, setInterviewAudience] = useState<"professional" | "parent">("professional");
  const [busy, setBusy] = useState(false);

  const placementOptions = useMemo(
    () => buildAssessmentPlacementOptions(snapshot.sections),
    [snapshot.sections],
  );

  useEffect(() => {
    if (!open) {
      setObjectives("");
      setInterviewStyle("coaching");
      setInterviewAudience("professional");
      setSituation(null);
      setImportError("");
      return;
    }
    const defaultPlacement = placementOptions.some((o) => o.value === `after_chapter:${chapter.id}`)
      ? `after_chapter:${chapter.id}`
      : "end";
    setPlacementValue(defaultPlacement);
    if (formationObjectifs.length) {
      setObjectives(
        formationObjectifs
          .slice(0, 3)
          .map((o) => `• ${o}`)
          .join("\n"),
      );
    } else {
      setObjectives("");
    }
  }, [open, chapter.id, placementOptions, formationObjectifs]);

  const plain = extractChapterPlainText(chapter);
  const canUseAi = plain.length >= 80;

  const importScenarioFile = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      const parsed = situationFileSchema.safeParse(raw);
      if (!parsed.success) {
        setImportError(formatSituationIssues(parsed.error));
        return;
      }
      setSituation(parsed.data);
      toast.success("Scénario importé");
    } catch {
      setImportError("fichier: JSON illisible");
    }
  };

  const handleCreate = async () => {
    if (chapterHasInterview(chapter)) {
      toast.message("Un entretien existe déjà sur ce chapitre.");
      return;
    }
    if (interviewStyle !== "mise_en_situation" && !canUseAi) {
      toast.error("Ajoutez du contenu au chapitre (80 caractères min.) avant de créer l’entretien.");
      return;
    }
    if (interviewStyle === "mise_en_situation" && !situation) {
      toast.error("Importez un scénario .json avant de créer la mise en situation.");
      return;
    }
    const objectivesTrim = objectives.trim();

    setBusy(true);
    try {
      const blockId = nanoid();
      const isSituation = interviewStyle === "mise_en_situation" && situation;
      if (isSituation) {
        const saved = await fetch("/api/formateur/interview-scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockId, scenario: situation }),
        });
        const payload = (await saved.json().catch(() => null)) as { error?: string } | null;
        if (!saved.ok) throw new Error(payload?.error || "Impossible d'enregistrer le scénario");
      }
      const blockTitle = isSituation
        ? situation.title
        : interviewStyle === "coaching"
          ? "Se faire coacher"
          : "Entretien expérientiel";
      const block = {
        id: blockId,
        title: blockTitle,
        duration: "10–15 min",
        type: "text" as const,
        summary: isSituation
          ? "L'apprenant mène l'échange face à un personnage joué par l'IA."
          : interviewStyle === "coaching"
            ? "Coaching guidé par l'IA sur le contenu du chapitre."
            : "Conversation guidée par l'IA pour contextualiser vos apprentissages.",
        content: "",
        kind: "experiential_interview" as const,
        interview_context: isSituation ? "" : plain.slice(0, 14_000),
        interview_style: interviewStyle,
        ...(interviewStyle === "experiential" ? { interview_audience: interviewAudience } : {}),
        ...(objectivesTrim && !isSituation ? { interview_objectives: objectivesTrim.slice(0, 2000) } : {}),
        ...(isSituation ? { situation_public: situationPublicView(situation) } : {}),
      };

      const placement = parsePlacementValue(placementValue);
      const next = insertSubchapterAtPlacement(snapshot, block, placement);
      hydrateFromSnapshot(next);

      const label =
        placementOptions.find((o) => o.value === placementValue)?.label ?? "formation";
      toast.success("Entretien créé", {
        description: `Placé : ${label}. Enregistrez la formation puis prévisualisez.`,
      });
      onOpenChange(false);
    } catch (e) {
      console.error("[create-interview]", e);
      toast.error(e instanceof Error ? e.message : "Impossible de créer l’entretien");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border border-violet-500/20 bg-slate-950 bg-gradient-to-br from-violet-950/40 via-slate-950 to-fuchsia-950/30 p-0 text-white shadow-2xl">
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <MessageCircle className="h-5 w-5 text-violet-300" />
                Créer un entretien IA
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Choisissez le type d&apos;échange et son emplacement. Le contexte est tiré du chapitre «{" "}
                {chapter.title || "Sans titre"} » ({sectionTitle}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Type d&apos;échange</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setInterviewStyle("coaching")}
                  className={`rounded-xl border p-4 text-left transition ${
                    interviewStyle === "coaching"
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold text-white">Se faire coacher</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Questions sur le contenu du cours, sans supposer de vécu personnel.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewStyle("experiential")}
                  className={`rounded-xl border p-4 text-left transition ${
                    interviewStyle === "experiential"
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold text-white">Entretien expérientiel</p>
                  <p className="mt-1 text-xs text-slate-300">
                    Relier le chapitre à une situation concrète (pro ou familiale).
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setInterviewStyle("mise_en_situation")}
                  className={`rounded-xl border p-4 text-left transition ${
                    interviewStyle === "mise_en_situation"
                      ? "border-violet-400 bg-violet-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <p className="font-semibold text-white">Mise en situation</p>
                  <p className="mt-1 text-xs text-slate-300">
                    L&apos;apprenant mène l&apos;échange face à un personnage joué par l&apos;IA (client, acheteur, manager…).
                  </p>
                </button>
              </div>
            </div>

            {interviewStyle === "mise_en_situation" ? (
              <SituationFields
                situation={situation}
                importError={importError}
                onImport={(file) => void importScenarioFile(file)}
                onChange={setSituation}
              />
            ) : null}

            {interviewStyle === "experiential" ? (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-white">Thématique de l&apos;entretien</Label>
                <Select
                  value={interviewAudience}
                  onValueChange={(v) =>
                    setInterviewAudience(v === "parent" ? "parent" : "professional")
                  }
                >
                  <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border border-white/10 bg-slate-950/95 text-white">
                    <SelectItem value="professional" className="text-white">
                      Vécu professionnel / mise en pratique
                    </SelectItem>
                    <SelectItem value="parent" className="text-white">
                      Vécu familial (parent et enfant)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {interviewStyle !== "mise_en_situation" ? (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white">
                Objectifs pédagogiques <span className="font-normal text-slate-400">(optionnel)</span>
              </Label>
              <Textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                rows={5}
                placeholder="Ex. : Faire verbaliser une mise en situation concrète, identifier 2 difficultés rencontrées, proposer un plan d’action…"
                className="rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-400">
                L&apos;IA posera ses questions en fonction de ces objectifs (et du contenu du chapitre).
                {formationObjectifs.length ? " Les objectifs de la formation sont proposés par défaut." : ""}
              </p>
            </div>
            ) : null}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-white">Où placer cet entretien ?</Label>
              <Select value={placementValue} onValueChange={setPlacementValue}>
                <SelectTrigger className="rounded-xl border border-white/10 bg-white/5 text-white">
                  <SelectValue placeholder="Choisir un emplacement" />
                </SelectTrigger>
                <SelectContent className="max-h-72 border border-white/10 bg-slate-950/95 text-white">
                  {placementOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Comme pour un quiz : l&apos;entretien apparaît comme une étape dédiée dans le parcours apprenant.
              </p>
            </div>

            {interviewStyle === "mise_en_situation" ? null : !canUseAi ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Le chapitre source doit contenir au moins 80 caractères de contenu pédagogique.
              </p>
            ) : (
              <p className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-xs text-violet-100">
                Contexte IA : {plain.length.toLocaleString("fr-FR")} caractères extraits du chapitre.
              </p>
            )}
          </div>

          <DialogFooter className="border-t border-white/10 bg-black/20 px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={busy || (interviewStyle === "mise_en_situation" ? !situation : !canUseAi)}
              onClick={handleCreate}
              className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 font-semibold text-white hover:opacity-95"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Créer l&apos;entretien
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SituationFields({
  situation,
  importError,
  onImport,
  onChange,
}: {
  situation: SituationScenario | null;
  importError: string;
  onImport: (file: File | undefined) => void;
  onChange: (next: SituationScenario) => void;
}) {
  const patch = (partial: Partial<SituationScenario>) => {
    if (!situation) return;
    onChange({ ...situation, ...partial });
  };
  return (
    <div className="space-y-4">
      <label className="inline-flex cursor-pointer rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900">
        Importer un scénario (.json)
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            onImport(file);
          }}
        />
      </label>
      {importError ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-100">{importError}</pre>
      ) : null}
      {situation ? (
        <div className="space-y-3">
          <Field label="Titre" value={situation.title} onChange={(title) => patch({ title })} />
          <Field label="Nom du personnage" value={situation.character.name} onChange={(name) => patch({ character: { ...situation.character, name } })} />
          <Field label="Rôle" value={situation.character.role} onChange={(role) => patch({ character: { ...situation.character, role } })} />
          <Field label="Initiales" value={situation.character.initials} onChange={(initials) => patch({ character: { ...situation.character, initials: initials.slice(0, 4) } })} />
          <label className="block space-y-1 text-xs text-slate-300">
            Consigne apprenant
            <Textarea value={situation.learnerBrief} onChange={(event) => patch({ learnerBrief: event.target.value })} rows={5} className="bg-white/5 text-white" />
          </label>
          <label className="block space-y-1 text-xs text-slate-300">
            Prompt du personnage
            <Textarea value={situation.characterPrompt} onChange={(event) => patch({ characterPrompt: event.target.value })} rows={8} className="bg-white/5 text-white" />
          </label>
          <label className="block space-y-1 text-xs text-slate-300">
            Prompt d&apos;évaluation
            <Textarea value={situation.evaluationPrompt} onChange={(event) => patch({ evaluationPrompt: event.target.value })} rows={6} className="bg-white/5 text-white" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Échanges minimum" value={String(situation.minTurns)} onChange={(value) => patch({ minTurns: Number(value) || 1 })} />
            <Field label="Échanges maximum" value={String(situation.maxTurns)} onChange={(value) => patch({ maxTurns: Number(value) || 1 })} />
          </div>
          <label className="block space-y-1 text-xs text-slate-300">
            Tirage des variantes
            <select
              value={situation.variantMode}
              onChange={(event) => patch({ variantMode: event.target.value === "fixed" ? "fixed" : "random" })}
              className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="random">Aléatoire</option>
              <option value="fixed">Fixe</option>
            </select>
          </label>
          {situation.variantMode === "fixed" ? (
            <label className="block space-y-1 text-xs text-slate-300">
              Variante fixe
              <select
                value={situation.fixedVariantId ?? situation.variants[0]?.id ?? ""}
                onChange={(event) => patch({ fixedVariantId: event.target.value })}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-white"
              >
                {situation.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="space-y-2">
            {situation.variants.map((variant, index) => (
              <div key={variant.id} className="space-y-2 rounded-xl border border-white/10 p-3">
                <Field
                  label={`Variante ${index + 1}`}
                  value={variant.name}
                  onChange={(name) => {
                    const variants = situation.variants.map((item, itemIndex) => (itemIndex === index ? { ...item, name } : item));
                    patch({ variants });
                  }}
                />
                <Textarea
                  value={variant.instructions}
                  onChange={(event) => {
                    const variants = situation.variants.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, instructions: event.target.value } : item,
                    );
                    patch({ variants });
                  }}
                  rows={3}
                  className="bg-white/5 text-white"
                />
                <Textarea
                  value={variant.opening}
                  onChange={(event) => {
                    const variants = situation.variants.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, opening: event.target.value } : item,
                    );
                    patch({ variants });
                  }}
                  rows={2}
                  className="bg-white/5 text-white"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Réussite à {situation.scoring.passingScore}/100 · {situation.scoring.criteria.map((item) => item.label).join(", ")}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Importez le fichier .json pour préremplir les champs. Le scénario se suffit à lui-même.</p>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1 text-xs text-slate-300">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="bg-white/5 text-white" />
    </label>
  );
}
