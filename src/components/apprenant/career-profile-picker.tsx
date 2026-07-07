"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import {
  CAREER_OTHER_VALUE,
  getCareerDropdownOptions,
} from "@/lib/career-profiles/featured-careers";
import { EdgeSelect } from "@/components/ui/edge-select";

type Props = {
  value: string | null;
  selectedTitle?: string | null;
  disabled?: boolean;
  onResolved: (
    slug: string,
    profile: CareerProfile,
    meta: { cached: boolean; userLabel: string },
  ) => void;
};

export function CareerProfilePicker({ value, selectedTitle, disabled, onResolved }: Props) {
  const options = getCareerDropdownOptions();
  const [selectValue, setSelectValue] = useState("");
  const [search, setSearch] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [apiResults, setApiResults] = useState<CareerProfile[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const byLabel = selectedTitle
      ? options.find((o) => o.label.toLowerCase() === selectedTitle.toLowerCase())
      : null;
    const bySlug = options.find((o) => o.slug === value);
    const match = byLabel ?? bySlug;
    if (match) {
      setSelectValue(match.id);
      setSearch(selectedTitle ?? match.label);
    } else {
      setSelectValue(CAREER_OTHER_VALUE);
      const title = selectedTitle ?? value.replace(/-/g, " ");
      setCustomTitle(title);
      setSearch(title);
    }
  }, [value, selectedTitle, options]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!searchOpen || search.trim().length < 2) {
      setApiResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/career-profiles/search?q=${encodeURIComponent(search)}`);
          const json = await res.json();
          if (!cancelled && res.ok) setApiResults((json.profiles ?? []) as CareerProfile[]);
        } catch {
          if (!cancelled) setApiResults([]);
        }
      })();
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, searchOpen]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [search, options]);

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
      const userLabel = payload.title?.trim() || profile.title;
      onResolved(profile.slug, profile, { cached: Boolean(json.cached), userLabel });
      setSearch(userLabel);
      setSelectValue(
        options.find((o) => o.label === userLabel)?.id ??
          options.find((o) => o.slug === profile.slug)?.id ??
          CAREER_OTHER_VALUE,
      );
      setStatusMessage(
        json.cached
          ? "Référentiel métier chargé."
          : "Référentiel généré et enregistré pour les prochains apprenants.",
      );
      setSearchOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const pickProfile = (profile: CareerProfile) => {
    setError(null);
    void resolveCareer({ slug: profile.slug, title: profile.title });
  };

  const handleSelectChange = (next: string) => {
    setSelectValue(next);
    setError(null);
    if (next === CAREER_OTHER_VALUE) {
      setSearchOpen(false);
      return;
    }
    if (!next) return;
    const opt = options.find((o) => o.id === next);
    if (opt) {
      setSearch(opt.label);
      void resolveCareer({ slug: opt.slug, title: opt.label });
    }
  };

  const handleCustomSubmit = () => {
    const title = customTitle.trim();
    if (!title || disabled || loading) return;
    setSearch(title);
    void resolveCareer({ title });
  };

  const selectClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  const showDropdown = searchOpen && (filteredOptions.length > 0 || apiResults.length > 0);

  return (
    <div ref={rootRef}>
      <label className="block text-sm font-medium text-white">Métier visé</label>
      <p className="mt-1 text-xs text-white/45">
        Recherchez un métier du référentiel EDGE ou précisez le vôtre. Ce choix alimente l&apos;analyse de
        compatibilité.
      </p>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="text"
          disabled={disabled || loading}
          value={search}
          placeholder="Rechercher un métier…"
          className={`${selectClass} pl-10`}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchOpen(true);
          }}
        />
        {showDropdown ? (
          <ul className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#17171F] py-1 shadow-xl">
            {filteredOptions.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  className="flex w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/[0.06]"
                  onClick={() => {
                    setSelectValue(opt.id);
                    void resolveCareer({ slug: opt.slug, title: opt.label });
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {apiResults
              .filter((p) => !filteredOptions.some((o) => o.slug === p.slug))
              .map((profile) => (
                <li key={profile.slug}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-white/[0.06]"
                    onClick={() => pickProfile(profile)}
                  >
                    <span className="text-sm font-medium text-white">{profile.title}</span>
                    <span className="text-xs text-white/45">{profile.sector}</span>
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
      </div>

      <EdgeSelect
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled || loading}
        placeholder="Ou sélectionnez dans la liste…"
        className="mt-3"
        options={[
          ...options.map((opt) => ({ value: opt.id, label: opt.label })),
          { value: CAREER_OTHER_VALUE, label: "Autre" },
        ]}
      />

      {selectValue === CAREER_OTHER_VALUE ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm text-white/70">Précisez le métier visé</label>
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
            placeholder="Ex. Cuisinier, Infirmier, Data analyst…"
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
