"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import {
  newQuestionId,
  type JessicaQuestionDef,
  type JessicaQuestionType,
  type JessicaQuestionnaireDef,
} from "@/lib/jessica-contentin/questionnaires";
import { cn } from "@/lib/utils";

type Props = {
  mode: "create" | "edit";
  questionnaire?: JessicaQuestionnaireDef & { id?: string; is_active?: boolean };
};

const TYPES: { value: JessicaQuestionType; label: string }[] = [
  { value: "text", label: "Texte libre" },
  { value: "single", label: "Choix unique" },
  { value: "checkbox", label: "Case à cocher" },
  { value: "boolean", label: "Oui / Non" },
  { value: "scale", label: "Échelle numérique" },
];

function emptyQuestion(): JessicaQuestionDef {
  return { id: newQuestionId(), label: "", type: "text" };
}

export function JessicaQuestionnaireEditorClient({ mode, questionnaire }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(questionnaire?.title ?? "");
  const [description, setDescription] = useState(questionnaire?.description ?? "");
  const [questions, setQuestions] = useState<JessicaQuestionDef[]>(
    questionnaire?.questions?.length ? questionnaire.questions : [emptyQuestion()],
  );
  const [saving, setSaving] = useState(false);

  const updateQuestion = (index: number, patch: Partial<JessicaQuestionDef>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= questions.length) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[next];
      copy[next] = tmp;
      return copy;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Indiquez un titre");
      return;
    }
    const cleaned = questions
      .map((q) => ({
        ...q,
        label: q.label.trim(),
        options:
          q.type === "single" || q.type === "checkbox"
            ? (q.options ?? []).map((o) => o.trim()).filter(Boolean)
            : undefined,
      }))
      .filter((q) => q.label);

    if (cleaned.length === 0) {
      toast.error("Ajoutez au moins une question");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/jessica-questionnaires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, questions: cleaned }),
        });
        const json = (await res.json()) as {
          error?: string;
          questionnaire?: { slug: string };
        };
        if (!res.ok) throw new Error(json.error ?? "Création impossible");
        toast.success("Questionnaire créé");
        router.push(`/super/jessica-tests/${json.questionnaire!.slug}`);
      } else if (questionnaire?.id) {
        const res = await fetch(`/api/admin/jessica-questionnaires/${questionnaire.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, questions: cleaned }),
        });
        const json = (await res.json()) as { error?: string; questionnaire?: { slug: string } };
        if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
        toast.success("Questionnaire mis à jour");
        router.push(`/super/jessica-tests/${json.questionnaire?.slug ?? questionnaire.slug}`);
        router.refresh();
      } else {
        // Builtin pas encore en base : créer avec le slug existant
        const res = await fetch("/api/admin/jessica-questionnaires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            questions: cleaned,
            slug: questionnaire?.slug,
          }),
        });
        const json = (await res.json()) as {
          error?: string;
          questionnaire?: { slug: string };
        };
        if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
        toast.success("Questionnaire enregistré");
        router.push(`/super/jessica-tests/${json.questionnaire!.slug}/modifier`);
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <JessicaSuperPage
      title={mode === "create" ? "Nouveau questionnaire" : "Modifier le questionnaire"}
      subtitle={mode === "edit" ? questionnaire?.slug : "Créer un test personnalisé pour le CRM"}
      backHref="/super/jessica-tests"
      backLabel="Tests / Questionnaires"
      actions={
        <Button type="button" className={jessicaSuper.cta} disabled={saving} onClick={() => void handleSave()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className={cn(jessicaSuper.card, "space-y-4 p-6")}>
          <div className="space-y-1.5">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={jessicaSuper.input}
              placeholder="Ex. Questionnaire suivi mensuel"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={jessicaSuper.input}
              rows={2}
              placeholder="Courte description visible dans le menu Tests"
            />
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className={cn(jessicaSuper.card, "space-y-3 p-5")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-500">Question {index + 1}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(index, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => moveQuestion(index, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Libellé</Label>
                <Textarea
                  value={q.label}
                  onChange={(e) => updateQuestion(index, { label: e.target.value })}
                  className={jessicaSuper.input}
                  rows={2}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select
                    className={cn(jessicaSuper.input, "w-full")}
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as JessicaQuestionType;
                      const patch: Partial<JessicaQuestionDef> = { type };
                      if (type === "single" && !q.options?.length) {
                        patch.options = ["Option 1", "Option 2"];
                      }
                      if (type === "boolean") patch.options = ["0", "1"];
                      if (type === "scale") {
                        patch.min = 0;
                        patch.max = 5;
                      }
                      updateQuestion(index, patch);
                    }}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {q.type === "scale" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Min</Label>
                      <Input
                        type="number"
                        className={jessicaSuper.input}
                        value={q.min ?? 0}
                        onChange={(e) => updateQuestion(index, { min: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max</Label>
                      <Input
                        type="number"
                        className={jessicaSuper.input}
                        value={q.max ?? 5}
                        onChange={(e) => updateQuestion(index, { max: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {q.type === "single" ? (
                <div className="space-y-1.5">
                  <Label>Options (une par ligne)</Label>
                  <Textarea
                    className={jessicaSuper.input}
                    rows={4}
                    value={(q.options ?? []).join("\n")}
                    onChange={(e) =>
                      updateQuestion(index, {
                        options: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une question
        </Button>
      </div>
    </JessicaSuperPage>
  );
}
