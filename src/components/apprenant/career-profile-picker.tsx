"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { FEATURED_CAREER_CHIPS } from "@/lib/career-profiles/featured-careers";
import { cn } from "@/lib/utils";

type Tab = "featured" | "other";

type Props = {
  value: string | null;
  selectedTitle?: string | null;
  disabled?: boolean;
  onResolved: (slug: string, profile: CareerProfile, meta: { cached: boolean }) => void;
};

export function CareerProfilePicker({ value, selectedTitle, disabled, onResolved }: Props) {
  const isFeatured = value ? FEATURED_CAREER_CHIPS.some((c) => c.slug === value) : false;
  const [tab, setTab] = useState<Tab>(value && !isFeatured ? "other" : "featured");
  const [customTitle, setCustomTitle] = useState(selectedTitle ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!value) return;
    const featured = FEATURED_CAREER_CHIPS.some((c) => c.slug === value);
    if (!featured) {
      setTab("other");
      if (selectedTitle) setCustomTitle(selectedTitle);
    }
  }, [value, selectedTitle]);

  const resolveCareer = async (payload: { slug?: string; title?: string }) => {
    setLoading(true);
    setError(null);
    setStatusMessage(
      payload.title && !payload.slug
        ? "Analyse du métier en cours avec l'IA EDGE…"
        : "Chargement de la fiche métier…",
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
          ? "Fiche métier chargée."
          : "Fiche métier générée et enregistrée — elle sera réutilisée pour les prochains apprenants.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (slug: string) => {
    if (disabled || loading) return;
    void resolveCareer({ slug });
  };

  const handleCustomSubmit = () => {
    const title = customTitle.trim();
    if (!title || disabled || loading) return;
    void resolveCareer({ title });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white">Métier ou projet visé</label>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setTab("featured")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition",
            tab === "featured"
              ? "bg-[#3D7BFF] text-white"
              : "border border-white/15 bg-white/[0.04] text-white/60 hover:text-white",
          )}
        >
          Métiers courants
        </button>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setTab("other")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition",
            tab === "other"
              ? "bg-[#3D7BFF] text-white"
              : "border border-white/15 bg-white/[0.04] text-white/60 hover:text-white",
          )}
        >
          Autre
        </button>
      </div>

      {tab === "featured" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {FEATURED_CAREER_CHIPS.map((chip) => {
            const selected = value === chip.slug;
            return (
              <button
                key={chip.slug}
                type="button"
                disabled={disabled || loading}
                onClick={() => handleChip(chip.slug)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  selected
                    ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/15 text-white"
                    : "border-white/12 bg-white/[0.04] text-white/75 hover:border-white/25 hover:bg-white/[0.07]",
                )}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-white/45">
            Saisissez n&apos;importe quel métier (ex. cuisinier, infirmier, développeur web). EDGE génère
            automatiquement les compétences et les enregistre pour les prochains utilisateurs.
          </p>
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
            placeholder="Ex. Cuisinier, Agent immobilier, Data analyst…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#3D7BFF]/40"
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
      )}

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
