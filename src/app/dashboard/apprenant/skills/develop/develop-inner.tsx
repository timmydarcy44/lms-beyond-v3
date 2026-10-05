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
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { cn } from "@/lib/utils";

type SkillFamily = "soft" | "hard";
type Step = 1 | 2 | 3 | 4;

export default function DevelopInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("skill")?.trim() || "";
  const preselectIsSoft = useMemo(
    () =>
      preselect.length > 0 &&
      SOFT_SKILLS.some((s) => s.titre.toLowerCase() === preselect.toLowerCase()),
    [preselect],
  );
  const { records, meta, upsertSkill, loading } = useEdgeSkillsCenter();

  const [family, setFamily] = useState<SkillFamily | null>(
    preselect ? (preselectIsSoft ? "soft" : "hard") : null,
  );
  const [step, setStep] = useState<Step>(preselect ? 3 : 1);
  const [query, setQuery] = useState(preselect);
  const [selected, setSelected] = useState<HardSkillCatalogEntry | null>(
    preselect
      ? {
          name: preselect,
          category: preselectIsSoft ? "Soft skills" : "Compétence métier",
        }
      : null,
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
    setStep(3);
  };

  const chooseFamily = (next: SkillFamily) => {
    setFamily(next);
    setSelected(null);
    setQuery("");
    setStep(2);
  };

  const confirmHardSkillFreeText = () => {
    const name = query.trim();
    if (name.length < 2) {
      setError("Indiquez le nom de la compétence métier.");
      return;
    }
    setError(null);
    pickSkill({ name, category: "Compétence métier" });
  };

  const softSkillEntries = useMemo(
    () => SOFT_SKILLS.map((s) => ({ name: s.titre, category: "Soft skills" as const })),
    [],
  );

  const filteredSoft = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return softSkillEntries;
    return softSkillEntries.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, softSkillEntries]);

  const startPlan = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await upsertSkill(selected.name, currentLevel, {
        targetLevel,
        source: "catalog",
      });
      setStep(4);
    } catch {
      setError("Impossible d’enregistrer le plan.");
    } finally {
      setSaving(false);
    }
  };

  const stepLabel =
    step === 1
      ? "Famille"
      : step === 2
        ? family === "soft"
          ? "Soft skill"
          : "Compétence métier"
        : step === 3
          ? "Niveaux"
          : "Plan";
  const stepTotal = 4;

  return (
    <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
      <button
        type="button"
        onClick={() => {
          if (step === 1) {
            router.push("/dashboard/apprenant/skills");
            return;
          }
          if (step === 2) {
            setFamily(null);
            setStep(1);
            return;
          }
          setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
        }}
        className="inline-flex items-center gap-2 text-[13px] text-white/40 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <header className="mt-6 space-y-2">
        <SkillsSectionKicker>Développer</SkillsSectionKicker>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          {step === 1 && "Que voulez-vous développer ?"}
          {step === 2 && family === "soft" && "Choisissez un soft skill"}
          {step === 2 && family === "hard" && "Quelle compétence métier ?"}
          {step === 3 && "Confirmez votre objectif"}
          {step === 4 && "Votre plan de progression"}
        </h1>
        <p className="text-[13px] text-white/35">
          Étape {step} / {stepTotal} · {stepLabel}
        </p>
      </header>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      ) : null}

      {step === 1 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => chooseFamily("soft")}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-left transition hover:border-[#3D7BFF]/40 hover:bg-white/[0.06]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7BA7FF]/90">
              Soft skills
            </p>
            <p className="mt-2 text-[16px] font-semibold text-white">Comportement & relationnel</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">
              Choisissez parmi les 20 compétences de votre test (communication, organisation…).
            </p>
          </button>
          <button
            type="button"
            onClick={() => chooseFamily("hard")}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-left transition hover:border-[#3D7BFF]/40 hover:bg-white/[0.06]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7BA7FF]/90">
              Hard skills
            </p>
            <p className="mt-2 text-[16px] font-semibold text-white">Compétence métier</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">
              Saisissez librement une compétence liée à votre métier ou projet.
            </p>
          </button>
        </div>
      )}

      {step === 2 && family === "soft" && (
        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer les soft skills…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              autoFocus
            />
          </div>
          <ul className="max-h-[420px] divide-y divide-white/[0.05] overflow-y-auto rounded-2xl border border-white/[0.06]">
            {filteredSoft.map((entry) => (
              <li key={entry.name}>
                <button
                  type="button"
                  onClick={() => pickSkill(entry)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
                >
                  <span className="text-[14px] font-medium text-white">{entry.name}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === 2 && family === "hard" && (
        <div className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="hard-skill-name" className="text-[12px] uppercase tracking-[0.14em] text-white/35">
              Nom de la compétence
            </label>
            <input
              id="hard-skill-name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex. Community management, Excel avancé, Soudure TIG…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              autoFocus
            />
          </div>
          {error ? <p className="text-[13px] text-rose-300">{error}</p> : null}
          <button
            type="button"
            onClick={confirmHardSkillFreeText}
            className={cn(CONNECT_BTN_PRIMARY, "w-full sm:w-auto")}
          >
            Continuer
          </button>
          {results.length > 0 && query.trim().length >= 2 ? (
            <div className="space-y-2 border-t border-white/[0.06] pt-6">
              <p className="text-[12px] text-white/40">Suggestions du référentiel</p>
              <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06]">
                {results.slice(0, 6).map((entry) => (
                  <li key={`${entry.category}-${entry.name}`}>
                    <button
                      type="button"
                      onClick={() => pickSkill(entry)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="text-[14px] text-white/85">{entry.name}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {step === 3 && selected && (
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

      {step === 4 && selected && (
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
              Byound Learn.
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
