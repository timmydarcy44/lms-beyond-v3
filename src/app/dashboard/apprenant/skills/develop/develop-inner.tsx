"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";

import { SkillLevelSelector } from "@/components/hard-skills/skill-level-selector";
import {
  SkillsEmptyHint,
  SkillsProgressBar,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  TRAINING_MODALITY_TYPES,
  encodeSkillParam,
  nextHardSkillLevel,
} from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import {
  listCatalogEntries,
  searchCatalogEntries,
  type HardSkillCatalogEntry,
} from "@/lib/hard-skills/hard-skills-portfolio";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function DevelopInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("skill")?.trim() || "";
  const { records, meta, upsertSkill, loading } = useEdgeSkillsCenter();

  const [step, setStep] = useState<Step>(preselect ? 2 : 1);
  const [query, setQuery] = useState(preselect);
  const [selected, setSelected] = useState<HardSkillCatalogEntry | null>(
    preselect ? { name: preselect, category: "Autre" } : null,
  );
  const [currentLevel, setCurrentLevel] = useState<HardSkillLevel>("Intermédiaire");
  const [targetLevel, setTargetLevel] = useState<HardSkillLevel>("Confirmé");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelsTouched, setLevelsTouched] = useState(false);

  const existing = useMemo(() => {
    if (!selected) return null;
    return records.find((r) => r.name.toLowerCase() === selected.name.toLowerCase()) ?? null;
  }, [records, selected]);

  useEffect(() => {
    if (!existing || levelsTouched) return;
    setCurrentLevel(existing.level);
    const storedTarget = meta[existing.name]?.trainingTargetLevel;
    setTargetLevel(storedTarget ?? nextHardSkillLevel(existing.level));
  }, [existing, meta, levelsTouched]);

  const results = useMemo(() => {
    if (query.trim().length < 1) return listCatalogEntries().slice(0, 12);
    return searchCatalogEntries(query).slice(0, 16);
  }, [query]);

  const pickSkill = (entry: HardSkillCatalogEntry) => {
    setSelected(entry);
    setLevelsTouched(false);
    const rec = records.find((r) => r.name.toLowerCase() === entry.name.toLowerCase());
    const level = rec?.level ?? "Intermédiaire";
    setCurrentLevel(level);
    setTargetLevel(meta[entry.name]?.trainingTargetLevel ?? nextHardSkillLevel(level));
    setStep(2);
  };

  const startPlan = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await upsertSkill(selected.name, currentLevel, {
        targetLevel,
        source: "catalog",
      });
      setStep(3);
    } catch {
      setError("Impossible d’enregistrer le plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
      <button
        type="button"
        onClick={() =>
          step === 1
            ? router.push("/dashboard/apprenant/skills")
            : setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
        }
        className="inline-flex items-center gap-2 text-[13px] text-white/40 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <header className="mt-6 space-y-2">
        <SkillsSectionKicker>Développer</SkillsSectionKicker>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          {step === 1 && "Que voulez-vous développer ?"}
          {step === 2 && "Confirmez votre objectif"}
          {step === 3 && "Votre plan de progression"}
        </h1>
        <p className="text-[13px] text-white/35">Étape {step} / 3</p>
      </header>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      ) : null}

      {step === 1 && (
        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans le référentiel EDGE…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              autoFocus
            />
          </div>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06]">
            {results.map((entry) => (
              <li key={`${entry.category}-${entry.name}`}>
                <button
                  type="button"
                  onClick={() => pickSkill(entry)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
                >
                  <span>
                    <span className="block text-[14px] font-medium text-white">{entry.name}</span>
                    {entry.subtitle ? (
                      <span className="mt-0.5 block text-[12px] text-white/35">{entry.subtitle}</span>
                    ) : (
                      <span className="mt-0.5 block text-[12px] text-white/30">{entry.category}</span>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-4 py-6">
                <SkillsEmptyHint>Aucune compétence trouvée.</SkillsEmptyHint>
              </li>
            )}
          </ul>
        </div>
      )}

      {step === 2 && selected && (
        <div className="mt-8 space-y-8">
          <div className="space-y-1">
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-white">{selected.name}</p>
            {existing ? (
              <p className="text-[13px] text-white/40">Déjà dans votre capital · {existing.level}</p>
            ) : (
              <p className="text-[13px] text-white/40">Nouvelle compétence à entraîner</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">Niveau actuel</p>
            <SkillLevelSelector
              value={currentLevel}
              onChange={(level) => {
                setLevelsTouched(true);
                setCurrentLevel(level);
              }}
            />
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">Niveau visé</p>
            <SkillLevelSelector
              value={targetLevel}
              onChange={(level) => {
                setLevelsTouched(true);
                setTargetLevel(level);
              }}
            />
          </div>

          {error && <p className="text-[13px] text-rose-300">{error}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={() => void startPlan()}
            className={cn(CONNECT_BTN_PRIMARY, "w-full sm:w-auto")}
          >
            {saving ? "Création…" : "Créer mon plan"}
          </button>
        </div>
      )}

      {step === 3 && selected && (
        <div className="mt-8 space-y-8">
          <div className="space-y-2">
            <p className="text-[22px] font-semibold text-white">{selected.name}</p>
            <p className="text-[14px] text-white/45">
              {currentLevel} → {targetLevel}
            </p>
            <SkillsProgressBar value={28} className="mt-3 max-w-sm" />
          </div>

          <div className="space-y-3">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/35">
              Modalités d’entraînement
            </p>
            <div className="flex flex-wrap gap-2">
              {TRAINING_MODALITY_TYPES.map((m) => (
                <span
                  key={m.id}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/55"
                >
                  {m.label}
                </span>
              ))}
            </div>
            <SkillsEmptyHint>
              Votre plan accueillera progressivement exercices, simulations IA, cas pratiques,
              micro-learning, quiz et validations humaines.
            </SkillsEmptyHint>
          </div>

          <div className="rounded-2xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/[0.07] p-5">
            <p className="text-[13px] font-medium text-[#B8D0FF]">
              Pour progresser en {selected.name.toLowerCase()}, nous vous recommandons un module
              EDGE Learn.
            </p>
            <Link
              href="/dashboard/apprenant/formations"
              className="mt-3 inline-flex text-[13px] font-semibold text-[#7BA7FF] hover:text-white"
            >
              Apprendre avec Learn →
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/apprenant/skills/entrainement?skill=${encodeSkillParam(selected.name)}`}
              className={CONNECT_BTN_PRIMARY}
            >
              Commencer l’entraînement
            </Link>
            <Link href="/dashboard/apprenant/skills" className={CONNECT_BTN_SECONDARY}>
              Retour à Skills
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
