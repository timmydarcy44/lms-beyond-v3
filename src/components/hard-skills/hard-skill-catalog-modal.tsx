"use client";

import { useMemo, useState } from "react";
import {
  GLOBAL_SKILL_REFERENTIAL,
  referentialItemName,
  referentialItemSubtitle,
  resolveToolLogo,
} from "@/lib/profile/competency-referential";
import { searchCatalogEntries, type HardSkillCatalogEntry } from "@/lib/hard-skills/hard-skills-portfolio";

type Props = {
  open: boolean;
  existingSkills: string[];
  onClose: () => void;
  onSelectSkill: (entry: HardSkillCatalogEntry) => void;
};

export function HardSkillCatalogModal({ open, existingSkills, onClose, onSelectSkill }: Props) {
  const [skillSearch, setSkillSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(GLOBAL_SKILL_REFERENTIAL[0]?.category ?? "");

  const categories = useMemo(
    () => GLOBAL_SKILL_REFERENTIAL.map((group) => group.category),
    [],
  );

  const visibleEntries = useMemo(() => {
    if (skillSearch.trim()) return searchCatalogEntries(skillSearch);
    const group = GLOBAL_SKILL_REFERENTIAL.find((g) => g.category === activeCategory);
    if (!group) return [];
    return group.items.map((item) => ({
      name: referentialItemName(item),
      subtitle: referentialItemSubtitle(item),
      category: group.category,
    }));
  }, [skillSearch, activeCategory]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-3 py-6 sm:px-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden overflow-y-auto rounded-3xl border border-white/10 bg-[#0D111A] text-white shadow-2xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">Ajouter une compétence</div>
              <div className="mt-1 text-lg font-semibold text-white">Catalogue de compétences EDGE</div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Rechercher une compétence…"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none sm:w-72"
              />
              <button
                type="button"
                onClick={() => {
                  setSkillSearch("");
                  onClose();
                }}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/75"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-1 md:min-h-[430px] md:grid-cols-[280px_1fr]">
          <aside className="border-b border-white/10 bg-white/[0.03] p-4 md:border-b-0 md:border-r">
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setSkillSearch("");
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    activeCategory === category && !skillSearch
                      ? "bg-white/15 text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </aside>

          <div className="p-4">
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {visibleEntries.map((entry) => {
                const already = existingSkills.includes(entry.name);
                const logo = resolveToolLogo(entry.name);
                return (
                  <button
                    key={`${entry.category}-${entry.name}`}
                    type="button"
                    disabled={already}
                    onClick={() => onSelectSkill(entry)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      {logo ? (
                        <img src={logo} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" />
                      ) : (
                        <span className="h-5 w-5 shrink-0 rounded-sm bg-white/10" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm text-white/85">{entry.name}</span>
                        {entry.subtitle ? (
                          <span className="block text-[11px] leading-snug text-white/45">{entry.subtitle}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-white/55">{already ? "Ajoutée" : "Configurer"}</span>
                  </button>
                );
              })}
              {visibleEntries.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/45">Aucune compétence trouvée.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
