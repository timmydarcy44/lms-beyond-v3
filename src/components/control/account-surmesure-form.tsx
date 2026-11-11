"use client";

import { useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Field, fieldClass } from "./chrome";
import {
  type SurMesureDraft,
  draftToPayload,
} from "@/lib/training-courses/surmesure-ui";
import type { SurMesureOrgContext } from "@/lib/training-courses/surmesure-org-context";

function ListField({
  label,
  addLabel,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  addLabel: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="block text-sm text-[#8A93AE]">{label}</span>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <input
              className={fieldClass}
              value={item}
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className="mt-1 rounded-full p-2 text-[#FF8A9B] hover:bg-[#2A1520] disabled:opacity-30"
              disabled={items.length <= 1}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold text-[#C9D2E8]"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

export function AccountSurMesureForm({
  organizationId,
  initialDraft,
  courseId,
  company,
  onSaved,
}: {
  organizationId: string;
  initialDraft: SurMesureDraft;
  courseId?: string;
  company?: SurMesureOrgContext | null;
  onSaved: (courseId: string) => void;
}) {
  const [draft, setDraft] = useState<SurMesureDraft>(initialDraft);
  const [prompt, setPrompt] = useState(initialDraft.brief);
  const [saving, setSaving] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function autofill() {
    if (prompt.trim().length < 20) {
      setError("Le prompt global doit contenir au moins 20 caractères.");
      return;
    }
    setAutofilling(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          company: company
            ? {
                name: company.name,
                siret: company.siret,
                sector: company.sector,
                naf: company.naf,
                city: company.city,
              }
            : undefined,
        }),
      });
      const json = (await res.json()) as {
        draft?: {
          title: string;
          short_description: string;
          duration: string;
          level: string;
          domain: string;
          prerequisites: string[];
          specific_needs: string;
          objectives: string[];
          audience: string[];
          skills: string[];
          formats: string[];
          intra_price: number | null;
          inter_price: number | null;
        };
        error?: string;
      };
      if (!res.ok || !json.draft) throw new Error(json.error || "Auto-remplissage impossible");
      const d = json.draft;
      setDraft({
        title: d.title || "",
        short_description: d.short_description || "",
        duration: d.duration || "2 jours",
        level: d.level || "Intermédiaire",
        domain: d.domain || "",
        prerequisites: d.prerequisites.length ? d.prerequisites : [""],
        specific_needs: d.specific_needs || "",
        objectives: d.objectives.length ? d.objectives : [""],
        audience: d.audience.length ? d.audience : [""],
        skills: d.skills.length ? d.skills : [""],
        formats: d.formats.length ? d.formats : ["Sur mesure"],
        intra_price: d.intra_price != null ? String(d.intra_price) : "",
        inter_price: d.inter_price != null ? String(d.inter_price) : "",
        brief: prompt.trim(),
      });
      setNotice("Fiche pré-remplie par Byound AI — ajustez avec le client si besoin.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-remplissage impossible");
    } finally {
      setAutofilling(false);
    }
  }

  async function save(opts?: { generateStructure?: boolean }) {
    if (!draft.title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draftToPayload(draft), brief: prompt.trim() };
      let id = courseId;
      if (!id) {
        const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { course?: { id: string }; error?: string };
        if (!res.ok || !json.course) throw new Error(json.error || "Création impossible");
        id = json.course.id;
      } else {
        const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { course?: { id: string }; error?: string };
        if (!res.ok || !json.course) throw new Error(json.error || "Enregistrement impossible");
      }

      if (opts?.generateStructure && id) {
        setGenerating(true);
        const gen = await fetch(
          `/api/super/comptes-clients/${organizationId}/surmesure/${id}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brief: prompt.trim() || undefined }),
          },
        );
        const genJson = (await gen.json()) as { error?: string };
        if (!gen.ok) throw new Error(genJson.error || "Génération de structure impossible");
      }

      onSaved(id!);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
      setGenerating(false);
    }
  }

  const busy = saving || autofilling || generating;

  const companyHints = [
    company?.siret ? `SIRET ${company.siret}` : null,
    company?.sector || null,
    company?.naf ? `NAF ${company.naf}` : null,
    company?.city || null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#6BE39B]">{notice}</p> : null}

      {company ? (
        <div className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3 text-sm text-[#C9D2E8]">
          <span className="font-semibold text-white">{company.name}</span>
          {companyHints.length ? (
            <span className="mt-1 block text-xs text-[#8A93AE]">{companyHints.join(" · ")}</span>
          ) : (
            <span className="mt-1 block text-xs text-[#8A93AE]">
              SIRET / secteur non renseignés sur la fiche — le prompt sera moins contextualisé.
            </span>
          )}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[#6E5BFF]/40 bg-[#17122E] p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
          Optionnel · Prompt Byound AI
        </p>
        <h2 className="mt-2 text-xl font-extrabold">Auto-remplir depuis un brief</h2>
        <p className="mt-2 text-sm text-[#C9D2E8]">
          Vous pouvez tout saisir à la main ci-dessous. Le prompt pré-remplit la fiche en tenant
          compte du SIRET et du secteur — vous restez libre de tout modifier.
        </p>
        <textarea
          className={`${fieldClass} mt-4 min-h-[120px]`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex. Managers de proximité, besoin de mieux animer le feedback et les entretiens annuels, 2 jours en présentiel…"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void autofill()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {autofilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Auto-remplir la fiche
        </button>
      </section>

      <section className="space-y-4 rounded-[28px] border border-[#1A2340] bg-[#111831] p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93AE]">
            Cadrage Qualiopi · saisie manuelle
          </p>
          <p className="mt-1 text-sm text-[#C9D2E8]">
            Titre, objectifs, prérequis, compétences… éditables librement, avec ou sans AI.
          </p>
        </div>
        <Field label="Titre">
          <input
            className={fieldClass}
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Ex. Leadership hybride pour managers"
          />
        </Field>
        <Field label="Description courte">
          <textarea
            className={fieldClass}
            rows={3}
            value={draft.short_description}
            onChange={(e) => setDraft((d) => ({ ...d, short_description: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Durée">
            <input
              className={fieldClass}
              value={draft.duration}
              onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
            />
          </Field>
          <Field label="Niveau">
            <input
              className={fieldClass}
              value={draft.level}
              onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
            />
          </Field>
          <Field label="Domaine">
            <input
              className={fieldClass}
              value={draft.domain}
              onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
            />
          </Field>
        </div>

        <ListField
          label="Objectifs pédagogiques"
          addLabel="Ajouter un objectif"
          items={draft.objectives}
          placeholder="Ex. Formuler un feedback constructif en situation réelle"
          onChange={(objectives) => setDraft((d) => ({ ...d, objectives }))}
        />
        <ListField
          label="Prérequis"
          addLabel="Ajouter un prérequis"
          items={draft.prerequisites}
          placeholder="Ex. Encadrer au moins une personne"
          onChange={(prerequisites) => setDraft((d) => ({ ...d, prerequisites }))}
        />
        <ListField
          label="Compétences visées"
          addLabel="Ajouter une compétence"
          items={draft.skills}
          placeholder="Ex. Conduire un entretien annuel"
          onChange={(skills) => setDraft((d) => ({ ...d, skills }))}
        />
        <ListField
          label="Public cible"
          addLabel="Ajouter un public"
          items={draft.audience}
          placeholder="Ex. Managers de proximité"
          onChange={(audience) => setDraft((d) => ({ ...d, audience }))}
        />

        <Field label="Besoins spécifiques / adaptations">
          <textarea
            className={fieldClass}
            rows={2}
            value={draft.specific_needs}
            onChange={(e) => setDraft((d) => ({ ...d, specific_needs: e.target.value }))}
            placeholder="Accessibilité, rythme, contraintes métier…"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix intra (€ HT)">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.intra_price}
              onChange={(e) => setDraft((d) => ({ ...d, intra_price: e.target.value }))}
            />
          </Field>
          <Field label="Prix inter (€ HT)">
            <input
              className={fieldClass}
              inputMode="decimal"
              value={draft.inter_price}
              onChange={(e) => setDraft((d) => ({ ...d, inter_price: e.target.value }))}
            />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={() => void save()}
        >
          {saving && !generating ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          disabled={busy || !draft.title.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
          onClick={() => void save({ generateStructure: true })}
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Créer la formation avec Byound AI
        </button>
      </div>
    </div>
  );
}
