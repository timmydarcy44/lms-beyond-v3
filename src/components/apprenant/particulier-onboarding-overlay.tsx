"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { EdgeSelect, EDGE_INPUT_CLASS } from "@/components/ui/edge-select";
import {
  getOnboardingConfig,
  type ParticulierOnboardingForm,
} from "@/lib/particulier/onboarding-objective-config";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  typeProfil: string | null | undefined;
  form: ParticulierOnboardingForm;
  saving: boolean;
  error: string | null;
  onChange: (next: ParticulierOnboardingForm) => void;
  onSave: () => void;
};

export function ParticulierOnboardingOverlay({
  open,
  typeProfil,
  form,
  saving,
  error,
  onChange,
  onSave,
}: Props) {
  const config = getOnboardingConfig(typeProfil);
  const [tagInput, setTagInput] = useState("");

  if (!open) return null;

  const setField = (key: string, value: string) => {
    onChange({ ...form, [key]: value });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const current = Array.isArray(form.prestations) ? form.prestations : [];
    if (current.includes(tag)) return;
    onChange({ ...form, prestations: [...current, tag] });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    const current = Array.isArray(form.prestations) ? form.prestations : [];
    onChange({ ...form, prestations: current.filter((t) => t !== tag) });
  };

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/[0.12] bg-[linear-gradient(155deg,rgba(14,22,58,0.92)_0%,rgba(5,8,20,0.96)_100%)] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-white/45">Première connexion</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{config.title}</h2>
        <p className="mt-2 text-sm text-white/55">{config.subtitle}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(
            [
              ["first_name", "Prénom"],
              ["last_name", "Nom"],
              ["city", "Ville"],
              ["telephone", "Téléphone"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm text-white/70">
              {label}
              <input
                value={String(form[key] ?? "")}
                onChange={(e) => setField(key, e.target.value)}
                className={cn(EDGE_INPUT_CLASS, "mt-2")}
              />
            </label>
          ))}
          <label className="text-sm text-white/70 md:col-span-2">
            Date de naissance
            <input
              type="date"
              value={String(form.birth_date ?? "")}
              onChange={(e) => setField("birth_date", e.target.value)}
              className={cn(EDGE_INPUT_CLASS, "mt-2")}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => {
            if (field.type === "tags") {
              const tags = Array.isArray(form.prestations) ? form.prestations : [];
              return (
                <div key={field.key} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                  <span className="text-sm text-white/70">{field.label}</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full border border-[#3D7BFF]/35 bg-[#3D7BFF]/15 px-3 py-1 text-xs text-white"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-white/60 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Saisir une prestation puis Entrée"
                      className={cn(EDGE_INPUT_CLASS, "flex-1")}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="shrink-0 rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <label
                key={field.key}
                className={cn("text-sm text-white/70", field.colSpan === 2 && "md:col-span-2")}
              >
                {field.label}
                {field.type === "select" && field.options ? (
                  <div className="mt-2">
                    <EdgeSelect
                      value={String(form[field.key] ?? "")}
                      onChange={(v) => setField(field.key, v)}
                      options={field.options}
                      placeholder="Choisir…"
                    />
                  </div>
                ) : (
                  <input
                    type={field.type === "date" ? "date" : "text"}
                    value={String(form[field.key] ?? "")}
                    placeholder={field.placeholder}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={cn(EDGE_INPUT_CLASS, "mt-2")}
                  />
                )}
              </label>
            );
          })}
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className={cn(CONNECT_BTN_PRIMARY, "mt-8 w-full sm:w-auto")}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer et continuer
        </button>
      </div>
    </div>
  );
}
