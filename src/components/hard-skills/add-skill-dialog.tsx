"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import {
  GLOBAL_SKILL_REFERENTIAL,
  referentialItemName,
  referentialItemSubtitle,
} from "@/lib/profile/competency-referential";
import {
  searchCatalogEntries,
  type HardSkillCatalogEntry,
} from "@/lib/hard-skills/hard-skills-portfolio";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { SkillLevelSelector } from "@/components/hard-skills/skill-level-selector";
import { SkillStatusBadge } from "@/components/hard-skills/skill-status-badge";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

type Step = "search" | "level" | "confirm";

type Props = {
  open: boolean;
  existingSkills: string[];
  saving?: boolean;
  onClose: () => void;
  onAdd: (entry: HardSkillCatalogEntry, level: HardSkillLevel) => Promise<void>;
  onProof?: (skillName: string, level: HardSkillLevel) => void;
  onEvaluate?: (skillName: string, level: HardSkillLevel) => void;
  onExploreCatalog?: () => void;
};

function entriesForCategory(category: string): HardSkillCatalogEntry[] {
  const group = GLOBAL_SKILL_REFERENTIAL.find((g) => g.category === category);
  if (!group) return [];
  return group.items.map((item) => ({
    name: referentialItemName(item),
    subtitle: referentialItemSubtitle(item) || undefined,
    category: group.category,
  }));
}

