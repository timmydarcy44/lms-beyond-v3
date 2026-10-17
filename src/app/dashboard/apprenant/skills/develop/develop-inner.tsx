"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";

import { SkillLevelSelector } from "@/components/hard-skills/skill-level-selector";
import {
  SkillsEmptyHint,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  TRAINING_MODALITY_TYPES,
  encodeSkillParam,
  nextHardSkillLevel,
} from "@/lib/apprenant/edge-skills-center";
import { SKILLS_TRAINING_ENABLED } from "@/lib/apprenant/skills-training-flag";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { type HardSkillCatalogEntry } from "@/lib/hard-skills/hard-skills-portfolio";
import {
  publicCatalogCategories,
  searchPublicCatalog,
  type CatalogSkillEntry,
} from "@/lib/hard-skills/skill-catalog-policy";
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
  const [catalogCategory, setCatalogCategory] = useState<string | null>(null);
  const [catalogExtras, setCatalogExtras] = useState<CatalogSkillEntry[]>([]);
  const [catalogAliases, setCatalogAliases] = useState<Array<{ alias: string; canonical: string }>>([]);

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

  useEffect(() => {
    void fetch("/api/skills/catalog-extras")
      .then((res) => (res.ok ? res.json() : { entries: [] }))
      .then((data: { entries?: CatalogSkillEntry[]; aliases?: Array<{ alias: string; canonical: string }> }) => {
        setCatalogExtras(data.entries ?? []);
        setCatalogAliases(data.aliases ?? []);
      })
      .catch(() => {
        setCatalogExtras([]);
        setCatalogAliases([]);
      });
  }, []);

  const catalogCategories = useMemo(() => publicCatalogCategories(), []);
  const results = useMemo(() => {
    const aliasEntries: CatalogSkillEntry[] = catalogAliases.map((row) => ({
      name: row.canonical,
      category: "Autre",
      aliases: [row.alias],
    }));
    const found = searchPublicCatalog(query, [...catalogExtras, ...aliasEntries]);
    const unique = new Map<string, CatalogSkillEntry>();
    for (const entry of found) {
      const prev = unique.get(entry.name);
      if (!prev) unique.set(entry.name, { ...entry, aliases: [...entry.aliases] });
      else prev.aliases = [...new Set([...prev.aliases, ...entry.aliases])];
    }
    const list = [...unique.values()];
    const scoped = catalogCategory ? list.filter((entry) => entry.category === catalogCategory) : list;
    if (!query.trim() && !catalogCategory) return [];
    return scoped;
  }, [query, catalogCategory, catalogExtras, catalogAliases]);

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

  const confirmHardSkillFreeText = async () => {
    const name = query.trim();
    if (name.length < 2) {
      setError("Indiquez le nom de la compétence.");
      return;
    }
    setError(null);
    void fetch("/api/learner/skill-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: name }),
    }).catch(() => undefined);
    pickSkill({ name, category: "Hors catalogue" });
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
        <SkillsSectionKicker>Déclarer</SkillsSectionKicker>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          {step === 1 && "Que voulez-vous déclarer ?"}
          {step === 2 && family === "soft" && "Choisissez un soft skill"}
          {step === 2 && family === "hard" && "Quelle compétence ?"}
          {step === 3 && "Votre auto-évaluation"}
          {step === 4 && "Compétence déclarée"}
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
            <p className="text-[13px] text-[#7BA7FF]/90">Soft skills</p>
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
            <p className="text-[13px] text-[#7BA7FF]/90">Compétences métier</p>
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
        <div className="mt-8 space-y-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un nom ou un ancien libellé…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {catalogCategories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCatalogCategory((current) => (current === item ? null : item))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12px]",
                  catalogCategory === item
                    ? "border-[#3D7BFF] bg-[#3D7BFF]/20 text-white"
                    : "border-white/10 text-white/60",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <ul className="max-h-[360px] divide-y divide-white/[0.05] overflow-y-auto rounded-2xl border border-white/[0.06]">
            {results.map((entry) => (
              <li key={`${entry.category}-${entry.name}`}>
                <button
                  type="button"
                  onClick={() => pickSkill(entry)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
                >
                  <span>
                    <span className="block text-[14px] text-white">{entry.name}</span>
                    <span className="block text-[12px] text-white/35">{entry.category}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="px-4 py-5 text-[13px] text-white/40">
                {query.trim() || catalogCategory
                  ? "Aucune compétence dans cette sélection."
                  : "Choisissez une catégorie ou lancez une recherche."}
              </li>
            )}
          </ul>
          {error ? <p className="text-[13px] text-rose-300">{error}</p> : null}
          <button type="button" onClick={() => void confirmHardSkillFreeText()} className={CONNECT_BTN_SECONDARY}>
            Ma compétence n&apos;est pas dans la liste
          </button>
        </div>
      )}

      {step === 3 && selected && (
        <div className="mt-8 space-y-8">
          <div className="space-y-1">
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-white">{selected.name}</p>
            {existing ? (
              <p className="text-[13px] text-white/40">Déjà dans votre capital · {existing.level}</p>
            ) : (
              <p className="text-[13px] text-white/40">Nouvelle compétence à déclarer</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-[13px] text-white/55">Auto-évaluation</p>
            <SkillLevelSelector
              value={currentLevel}
              onChange={(level) => {
                setLevelsTouched(true);
                setCurrentLevel(level);
              }}
            />
          </div>

          <div className="space-y-3">
            <p className="text-[13px] text-white/55">Objectif</p>
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
            {saving ? "Enregistrement…" : "Déclarer cette compétence"}
          </button>
        </div>
      )}

      {step === 4 && selected && (
        <div className="mt-8 space-y-8">
          <div className="space-y-2">
            <p className="text-[22px] font-semibold text-white">{selected.name}</p>
            <p className="text-[14px] text-white/70">
              Auto-évaluation : {currentLevel}
              {targetLevel ? ` · Objectif : ${targetLevel}` : ""}
            </p>
          </div>

          {SKILLS_TRAINING_ENABLED ? (
          <div className="space-y-3">
            <p className="text-[13px] text-white/55">Modalités d’entraînement</p>
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
          ) : null}

          <p className="text-[14px] leading-relaxed text-white/55">
            Vos preuves constituent votre portfolio. Certaines compétences peuvent aussi être certifiées par un Open Badge.
          </p>

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
              href={
                SKILLS_TRAINING_ENABLED
                  ? `/dashboard/apprenant/skills/entrainement?skill=${encodeSkillParam(selected.name)}`
                  : `/dashboard/apprenant/skills/prove?skill=${encodeSkillParam(selected.name)}`
              }
              className={CONNECT_BTN_PRIMARY}
            >
              {SKILLS_TRAINING_ENABLED ? "Commencer l’entraînement" : "Déposer une preuve"}
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
