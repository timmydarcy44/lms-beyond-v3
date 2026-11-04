"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import { NotebookPen } from "lucide-react";

import type { WorkshopConfig, WorkshopCriterion, WorkshopField, WorkshopMode } from "@/types/course-builder";
import { parseAtelierDraftText } from "@/lib/course-builder/import-structure";
import { emptyWorkshop, workshopMaxImprovements, workshopMode } from "@/lib/workshops/workshop-block";

type WorkshopEditorFormProps = {
  title: string;
  workshop?: WorkshopConfig | null;
  onTitle: (title: string) => void;
  onWorkshop: (workshop: WorkshopConfig) => void;
  appearance?: "light" | "dark";
};

const lightField = "w-full rounded-2xl border border-[#E3E0D8] bg-white px-3 py-3 text-sm text-[#07080B] outline-none focus:border-[#6E5BFF]";
const darkField = "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none";

export function WorkshopEditorForm({
  title,
  workshop,
  onTitle,
  onWorkshop,
  appearance = "light",
}: WorkshopEditorFormProps) {
  const value = workshop ?? emptyWorkshop("evaluation");
  const mode = workshopMode(value);
  const light = appearance === "light";
  const field = light ? lightField : darkField;
  const label = light ? "text-sm font-semibold text-[#07080B]" : "text-sm font-semibold text-white";
  const hint = light ? "text-xs text-[#6B6F7A]" : "text-xs text-white/55";
  const fields = value.fields?.length ? value.fields : emptyWorkshop(mode).fields ?? [];
  const criteria = value.criteria?.length ? value.criteria : emptyWorkshop(mode).criteria ?? [];

  const patch = (next: Partial<WorkshopConfig>) => onWorkshop({ ...value, ...next });
  const [jsonText, setJsonText] = useState("");
  const [jsonNotice, setJsonNotice] = useState("");
  const [jsonOk, setJsonOk] = useState(false);

  const applyJson = () => {
    const parsed = parseAtelierDraftText(jsonText);
    if (!parsed.ok) {
      setJsonOk(false);
      setJsonNotice(parsed.message);
      return;
    }
    onTitle(parsed.title);
    onWorkshop(parsed.workshop);
    setJsonOk(true);
    setJsonNotice("Formulaire rempli. Vous pouvez encore modifier les champs à la main.");
  };

  const setField = (id: string, next: Partial<WorkshopField>) => {
    patch({ fields: fields.map((item) => (item.id === id ? { ...item, ...next } : item)) });
  };
  const setCriterion = (id: string, next: Partial<WorkshopCriterion>) => {
    patch({ criteria: criteria.map((item) => (item.id === id ? { ...item, ...next } : item)) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Mode du bloc">
        {(
          [
            ["evaluation", "Évaluation"],
            ["atelier", "Atelier"],
          ] as const
        ).map(([id, name]) => {
          const selected = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => patch({ mode: id as WorkshopMode })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : light ? "border border-[#E3E0D8] bg-white" : "border border-white/15 text-white"}`}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className={hint}>
        {mode === "atelier"
          ? "Entraînement. Le retour ne compte ni pour un Open Badge ni pour une note."
          : "Épreuve. Le comportement de certification reste celui d'aujourd'hui."}
      </p>

      {mode === "atelier" ? (
        <div className={`space-y-3 rounded-[24px] border p-4 ${light ? "border-[#E3E0D8] bg-[#F7F6F2]" : "border-white/10 bg-white/5"}`}>
            <p className={label}>Créer depuis un JSON</p>
            <p className={hint}>Collez l'objet atelier. Les champs ci-dessous se remplissent, et restent modifiables à la main.</p>
            <textarea
              className={`${field} min-h-36 font-mono text-xs`}
              aria-label="JSON de l'atelier"
              placeholder={'{\n  "type": "atelier",\n  "title": "Rédiger 3 objectifs",\n  "instructions": "…",\n  "scenario": "…",\n  "example": "…",\n  "fields": [{ "label": "Votre métier", "type": "short" }],\n  "criteria": ["Verbe d'action", "Situation précise"],\n  "max_improvements": 2\n}'}
              value={jsonText}
              onChange={(event) => {
                setJsonText(event.target.value);
                setJsonNotice("");
                setJsonOk(false);
              }}
            />
            <button
              type="button"
              onClick={applyJson}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              Remplir le formulaire
            </button>
            {jsonNotice ? <p className={`text-sm ${jsonOk ? (light ? "text-[#0E7A4B]" : "text-[#2FD08A]") : "text-[#B42318]"}`}>{jsonNotice}</p> : null}
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className={label}>{mode === "atelier" ? "Titre de l'atelier" : "Titre"}</span>
        <input className={field} value={title} onChange={(event) => onTitle(event.target.value)} />
      </label>

      {mode === "atelier" ? (
        <>
          <label className="block space-y-2">
            <span className={label}>Consigne</span>
            <textarea className={`${field} min-h-24`} value={value.brief ?? ""} onChange={(event) => patch({ brief: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className={label}>Mise en situation</span>
            <textarea className={`${field} min-h-24`} value={value.situation ?? ""} onChange={(event) => patch({ situation: event.target.value })} />
          </label>
          <label className="block space-y-2">
            <span className={label}>Exemple résolu</span>
            <textarea className={`${field} min-h-24`} value={value.example ?? ""} onChange={(event) => patch({ example: event.target.value })} />
          </label>

          <fieldset className="space-y-3">
            <legend className={label}>Champs de réponse</legend>
            <p className={hint}>De 1 à 6. Court = une ligne, long = un paragraphe.</p>
            {fields.map((item, index) => (
              <div key={item.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <input
                  className={field}
                  aria-label={`Étiquette du champ ${index + 1}`}
                  placeholder="Objectif 1 : être capable de…"
                  value={item.label}
                  onChange={(event) => setField(item.id, { label: event.target.value })}
                />
                <select
                  className={field}
                  aria-label={`Type du champ ${index + 1}`}
                  value={item.type}
                  onChange={(event) => setField(item.id, { type: event.target.value === "short" ? "short" : "long" })}
                >
                  <option value="short">Court</option>
                  <option value="long">Long</option>
                </select>
                <button
                  type="button"
                  className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  disabled={fields.length <= 1}
                  onClick={() => patch({ fields: fields.filter((row) => row.id !== item.id) })}
                >
                  Retirer
                </button>
                <input
                  className={`${field} sm:col-span-3`}
                  aria-label={`Indication du champ ${index + 1}`}
                  placeholder="Indication affichée dans le champ, optionnelle"
                  value={item.placeholder ?? ""}
                  onChange={(event) => setField(item.id, { placeholder: event.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={fields.length >= 6}
              onClick={() => patch({ fields: [...fields, { id: nanoid(), label: "", placeholder: "", type: "long" }] })}
            >
              <NotebookPen className="h-4 w-4" aria-hidden />
              Ajouter un champ
            </button>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className={label}>Critères de réussite</legend>
            <p className={hint}>De 2 à 6. L'apprenant les voit avant de répondre.</p>
            {criteria.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={field}
                  aria-label={`Critère ${index + 1}`}
                  value={item.label}
                  onChange={(event) => setCriterion(item.id, { label: event.target.value })}
                />
                <button
                  type="button"
                  className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold disabled:opacity-40"
                  disabled={criteria.length <= 2}
                  onClick={() => patch({ criteria: criteria.filter((row) => row.id !== item.id) })}
                >
                  Retirer
                </button>
              </div>
            ))}
            <button
              type="button"
              className="rounded-full border border-[#E3E0D8] bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
              disabled={criteria.length >= 6}
              onClick={() => patch({ criteria: [...criteria, { id: nanoid(), label: "" }] })}
            >
              Ajouter un critère
            </button>
          </fieldset>

          <label className="block space-y-2">
            <span className={label}>Améliorations autorisées</span>
            <input
              className={field}
              type="number"
              min={0}
              max={6}
              value={workshopMaxImprovements(value)}
              onChange={(event) => patch({ maxImprovements: workshopMaxImprovements({ maxImprovements: Number(event.target.value) }) })}
            />
          </label>
        </>
      ) : null}
    </div>
  );
}
