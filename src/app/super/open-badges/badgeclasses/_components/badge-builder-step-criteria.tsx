"use client";

import { useState } from "react";
import { GripVertical, MoreHorizontal, Plus, Sparkles, X } from "lucide-react";
import type { BadgeBuilderState, ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";
import { slugify, suggestCompetency } from "@/lib/openbadges/badge-catalog";
import { criterionCoverage, methodDisplayName } from "@/lib/openbadges/criterion-coverage";
import { proposeButtonState, SHORT_PRESENTATION_MESSAGE } from "@/lib/openbadges/criterion-workshop";

export type BuilderCriterion = {
  id: string;
  label: string;
  description?: string | null;
  expectedOutcome?: string | null;
  competencyId?: string | null;
  sortOrder: number;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function BadgeBuilderStepCriteria({
  criteria,
  onCriteria,
  builder,
  onBuilder,
  name,
  description,
  level,
  library = [],
  variant = "full",
  hideCriteria = false,
  hideSkills = false,
  methods = [],
  links = {},
  onAutoCover,
  onKept,
  onReviewed,
  onToggleExam,
  onRemove,
  courseId,
}: {
  criteria: BuilderCriterion[];
  onCriteria: (next: BuilderCriterion[]) => void;
  builder: BadgeBuilderState;
  onBuilder: (patch: Partial<BadgeBuilderState>) => void;
  name: string;
  description: string;
  level: string;
  library?: ByoundCompetencyDraft[];
  variant?: "full" | "lines";
  hideCriteria?: boolean;
  hideSkills?: boolean;
  methods?: string[];
  links?: Record<string, string[]>;
  onAutoCover?: () => void;
  onKept?: (id: string) => void;
  onReviewed?: (id: string) => void;
  onToggleExam?: (criterionId: string, methodId: string) => void;
  onRemove?: (id: string) => void;
  courseId?: string | null;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [query, setQuery] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftDefinition, setDraftDefinition] = useState("");
  const [duplicate, setDuplicate] = useState<ByoundCompetencyDraft | null>(null);
  const [openCriterion, setOpenCriterion] = useState<string | null>(null);
  const [showCoverage, setShowCoverage] = useState(false);
  const [writing, setWriting] = useState(false);

  const update = (index: number, patch: Partial<BuilderCriterion>) => {
    onCriteria(criteria.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const suggest = async () => {
    setSuggesting(true);
    setSuggestError("");
    try {
      const response = await fetch("/api/super-admin/open-badges/suggest-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          level: level ? Number(level) : null,
          courseId: courseId || undefined,
          library: library.map((item) => item.name),
          lockedCompetencies: builder.competencies
            .filter((item) => item.status === "validated" || (builder.reviewedCompetencyIds ?? []).includes(item.id))
            .map((item) => ({ name: item.name, definition: item.definition })),
          kept: criteria
            .filter((item) => builder.reviewedCriterionIds.includes(item.id) && item.label.trim())
            .map((item) => ({
              label: item.label,
              expectedOutcome: item.expectedOutcome ?? "",
              source: (item.description ?? "").replace(/^Source :\s*/, ""),
            })),
        }),
      });
      const payload = await response.json();
      if (payload.short) {
        setSuggestError(payload.message ?? SHORT_PRESENTATION_MESSAGE);
        return;
      }
      if (!response.ok) {
        setSuggestError(payload.error ?? "Suggestion impossible");
        return;
      }
      const incomingSkills = (Array.isArray(payload.competencies) ? payload.competencies : []) as Array<{ name?: string; definition?: string }>;
      const protectedSkills = builder.competencies.filter((item) => item.status === "validated" || (builder.reviewedCompetencyIds ?? []).includes(item.id));
      const freshSkills = incomingSkills.flatMap((item) => {
        const skillName = String(item.name ?? "").trim();
        const definition = String(item.definition ?? "").trim();
        if (!skillName || !definition) return [];
        if (protectedSkills.some((skill) => skill.name.trim().toLowerCase() === skillName.toLowerCase())) return [];
        const existing = suggestCompetency(skillName, library);
        if (existing && protectedSkills.some((skill) => skill.id === existing.id)) return [];
        return [{
          id: existing?.id ?? crypto.randomUUID(),
          slug: existing?.slug ?? slugify(skillName),
          name: existing?.name ?? skillName,
          definition: existing?.definition || definition,
          domainId: existing?.domainId ?? builder.domainId,
          status: existing?.status === "validated" ? "validated" as const : "draft" as const,
          validatedBy: existing?.validatedBy ?? null,
          validatedAt: existing?.validatedAt ?? null,
          archivedAt: null,
        } satisfies ByoundCompetencyDraft];
      });
      const competencies = [...protectedSkills, ...freshSkills];
      const incoming = (Array.isArray(payload.criteria) ? payload.criteria : []) as Array<{
        label: string;
        description?: string;
        expectedOutcome: string;
        competencyName?: string;
      }>;
      const kept = criteria.filter((item) => builder.reviewedCriterionIds.includes(item.id) && item.label.trim());
      const cards = incoming.map((item, index) => {
        const skill = suggestCompetency(item.competencyName ?? "", competencies);
        return {
          id: crypto.randomUUID(),
          label: item.label,
          description: item.description ?? "",
          expectedOutcome: item.expectedOutcome,
          competencyId: skill?.id ?? null,
          sortOrder: kept.length + index,
        };
      });
      onCriteria([...kept, ...cards]);
      onBuilder({
        generated: true,
        ...(competencies.length ? { competencies, skills: competencies.map((item) => item.name) } : {}),
      });
    } catch {
      setSuggestError("Suggestion impossible");
    } finally {
      setSuggesting(false);
    }
  };

  const attach = (item: ByoundCompetencyDraft) => {
    if (builder.competencies.some((row) => row.id === item.id || row.slug === item.slug)) return;
    const competencies = [...builder.competencies, item];
    onBuilder({ competencies, skills: competencies.map((row) => row.name) });
  };

  const propose = () => {
    const nameValue = draftName.trim();
    const definition = draftDefinition.trim();
    if (!nameValue || !definition) return;
    const existing = suggestCompetency(nameValue, [...library, ...builder.competencies]);
    if (existing && !builder.competencies.some((row) => row.id === existing.id)) {
      setDuplicate(existing as ByoundCompetencyDraft);
      return;
    }
    if (existing && builder.competencies.some((row) => row.slug === existing.slug)) return;
    attach({
      id: existing?.id ?? crypto.randomUUID(),
      slug: existing?.slug ?? slugify(nameValue),
      name: existing?.name ?? nameValue,
      definition: existing?.definition || definition,
      domainId: existing?.domainId ?? builder.domainId,
      status: existing?.status ?? "draft",
      validatedBy: existing?.validatedBy ?? null,
      validatedAt: existing?.validatedAt ?? null,
      archivedAt: null,
    });
    setDraftName("");
    setDraftDefinition("");
    setDuplicate(null);
  };

  const writeDefinition = async () => {
    if (!draftName.trim()) return;
    setWriting(true);
    try {
      const response = await fetch("/api/super-admin/open-badges/suggest-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draftName, description, level: level ? Number(level) : null, mode: "definition" }),
      });
      const payload = await response.json();
      if (typeof payload.definition === "string") setDraftDefinition(payload.definition);
    } finally {
      setWriting(false);
    }
  };

  const hits = library.filter((item) => {
    const text = query.trim().toLowerCase();
    if (text.length < 2) return false;
    return `${item.name} ${item.definition}`.toLowerCase().includes(text);
  }).slice(0, 6);

  const indexedCriteria = criteria.map((criterion, index) => ({ criterion, index }));
  const criterionGroups = builder.competencies.length
    ? [
        ...builder.competencies.map((skill) => ({
          key: skill.id,
          title: skill.name,
          rows: indexedCriteria.filter((row) => row.criterion.competencyId === skill.id),
        })),
        {
          key: "loose",
          title: "Sans compétence",
          rows: indexedCriteria.filter((row) => !builder.competencies.some((skill) => skill.id === row.criterion.competencyId)),
        },
      ].filter((group) => group.rows.length > 0)
    : [{ key: "all", title: "", rows: indexedCriteria }];
  const proposal = proposeButtonState({
    name,
    description,
    courseId,
    keptCount: criteria.filter((item) => builder.reviewedCriterionIds.includes(item.id) && item.label.trim()).length,
  });
  const titled = criteria.filter((item) => item.label.trim());
  const coverage = criterionCoverage(titled, methods.map((id) => ({ id, criterionIds: links[id] ?? [] })));
  const missing = coverage.filter((row) => row.tone === "missing");

  return (
    <div className="space-y-5">
      {variant === "lines" && !hideCriteria ? (
        <section id="field-criteria" className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-lg font-semibold">Critères</h2>
          <p className="mt-1 text-sm text-[#8C94B2]">
            {courseId
              ? "La formation déduit les compétences. Les compétences rédigent ces critères. Tu peux les modifier."
              : "Le titre est publié sur le badge. L'attendu reste pour l'expert."}
          </p>
          {proposal === "short" ? (
            <p className="mt-3 text-sm text-[#F2C15A]">{SHORT_PRESENTATION_MESSAGE}</p>
          ) : null}
          <div className="mt-4 space-y-5">
            {criterionGroups.map((group) => (
              <div key={group.key}>
                {group.title ? <h3 className="mb-2 text-sm font-semibold text-[#EEF0F7]">{group.title}</h3> : null}
                <div className="space-y-2">
            {group.rows.map(({ criterion, index }) => {
              const open = openCriterion === criterion.id;
              const exams = methods.filter((id) => (links[id] ?? []).includes(criterion.id));
              const kept = builder.reviewedCriterionIds.includes(criterion.id);
              const proposed = (criterion.description ?? "").startsWith("Source :");
              const needsReview = proposed && Boolean(criterion.label.trim()) && !kept;
              return (
                <div key={criterion.id} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-3 py-3">
                  <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => setOpenCriterion(open ? null : criterion.id)}>
                    <span className="text-sm text-[#B9B2FF]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{criterion.label || "Nouveau critère"}</span>
                      <span className="mt-1 block text-sm text-[#8C94B2]">{criterion.expectedOutcome || "Attendu à rédiger"}</span>
                      {criterion.description ? <span className="mt-1 block text-xs text-[#B9B2FF]">{criterion.description}</span> : null}
                    </span>
                    <span className="flex flex-wrap justify-end gap-1">
                      {exams.map((id) => <span key={id} className="rounded-full border border-[#26304F] px-2 py-0.5 text-xs">{methodDisplayName(id)}</span>)}
                      {needsReview ? <span className="text-xs text-[#F2C15A]">✦ À relire</span> : null}
                    </span>
                  </button>
                  {needsReview ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="rounded-full bg-[#6E5BFF] px-3 py-1 text-xs text-white" onClick={() => (onKept ?? onReviewed)?.(criterion.id)}>Garder</button>
                      <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-xs" onClick={() => setOpenCriterion(criterion.id)}>Modifier</button>
                      <button type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-xs text-[#F2C15A]" onClick={() => onRemove ? onRemove(criterion.id) : onCriteria(criteria.filter((item) => item.id !== criterion.id))}>Retirer</button>
                    </div>
                  ) : null}
                  {open ? (
                    <div className="mt-3 space-y-2">
                      <input value={criterion.label} onChange={(event) => { update(index, { label: event.target.value }); if (proposed) (onKept ?? onReviewed)?.(criterion.id); }} className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" placeholder="Titre publié sur le badge" />
                      <textarea value={criterion.expectedOutcome ?? ""} onChange={(event) => { update(index, { expectedOutcome: event.target.value }); if (proposed) (onKept ?? onReviewed)?.(criterion.id); }} rows={2} className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" placeholder="Seuil pour l'expert, non publié" />
                      <div className="flex flex-wrap gap-2">
                        {methods.map((id) => {
                          const on = (links[id] ?? []).includes(criterion.id);
                          return <button key={id} type="button" onClick={() => onToggleExam?.(criterion.id, id)} className={`rounded-full px-3 py-1 text-xs ${on ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{methodDisplayName(id)}</button>;
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {proposal === "propose" || proposal === "more" ? (
              <button type="button" disabled={suggesting} onClick={() => void suggest()} className="text-sm text-[#B9B2FF] disabled:opacity-50">
                {suggesting ? "Proposition…" : proposal === "more" ? "✦ Proposer d'autres critères" : "✦ Proposer les critères"}
              </button>
            ) : null}
            <button type="button" className="text-sm text-[#A9B0CC]" onClick={() => onCriteria([...criteria, { id: crypto.randomUUID(), label: "", description: "", expectedOutcome: "", sortOrder: criteria.length }])}>+ Ajouter</button>
          </div>
          {suggestError ? <p className="mt-2 text-sm text-[#F2C15A]">{suggestError}</p> : null}
          {missing.length === 0 ? (
            <p className="mt-4 text-sm text-[#3DDCAB]">✓ Tous les critères sont évalués par au moins une épreuve.</p>
          ) : (
            <div className="mt-4 text-sm text-[#F07178]">
              <p>{missing.length} critère{missing.length > 1 ? "s" : ""} non évalué{missing.length > 1 ? "s" : ""}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button type="button" className="bb-white rounded-full px-4 py-2 font-semibold" onClick={onAutoCover}>Corriger automatiquement</button>
                <button type="button" className="text-[#B9B2FF]" onClick={() => setShowCoverage((open) => !open)}>Voir le détail</button>
              </div>
              {showCoverage ? <ul className="mt-2 space-y-1 text-[#A9B0CC]">{coverage.map((row) => <li key={row.id}>{titled.find((item) => item.id === row.id)?.label} · {row.tone === "missing" ? "non évalué" : row.methodIds.map(methodDisplayName).join(", ")}</li>)}</ul> : null}
            </div>
          )}
        </section>
      ) : null}
      {variant === "full" && !hideCriteria ? (
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Critères d&apos;évaluation</h2>
            <p className="text-sm text-[#8C94B2]">Ce que l&apos;expert regarde pour valider la compétence.</p>
          </div>
          <button
            type="button"
            onClick={() => void suggest()}
            disabled={suggesting || !name.trim()}
            className="inline-flex items-center gap-2 rounded-full border border-[#6E5BFF]/40 px-4 py-2 text-sm text-[#B9B2FF] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {suggesting ? "Suggestion…" : "Suggérer avec l'IA"}
          </button>
        </div>
        {suggestError ? <p className="mb-3 text-sm text-[#F2C15A]">{suggestError}</p> : null}
        <div className="space-y-3">
          {criteria.map((criterion, index) => (
            <article
              key={criterion.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex == null) return;
                onCriteria(moveItem(criteria, dragIndex, index));
                setDragIndex(null);
              }}
              className="rounded-3xl border border-[#1A2340] bg-[#0B1122] p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  aria-label="Déplacer le critère"
                  className="cursor-grab text-[#5F688A]"
                  onDragStart={() => setDragIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      onCriteria(moveItem(criteria, index, index - 1));
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      onCriteria(moveItem(criteria, index, index + 1));
                    }
                  }}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-[#B9B2FF]">{String(index + 1).padStart(2, "0")}</span>
                <div className="relative ml-auto">
                  <button
                    type="button"
                    aria-label="Actions du critère"
                    onClick={() => setMenuIndex(menuIndex === index ? null : index)}
                    className="rounded-full p-1 text-[#8C94B2]"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuIndex === index ? (
                    <div className="absolute right-0 z-10 mt-1 w-36 rounded-2xl border border-[#26304F] bg-[#111831] p-1 text-sm">
                      <button
                        type="button"
                        className="block w-full rounded-xl px-3 py-2 text-left"
                        onClick={() => {
                          const copy = { ...criterion, id: crypto.randomUUID() };
                          const next = [...criteria];
                          next.splice(index + 1, 0, copy);
                          onCriteria(next);
                          setMenuIndex(null);
                        }}
                      >
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        className="block w-full rounded-xl px-3 py-2 text-left text-[#F2C15A]"
                        onClick={() => {
                          onCriteria(criteria.filter((item) => item.id !== criterion.id));
                          setMenuIndex(null);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <input
                value={criterion.label}
                onChange={(event) => update(index, { label: event.target.value })}
                placeholder="Titre du critère"
                className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm"
              />
              <textarea
                value={criterion.description ?? ""}
                onChange={(event) => update(index, { description: event.target.value })}
                placeholder="Précision, facultative"
                rows={2}
                className="mt-2 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm"
              />
              <label className="mt-3 block rounded-2xl border border-[#3DDCAB]/40 bg-[#10241C] p-3">
                <span className="text-xs font-medium text-[#3DDCAB]">Attendu pour valider</span>
                <textarea
                  value={criterion.expectedOutcome ?? ""}
                  onChange={(event) => update(index, { expectedOutcome: event.target.value })}
                  placeholder="Ce que l'expert doit constater"
                  rows={2}
                  className="mt-2 w-full bg-transparent text-sm outline-none"
                />
              </label>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            onCriteria([
              ...criteria,
              { id: crypto.randomUUID(), label: "", description: "", expectedOutcome: "", sortOrder: criteria.length },
            ])
          }
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#26304F] px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Ajouter un critère
        </button>
      </section>
      ) : null}

      {!hideSkills ? (
      <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-lg font-semibold">Compétences visées</h2>
        <p className="mb-3 text-sm text-[#8C94B2]">Compétences Byound, rédigées et validées par nos experts.</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {builder.competencies.map((skill) => (
            <span key={skill.id} className="inline-flex items-center gap-2 rounded-full border border-[#26304F] px-3 py-1 text-sm">
              {skill.name}
              <span className="text-xs text-[#8C94B2]">{skill.status === "validated" ? "validée" : (builder.reviewedCompetencyIds ?? []).includes(skill.id) ? "gardée" : "✦ À relire"}</span>
              {skill.status !== "validated" && !(builder.reviewedCompetencyIds ?? []).includes(skill.id) ? (
                <button type="button" className="text-xs text-[#B9B2FF]" onClick={() => onBuilder({ reviewedCompetencyIds: [...(builder.reviewedCompetencyIds ?? []), skill.id] })}>Garder</button>
              ) : null}
              <button type="button" aria-label={`Retirer ${skill.name}`} onClick={() => {
                const competencies = builder.competencies.filter((item) => item.id !== skill.id);
                onBuilder({ competencies, skills: competencies.map((item) => item.name) });
              }}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher dans la bibliothèque" className="mb-3 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
        {hits.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button type="button" onClick={() => attach(hit)} className="w-full rounded-2xl border border-[#1A2340] px-3 py-2 text-left text-sm">
                  <span className="font-medium">{hit.name}</span>
                  <span className="mt-1 block text-xs text-[#8C94B2]">{hit.definition}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="mb-2 text-sm text-[#A9B0CC]">+ Proposer une nouvelle compétence</p>
        <input value={draftName} onChange={(event) => { setDraftName(event.target.value); setDuplicate(null); }} placeholder="Nom" className="mb-2 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
        <textarea value={draftDefinition} onChange={(event) => setDraftDefinition(event.target.value)} rows={3} placeholder="Définition, deux ou trois phrases" className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm" />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={writing || !draftName.trim()} onClick={() => void writeDefinition()} className="text-sm text-[#B9B2FF] disabled:opacity-50">✦ Rédiger avec l&apos;IA</button>
          <button type="button" onClick={propose} className="rounded-full border border-[#26304F] px-4 py-2 text-sm">Ajouter en brouillon</button>
        </div>
        {duplicate ? (
          <p className="mt-3 text-sm text-[#F2C15A]">
            « {duplicate.name} » existe déjà, voulez-vous la réutiliser ?
            <button type="button" className="ml-2 text-[#B9B2FF]" onClick={() => { attach(duplicate); setDuplicate(null); setDraftName(""); setDraftDefinition(""); }}>Réutiliser</button>
          </p>
        ) : null}
      </section>
      ) : null}
    </div>
  );
}
