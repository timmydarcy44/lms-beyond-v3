"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/builder/fiche-builder-chrome";

export type OfferSkillDraft = {
  label: string;
  kind: "soft" | "hard";
  importance: "required" | "preferred";
};

type Hit = { label: string; kind: "soft" | "hard" };

export function OfferStepSkills({
  title,
  description,
  skills,
  onChange,
}: {
  title: string;
  description: string;
  skills: OfferSkillDraft[];
  onChange: (skills: OfferSkillDraft[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [canAdd, setCanAdd] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Hit[]>([]);
  const required = skills.filter((skill) => skill.importance === "required").length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetch("/api/dashboard/entreprise/job-offers/skill-suggestions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })
        .then((res) => res.json())
        .then((json: { skills?: Hit[] }) => setSuggestions(json.skills ?? []))
        .catch(() => setSuggestions([]));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [title, description]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 1) {
      setHits([]);
      setCanAdd(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/dashboard/entreprise/job-offers/skill-search?q=${encodeURIComponent(value)}`, { credentials: "include" })
        .then((res) => res.json())
        .then((json: { skills?: Hit[]; canAdd?: boolean }) => {
          setHits(json.skills ?? []);
          setCanAdd(Boolean(json.canAdd));
        })
        .catch(() => {
          setHits([]);
          setCanAdd(false);
        });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const add = (skill: Hit, importance: OfferSkillDraft["importance"] = "preferred") => {
    if (skills.some((item) => item.label.toLowerCase() === skill.label.toLowerCase())) return;
    if (skills.length >= 8) {
      toast.error("8 compétences maximum.");
      return;
    }
    onChange([...skills, { label: skill.label, kind: skill.kind, importance }]);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="mt-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Compétences retenues</p>
        <p className="text-sm text-[#6B6F7A]">{skills.length} / 8 · {required} indispensables</p>
      </div>
      <ul className="space-y-2">
        {skills.map((skill, index) => (
          <li key={`${skill.label}-${index}`} className="flex h-[54px] items-center gap-3 rounded-2xl bg-[#F4F4F1] px-3">
            <span className={skill.kind === "soft" ? "rounded-full bg-[#E3F6EC] px-2.5 py-1 text-xs font-semibold text-[#126B3B]" : "rounded-full bg-[#EEEBFF] px-2.5 py-1 text-xs font-semibold text-[#4B3BD1]"}>
              {skill.kind === "soft" ? "Soft" : "Hard"}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{skill.label}</span>
            <Segmented
              label={`Importance de ${skill.label}`}
              value={skill.importance === "required" ? "Indispensable" : "Souhaitée"}
              options={["Indispensable", "Souhaitée"]}
              onChange={(value) => onChange(skills.map((item, itemIndex) => itemIndex === index ? { ...item, importance: value === "Indispensable" ? "required" : "preferred" } : item))}
            />
            <button type="button" aria-label={`Retirer ${skill.label}`} className="h-8 w-8 rounded-full text-lg text-[#3A3D45]" onClick={() => onChange(skills.filter((_, itemIndex) => itemIndex !== index))}>
              ×
            </button>
          </li>
        ))}
      </ul>

      {suggestions.length > 0 ? (
        <div className="rounded-[20px] bg-[#F1EFFF] p-4">
          <p className="text-sm font-semibold text-[#4B3BD1]">✦ Suggérées pour « {title.trim() || "ce poste"} »</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.filter((skill) => !skills.some((item) => item.label.toLowerCase() === skill.label.toLowerCase())).slice(0, 6).map((skill) => (
              <button key={skill.label} type="button" onClick={() => add(skill)} className="h-[42px] rounded-full bg-white px-3 text-sm font-semibold text-[#4B3BD1]">
                + {skill.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative">
        <label htmlFor="offer-skill-search" className="mb-2 block text-sm font-semibold">Rechercher une compétence</label>
        <input
          id="offer-skill-search"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Chercher dans le catalogue (soft et hard skills) ou ajouter une compétence"
          className="h-14 w-full rounded-2xl border border-[#E3E0D8] px-4 text-base outline-none focus:border-[#07080B]"
        />
        {open && (hits.length > 0 || canAdd) ? (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-2xl border border-[#E3E0D8] bg-white p-1 shadow-sm">
            {hits.map((skill) => (
              <li key={skill.label}>
                <button type="button" className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-[#F4F4F1]" onClick={() => add(skill)}>
                  <span>{skill.label}</span>
                  <span className="text-xs text-[#6B6F7A]">{skill.kind === "soft" ? "Soft" : "Hard"}</span>
                </button>
              </li>
            ))}
            {canAdd ? (
              <li>
                <button type="button" className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#4B3BD1] hover:bg-[#F4F4F1]" onClick={() => add({ label: query.trim(), kind: "hard" })}>
                  Ajouter « {query.trim()} »
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
        <p className="mt-2 text-xs text-[#6B6F7A]">8 compétences maximum. Les indispensables servent à classer les candidatures (« X / N critères »).</p>
      </div>
    </div>
  );
}