export function AddSkillDialog({
  open,
  existingSkills,
  saving,
  onClose,
  onAdd,
  onProof,
  onEvaluate,
  onExploreCatalog,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<HardSkillCatalogEntry | null>(null);
  const [level, setLevel] = useState<HardSkillLevel>("Intermédiaire");
  const [addedLevel, setAddedLevel] = useState<HardSkillLevel>("Intermédiaire");

  useEffect(() => {
    if (!open) return;
    setStep("search");
    setQuery("");
    setBrowseCategory(null);
    setSelected(null);
    setLevel("Intermédiaire");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const displayResults = useMemo(() => {
    if (query.trim()) return searchCatalogEntries(query).slice(0, 40);
    if (browseCategory) return entriesForCategory(browseCategory);
    return [];
  }, [query, browseCategory]);

  if (!open) return null;

  const pick = (entry: HardSkillCatalogEntry) => {
    if (existingSkills.some((s) => s.toLowerCase() === entry.name.toLowerCase())) return;
    setSelected(entry);
    setLevel("Intermédiaire");
    setStep("level");
  };

  const submit = async () => {
    if (!selected) return;
    await onAdd(selected, level);
    setAddedLevel(level);
    setStep("confirm");
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-end justify-center bg-black/75 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0D111A] shadow-2xl sm:max-h-[88vh] sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            {step === "level" ? (
              <button
                type="button"
                onClick={() => setStep("search")}
                className="inline-flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            ) : (
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Compétences
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === "search" ? (
            <div className="space-y-5">
              <div>
                <h2 id={titleId} className="text-[1.35rem] font-bold tracking-[-0.03em] text-white">
                  Quelle compétence possédez-vous déjà ?
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-white/50">
                  Recherchez une compétence pour l&apos;ajouter à votre profil.
                </p>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim()) setBrowseCategory(null);
                  }}
                  placeholder="Ex. Excel, React.js, négociation, prompt engineering…"
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.05] py-3.5 pl-11 pr-4 text-[15px] text-white outline-none focus:border-[#3D7BFF]/45"
                  aria-label="Rechercher une compétence"
                />
              </div>

              {!query.trim() && !browseCategory ? (
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Explorer les catégories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GLOBAL_SKILL_REFERENTIAL.map((g) => (
                      <button
                        key={g.category}
                        type="button"
                        onClick={() => setBrowseCategory(g.category)}
                        className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[13px] text-white/75 hover:bg-white/[0.08] hover:text-white"
                      >
                        {g.category}
                      </button>
                    ))}
                  </div>
                  {onExploreCatalog ? (
                    <button
                      type="button"
                      onClick={onExploreCatalog}
                      className="text-[13px] font-medium text-[#8BB4FF] hover:underline"
                    >
                      Explorer le catalogue complet
                    </button>
                  ) : null}
                </div>
              ) : null}

              {browseCategory && !query.trim() ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-white/60">{browseCategory}</p>
                  <button
                    type="button"
                    onClick={() => setBrowseCategory(null)}
                    className="text-[13px] text-[#8BB4FF]"
                  >
                    Toutes les catégories
                  </button>
                </div>
              ) : null}

              {query.trim() || browseCategory ? (
                <ul className="space-y-2">
                  {displayResults.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-[14px] text-white/45">
                      Aucune compétence trouvée. Essayez un autre mot-clé.
                    </li>
                  ) : (
                    displayResults.map((entry) => {
                      const already = existingSkills.some(
                        (s) => s.toLowerCase() === entry.name.toLowerCase(),
                      );
                      return (
                        <li key={`${entry.category}-${entry.name}`}>
                          <button
                            type="button"
                            disabled={already}
                            onClick={() => pick(entry)}
                            className={cn(
                              "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
                              already
                                ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
                                : "border-white/10 bg-white/[0.03] hover:border-[#3D7BFF]/35 hover:bg-[#3D7BFF]/10",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block text-[15px] font-semibold text-white">
                                {entry.name}
                              </span>
                              {entry.subtitle ? (
                                <span className="mt-1 block line-clamp-2 text-[13px] text-white/45">
                                  {entry.subtitle}
                                </span>
                              ) : null}
                              <span className="mt-1.5 block text-[12px] text-white/35">
                                {entry.category}
                              </span>
                            </span>
                            <span className="shrink-0 text-[13px] font-semibold text-[#8BB4FF]">
                              {already ? "Déjà ajoutée" : "Ajouter"}
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              ) : null}
            </div>
          ) : null}

          {step === "level" && selected ? (
            <div className="space-y-5">
              <div>
                <h2 id={titleId} className="text-[1.35rem] font-bold tracking-[-0.03em] text-white">
                  Quel est votre niveau actuel ?
                </h2>
                <p className="mt-2 text-[15px] font-medium text-white/80">{selected.name}</p>
                {selected.subtitle ? (
                  <p className="mt-1 text-[13px] text-white/45">{selected.subtitle}</p>
                ) : null}
              </div>

              <SkillLevelSelector value={level} onChange={setLevel} />

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[13px] leading-relaxed text-white/65">
                <p className="font-semibold text-white/90">
                  Cette compétence sera ajoutée comme auto-déclarée.
                </p>
                <p className="mt-2">
                  Vous pourrez ensuite la faire reconnaître dans EDGE en déposant une preuve, en
                  passant une évaluation ou en demandant une validation.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void submit()}
                  className={`${CONNECT_BTN_PRIMARY} w-full justify-center sm:w-auto`}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Ajouter à mon profil
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${CONNECT_BTN_SECONDARY} w-full justify-center sm:w-auto`}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {step === "confirm" && selected ? (
            <div className="space-y-5">
              <div>
                <h2 id={titleId} className="text-[1.35rem] font-bold tracking-[-0.03em] text-white">
                  {selected.name} a été ajouté à votre profil.
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px] text-white/70">
                  <span>
                    Niveau déclaré : <strong className="text-white">{addedLevel}</strong>
                  </span>
                  <SkillStatusBadge status="auto_declared" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[13px] font-medium text-white/50">Prochaine étape (optionnelle)</p>
                <button
                  type="button"
                  onClick={() => onProof?.(selected.name, addedLevel)}
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3.5 text-left text-[15px] font-semibold text-white hover:bg-white/[0.07]"
                >
                  Déposer une preuve
                </button>
                <button
                  type="button"
                  onClick={() => onEvaluate?.(selected.name, addedLevel)}
                  className="w-full rounded-2xl border border-[#3D7BFF]/35 bg-[#3D7BFF]/12 px-4 py-3.5 text-left text-[15px] font-semibold text-white hover:bg-[#3D7BFF]/18"
                >
                  Passer une évaluation
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl border border-transparent px-4 py-3 text-[14px] font-medium text-white/50 hover:text-white"
                >
                  Continuer plus tard
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
