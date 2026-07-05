"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import {
  CAREER_OTHER_VALUE,
  getCareerDropdownOptions,
} from "@/lib/career-profiles/featured-careers";

type Props = {
  value: string | null;
  selectedTitle?: string | null;
  disabled?: boolean;
  onResolved: (slug: string, profile: CareerProfile, meta: { cached: boolean }) => void;
};

export function CareerProfilePicker({ value, selectedTitle, disabled, onResolved }: Props) {
  const options = getCareerDropdownOptions();
  const [selectValue, setSelectValue] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    const match = options.find((o) => o.slug === value);
    if (match) {
      setSelectValue(match.id);
    } else {
      setSelectValue(CAREER_OTHER_VALUE);
      setCustomTitle(selectedTitle ?? value.replace(/-/g, " "));
    }
  }, [value, selectedTitle, options]);

  const resolveCareer = async (payload: { slug?: string; title?: string }) => {
    setLoading(true);
    setError(null);
    setStatusMessage(
      payload.title && !payload.slug
        ? "Analyse du métier en cours avec l'IA EDGE…"
        : "Chargement du référentiel métier…",
    );

    try {
      const res = await fetch("/api/learner/career-profiles/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analyse impossible");

      const profile = json.profile as CareerProfile;
      onResolved(profile.slug, profile, { cached: Boolean(json.cached) });
      setStatusMessage(
        json.cached
          ? "Référentiel métier chargé."
          : "Référentiel généré et enregistré pour les prochains apprenants.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (next: string) => {
    setSelectValue(next);
    setError(null);
    if (next === CAREER_OTHER_VALUE || !next) return;
    const opt = options.find((o) => o.id === next);
    if (opt) void resolveCareer({ slug: opt.slug, title: opt.label });
  };

  const handleCustomSubmit = () => {
    const title = customTitle.trim();
    if (!title || disabled || loading) return;
    void resolveCareer({ title });
  };

  const selectClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <div>
      <label className="block text-sm font-medium text-white">Métier visé (référentiel EDGE)</label>
      <p className="mt-1 text-xs text-white/45">
        Le métier choisi devient le référentiel pour l&apos;analyse de compatibilité et le plan d&apos;action.
      </p>

      <select
        disabled={disabled || loading}
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        className={`${selectClass} mt-3`}
      >
        <option value="">Sélectionnez un métier…</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
        <option value={CAREER_OTHER_VALUE}>Autre</option>
      </select>

      {selectValue === CAREER_OTHER_VALUE ? (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            disabled={disabled || loading}
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            placeholder="Saisissez votre métier (ex. Cuisinier, Infirmier…)"
            className={selectClass}
          />
          <button
            type="button"
            disabled={disabled || loading || !customTitle.trim()}
            onClick={handleCustomSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyser ce métier
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {statusMessage}
        </p>
      ) : statusMessage ? (
        <p className="mt-3 text-xs text-emerald-400/90">{statusMessage}</p>
      ) : null}

      {error ? <p className="mt-3 text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
