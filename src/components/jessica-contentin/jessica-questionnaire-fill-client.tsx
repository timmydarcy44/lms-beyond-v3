"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import type { JessicaQuestionnaireDef } from "@/lib/jessica-contentin/questionnaires";
import { cn } from "@/lib/utils";

export type JessicaTestContact = {
  id: string;
  label: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileId?: string | null;
  patientId?: string | null;
};

type Props = {
  questionnaire: JessicaQuestionnaireDef;
  contacts: JessicaTestContact[];
  preselectContactId?: string;
};

export function JessicaQuestionnaireFillClient({
  questionnaire,
  contacts,
  preselectContactId,
}: Props) {
  const router = useRouter();
  const [contactId, setContactId] = useState(preselectContactId ?? "");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [contacts],
  );
  const selected = sorted.find((c) => c.id === contactId);

  const setAnswer = (id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/jessica-questionnaires/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionnaireSlug: questionnaire.slug,
          answers,
          respondentEmail: selected?.email ?? null,
          respondentFirstName: selected?.firstName ?? null,
          respondentLastName: selected?.lastName ?? null,
          cabinetPatientId: selected?.patientId ?? null,
          profileId: selected?.profileId ?? (selected?.id.startsWith("user:") ? selected.id.slice(5) : null),
        }),
      });
      const json = (await res.json()) as { error?: string; id?: string; scoreLabel?: string | null };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");
      toast.success(json.scoreLabel ? `Enregistré — ${json.scoreLabel}` : "Réponse enregistrée");
      router.push(`/super/jessica-tests/${questionnaire.slug}/reponses/${json.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <JessicaSuperPage
      title={questionnaire.title}
      subtitle="Remplir le questionnaire et l’associer à un client CRM"
      backHref="/super/jessica-tests"
      backLabel="Tests / Questionnaires"
    >
      <div className={cn(jessicaSuper.card, "mx-auto max-w-3xl space-y-6 p-6")}>
        <div className="space-y-1.5">
          <Label>Client CRM (optionnel)</Label>
          <select
            className={cn(jessicaSuper.input, "w-full")}
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
          >
            <option value="">Sans lien client…</option>
            {sorted.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} — {c.email}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-6 border-t border-black/[0.06] pt-6">
          {questionnaire.questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-[15px] leading-snug">
                <span className="mr-2 text-neutral-400">{idx + 1}.</span>
                {q.label}
              </Label>

              {q.type === "text" ? (
                <Textarea
                  className={jessicaSuper.input}
                  rows={3}
                  value={String(answers[q.id] ?? "")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              ) : null}

              {q.type === "single" ? (
                <div className="flex flex-col gap-2">
                  {(q.options ?? []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt}
                        onChange={() => setAnswer(q.id, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : null}

              {q.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(answers[q.id])}
                    onChange={(e) => setAnswer(q.id, e.target.checked)}
                  />
                  Oui / concerné
                </label>
              ) : null}

              {q.type === "boolean" ? (
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === "1"}
                      onChange={() => setAnswer(q.id, "1")}
                    />
                    Oui
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === "0"}
                      onChange={() => setAnswer(q.id, "0")}
                    />
                    Non
                  </label>
                </div>
              ) : null}

              {q.type === "scale" ? (
                <Input
                  type="number"
                  min={q.min ?? 0}
                  max={q.max ?? 5}
                  className={jessicaSuper.input}
                  value={answers[q.id] == null ? "" : String(answers[q.id])}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              ) : null}
            </div>
          ))}
        </div>

        <Button type="button" className={jessicaSuper.cta} disabled={saving} onClick={() => void handleSubmit()}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </JessicaSuperPage>
  );
}
