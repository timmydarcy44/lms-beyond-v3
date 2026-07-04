"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import type { CareerProfileRecord } from "@/lib/career-profiles/career-profiles-repo";
import { CareerProfileAiGenerateModal } from "@/components/super-admin/career-profiles/career-profile-ai-generate-modal";

type FormState = {
  title: string;
  slug: string;
  sector: string;
  description: string;
  key_skills: string;
  soft_skills: string;
  behavioral_expectations: string;
  typical_challenges: string;
  success_factors: string;
  main_missions: string;
  useful_qualities: string;
  recommended_badges: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  sector: "",
  description: "",
  key_skills: "",
  soft_skills: "",
  behavioral_expectations: "",
  typical_challenges: "",
  success_factors: "",
  main_missions: "",
  useful_qualities: "",
  recommended_badges: "Profil comportemental EDGE",
};

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToLines(value: string[] | undefined): string {
  return (value ?? []).join("\n");
}

function profileToForm(profile: Partial<CareerProfile>): FormState {
  return {
    title: profile.title ?? "",
    slug: profile.slug ?? "",
    sector: profile.sector ?? "",
    description: profile.description ?? "",
    key_skills: arrayToLines(profile.key_skills),
    soft_skills: arrayToLines(profile.soft_skills),
    behavioral_expectations: arrayToLines(profile.behavioral_expectations),
    typical_challenges: arrayToLines(profile.typical_challenges),
    success_factors: arrayToLines(profile.success_factors),
    main_missions: arrayToLines(profile.main_missions),
    useful_qualities: arrayToLines(profile.useful_qualities),
    recommended_badges: arrayToLines(profile.recommended_badges),
  };
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#635BFF]/40 focus:ring-2 focus:ring-[#635BFF]/10";

const TEXTAREA = `${INPUT} min-h-[88px] resize-y leading-relaxed`;

export function CareerProfilesCms() {
  const [profiles, setProfiles] = useState<CareerProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [aiOpen, setAiOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super/career-profiles");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setProfiles(json.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSelectedSlug(null);
  };

  const handleSelect = (profile: CareerProfileRecord) => {
    setSelectedSlug(profile.slug);
    setForm(profileToForm(profile));
    setSuccess(null);
    setError(null);
  };

  const handleAiGenerated = (content: Partial<CareerProfile>) => {
    setForm(profileToForm(content));
    setSuccess("Fiche générée par ChatGPT — relisez et enregistrez.");
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        sector: form.sector.trim(),
        description: form.description.trim(),
        key_skills: linesToArray(form.key_skills),
        soft_skills: linesToArray(form.soft_skills),
        behavioral_expectations: linesToArray(form.behavioral_expectations),
        typical_challenges: linesToArray(form.typical_challenges),
        success_factors: linesToArray(form.success_factors),
        main_missions: linesToArray(form.main_missions),
        useful_qualities: linesToArray(form.useful_qualities),
        recommended_badges: linesToArray(form.recommended_badges),
      };

      const res = await fetch("/api/super/career-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");

      setSuccess("Fiche métier enregistrée en base.");
      setSelectedSlug(json.profile?.slug ?? form.slug);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDb = async (profile: CareerProfileRecord) => {
    if (profile.source !== "db") return;
    if (!window.confirm(`Supprimer « ${profile.title} » de la base ?`)) return;

    try {
      const res = await fetch(`/api/super/career-profiles/${profile.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      if (selectedSlug === profile.slug) resetForm();
      await load();
      setSuccess("Fiche supprimée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">Super Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Référentiel métiers EDGE</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Alimentez les fiches métiers à la main. ChatGPT propose les hard skills et soft skills — vous validez puis
            enregistrez en base. Les fiches statiques (code) restent en secours tant qu&apos;elles ne sont pas recréées
            ici.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setAiOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5248e8]"
        >
          <Plus className="h-4 w-4" />
          Nouveau métier
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {success ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Métiers ({profiles.length})</h2>
          {loading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          ) : (
            <ul className="mt-3 max-h-[70vh] space-y-1 overflow-y-auto">
              {profiles.map((profile) => (
                <li key={profile.slug}>
                  <button
                    type="button"
                    onClick={() => handleSelect(profile)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                      selectedSlug === profile.slug ? "bg-[#635BFF]/10" : "hover:bg-gray-50"
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-900">{profile.title}</span>
                      <span className="text-xs text-gray-500">
                        {profile.sector} · {profile.source === "db" ? "Base" : "Statique"}
                      </span>
                    </span>
                    {profile.source === "db" ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteDb(profile);
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {selectedSlug ? "Édition" : "Nouvelle fiche métier"}
            </h2>
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#635BFF]/25 bg-[#635BFF]/5 px-3 py-2 text-sm font-medium text-[#635BFF] hover:bg-[#635BFF]/10"
            >
              <Sparkles className="h-4 w-4" />
              Générer avec ChatGPT
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-gray-700">Titre du métier</span>
                <input
                  className={INPUT}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Commercial en immobilier"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Slug</span>
                <input
                  className={INPUT}
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="commercial-immobilier"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-gray-700">Secteur</span>
                <input
                  className={INPUT}
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  placeholder="Immobilier"
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Description</span>
              <textarea
                className={TEXTAREA}
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Hard skills (une par ligne)</span>
              <textarea
                className={TEXTAREA}
                rows={5}
                value={form.key_skills}
                onChange={(e) => setForm((f) => ({ ...f, key_skills: e.target.value }))}
                placeholder={"prospection\nnégociation\nclosing"}
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-gray-700">Soft skills (une par ligne)</span>
              <textarea
                className={TEXTAREA}
                rows={5}
                value={form.soft_skills}
                onChange={(e) => setForm((f) => ({ ...f, soft_skills: e.target.value }))}
                placeholder={"écoute active\npersévérance\ncommunication"}
              />
              <p className="mt-1 text-xs text-gray-500">
                ChatGPT rapproche les libellés du test EDGE (20 soft skills) pour le comparatif Profil EDGE.
              </p>
            </label>

            <details className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Champs complémentaires</summary>
              <div className="mt-4 space-y-3">
                {(
                  [
                    ["main_missions", "Missions principales"],
                    ["useful_qualities", "Qualités utiles"],
                    ["typical_challenges", "Difficultés fréquentes"],
                    ["behavioral_expectations", "Attentes comportementales"],
                    ["success_factors", "Facteurs de réussite"],
                    ["recommended_badges", "Badges recommandés"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    <span className="mb-1 block text-gray-600">{label}</span>
                    <textarea
                      className={TEXTAREA}
                      rows={3}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>
            </details>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#050505] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer en base
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </section>
      </div>

      <CareerProfileAiGenerateModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        defaults={{ title: form.title, sector: form.sector }}
        existing={form}
        onGenerated={handleAiGenerated}
      />
    </div>
  );
}
