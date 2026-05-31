"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { COURSE_LEVEL_BUILDER_OPTIONS } from "@/lib/course-level-options";
import { COURSE_TOOL_OPTIONS, normalizeCourseTools } from "@/lib/course-tools";
import {
  getEdgeLabThematicBuilderOptions,
  isExactEdgeLabLabel,
  resolveThematicSelectValue,
  shouldUseEdgeLabThematicList,
  tryMatchEdgeLabCategoryName,
} from "@/lib/edge-lab-course-categories";
import {
  getPlaymakersThematicBuilderOptions,
  isExactPlaymakersLabel,
  shouldUsePlaymakersThematicList,
  tryMatchPlaymakersCategoryName,
} from "@/lib/playmakers-course-categories";

function CourseMetadataFormContent() {
  const searchParams = useSearchParams();
  const general = useCourseBuilder((state) => state.snapshot.general);
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; slug?: string }>>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(general.assigned_organization_id ?? "");
  const [thematics, setThematics] = useState<Array<{ id: string; name: string }> | null>(null);
  const [thematicSourceSlug, setThematicSourceSlug] = useState<string | null>(null);
  
  // Initialiser le titre depuis les query params si disponible
  useEffect(() => {
    const titleParam = searchParams.get("title");
    if (titleParam && !general.title) {
      updateGeneral({ title: decodeURIComponent(titleParam) });
    }
  }, [searchParams, general.title, updateGeneral]);

  useEffect(() => {
    // garder en sync si le snapshot est hydraté depuis ailleurs
    setSelectedOrgId(general.assigned_organization_id ?? "");
  }, [general.assigned_organization_id]);

  useEffect(() => {
    let cancelled = false;
    // Dès qu'on change de galaxie, on vide et on recharge les thématiques.
    setThematics(null);
    setThematicSourceSlug(null);
    const orgId = String(selectedOrgId ?? "").trim();
    if (!orgId) {
      setThematics([]);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const res = await fetch(`/api/course-categories?orgId=${encodeURIComponent(orgId)}`, {
          credentials: "include",
        });
        const json = (await res.json().catch(() => ({}))) as {
          categories?: unknown;
          organizationSlug?: string | null;
        };
        const list = Array.isArray(json?.categories) ? json.categories : [];
        const fromApi = String(json.organizationSlug ?? "").trim();
        const fromOrgList = String(organizations.find((o) => o.id === orgId)?.slug ?? "").trim();
        const orgSlug = (fromApi || fromOrgList) || null;
        const useEdge = shouldUseEdgeLabThematicList(orgSlug);
        const usePlaymakers = shouldUsePlaymakersThematicList(orgSlug);
        const cleaned: Array<{ id: string; name: string }> = list
          .map((x: unknown) => {
            if (x && typeof x === "object" && "id" in (x as object) && "name" in (x as object)) {
              const o = x as { id: unknown; name: unknown };
              return { id: String(o.id ?? "").trim(), name: String(o.name ?? "").trim() };
            }
            if (typeof x === "string" && x.trim()) {
              return { id: "", name: x.trim() };
            }
            return null;
          })
          .filter((x): x is { id: string; name: string } => Boolean(x?.name));
        const next = useEdge
          ? getEdgeLabThematicBuilderOptions()
          : usePlaymakers
            ? getPlaymakersThematicBuilderOptions()
            : cleaned;
        if (cancelled) return;
        setThematics(next);
        setThematicSourceSlug(orgSlug);
        if (!useEdge && !usePlaymakers) {
          const currentId = String(general.category_id ?? "").trim();
          if (currentId && !cleaned.some((c) => c.id === currentId)) {
            updateGeneral({ category_id: null, category: "" });
          }
        }
      } catch {
        if (!cancelled) {
          setThematics([]);
          setThematicSourceSlug(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrgId, updateGeneral, organizations]);

  // EDGE Lab : normaliser l’ancienne casse / libellés → libellés canoniques + id de sélecteur
  useEffect(() => {
    if (!thematics?.length) return;
    if (!thematicSourceSlug || !shouldUseEdgeLabThematicList(thematicSourceSlug)) return;
    const raw = String(general.category ?? "").trim();
    if (raw) {
      const canon = tryMatchEdgeLabCategoryName(raw) ?? (isExactEdgeLabLabel(raw) ? raw : null);
      if (!canon) {
        updateGeneral({ category_id: null, category: "" });
        return;
      }
      const opt = getEdgeLabThematicBuilderOptions().find((c) => c.name === canon);
      if (opt && (String(general.category) !== canon || String(general.category_id ?? "") !== opt.id)) {
        updateGeneral({ category: canon, category_id: opt.id });
      }
    }
  }, [thematics, thematicSourceSlug, general.category, general.category_id, updateGeneral]);

  // Playmakers : mêmes règles (thématiques « sport » + libellés historiques)
  useEffect(() => {
    if (!thematics?.length) return;
    if (!thematicSourceSlug || !shouldUsePlaymakersThematicList(thematicSourceSlug)) return;
    const raw = String(general.category ?? "").trim();
    if (raw) {
      const canon = tryMatchPlaymakersCategoryName(raw) ?? (isExactPlaymakersLabel(raw) ? raw : null);
      if (!canon) {
        updateGeneral({ category_id: null, category: "" });
        return;
      }
      const opt = getPlaymakersThematicBuilderOptions().find((c) => c.name === canon);
      if (opt && (String(general.category) !== canon || String(general.category_id ?? "") !== opt.id)) {
        updateGeneral({ category: canon, category_id: opt.id });
      }
    }
  }, [thematics, thematicSourceSlug, general.category, general.category_id, updateGeneral]);

  // Cours existants : nom de thématique sans category_id → résoudre l’UUID (hors listes figées EDGE / Playmakers)
  useEffect(() => {
    if (!thematics?.length) return;
    if (
      thematicSourceSlug &&
      (shouldUseEdgeLabThematicList(thematicSourceSlug) ||
        shouldUsePlaymakersThematicList(thematicSourceSlug))
    ) {
      return;
    }
    const id = String(general.category_id ?? "").trim();
    const name = String(general.category ?? "").trim();
    if (id) return;
    if (!name) return;
    const found = thematics.find((c) => c.id && c.name === name);
    if (found) updateGeneral({ category_id: found.id });
  }, [thematics, general.category, general.category_id, thematicSourceSlug, updateGeneral]);

  useEffect(() => {
    if (organizations.length || loadingOrgs) return;
    setLoadingOrgs(true);
    fetch("/api/formateur/organizations", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          console.warn("[course-metadata] /api/formateur/organizations HTTP", r.status);
          return { organizations: [] as Array<{ id: string; name: string; slug?: string }> };
        }
        return (await r.json()) as { organizations?: unknown };
      })
      .then((data) => {
        const list = Array.isArray(data?.organizations) ? data.organizations : [];
        setOrganizations(list as Array<{ id: string; name: string; slug?: string }>);
      })
      .catch(() => {
        setOrganizations([]);
      })
      .finally(() => {
        setLoadingOrgs(false);
      });
  }, [organizations.length, loadingOrgs]);
  const objectives = useCourseBuilder((state) => state.snapshot.objectives);
  const skills = useCourseBuilder((state) => state.snapshot.skills);
  const addObjective = useCourseBuilder((state) => state.addObjective);
  const removeObjective = useCourseBuilder((state) => state.removeObjective);
  const addSkill = useCourseBuilder((state) => state.addSkill);
  const removeSkill = useCourseBuilder((state) => state.removeSkill);

  const [objectiveDraft, setObjectiveDraft] = useState("");
  const [skillDraft, setSkillDraft] = useState("");

  const selectedTools = useMemo(() => normalizeCourseTools(general.tools), [general.tools]);
  const toolsSummary = selectedTools.length
    ? `${selectedTools.length} outil${selectedTools.length > 1 ? "s" : ""}`
    : "—";

  const handleObjectiveSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!objectiveDraft.trim()) return;
    addObjective(objectiveDraft.trim());
    setObjectiveDraft("");
  };

  const handleSkillSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!skillDraft.trim()) return;
    addSkill(skillDraft.trim());
    setSkillDraft("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-[30px] font-semibold leading-tight">Informations principales</CardTitle>
          <p className="text-sm text-white/60">
            Ces informations alimentent la page de présentation apprenant. Soignez le titre, le sous-titre et les visuels.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-2">
            <label className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                Assigner à une Galaxie
              </span>
              <select
                className="w-full rounded-xl border border-white/15 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                value={selectedOrgId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedOrgId(next);
                  updateGeneral({ assigned_organization_id: next || undefined });
                }}
              >
                <option value="">—</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {loadingOrgs ? <span className="text-xs text-white/40">Chargement des galaxies…</span> : null}
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm sm:col-span-2">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">
                  Visibilité
                </div>
                <div className="text-white/85">Visible uniquement dans un parcours</div>
                <div className="text-xs text-white/50">
                  La formation n&apos;apparaîtra pas dans le catalogue global apprenant. Elle restera accessible via les parcours qui l&apos;incluent.
                </div>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 accent-white"
                checked={Boolean((general as any)?.parcours_only)}
                onChange={(e) => updateGeneral({ parcours_only: e.target.checked })}
                aria-label="Visible uniquement dans un parcours"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Thématique</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                value={resolveThematicSelectValue(
                  general.category_id,
                  general.category,
                  thematics ?? [],
                )}
                onChange={(e) => {
                  const v = e.target.value;
                  const t = (thematics ?? []).find((c) => c.id === v);
                  updateGeneral({
                    category_id: v || null,
                    category: t?.name ?? "",
                  });
                }}
              >
                <option value="">
                  {selectedOrgId
                    ? thematics === null
                      ? "Chargement…"
                      : "—"
                    : "Choisissez une galaxie"}
                </option>
                {(thematics ?? [])
                  .filter((c) => c.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Niveau</span>
              <select
                className="w-full rounded-xl border border-white/15 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                value={general.level ?? ""}
                onChange={(e) => updateGeneral({ level: e.target.value })}
              >
                <option value="">—</option>
                {COURSE_LEVEL_BUILDER_OPTIONS.map((lvl) => (
                  <option key={lvl.value} value={lvl.value}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2 text-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/40">Les outils</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/15 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-white/25"
                    aria-label="Choisir les outils utilisés"
                  >
                    <span className="truncate">{toolsSummary}</span>
                    <span className="text-slate-500">▾</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  <DropdownMenuLabel>Sélectionner les outils</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COURSE_TOOL_OPTIONS.map((tool) => (
                    <DropdownMenuCheckboxItem
                      key={tool}
                      checked={selectedTools.includes(tool)}
                      onCheckedChange={(checked) => {
                        const next = new Set(selectedTools);
                        if (checked) next.add(tool);
                        else next.delete(tool);
                        updateGeneral({ tools: Array.from(next) });
                      }}
                    >
                      {tool}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedTools.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTools.map((tool) => (
                    <Badge
                      key={tool}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/70"
                    >
                      {tool}
                      <button
                        type="button"
                        onClick={() => {
                          const next = selectedTools.filter((t) => t.toLowerCase() !== tool.toLowerCase());
                          updateGeneral({ tools: next });
                        }}
                        className="text-white/40 transition hover:text-white"
                        aria-label={`Retirer ${tool}`}
                      >
                        ✕
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <InputField
            label="Titre de la formation"
            placeholder="NeuroDesign intensif"
            value={general.title}
            onChange={(value) => updateGeneral({ title: value })}
          />
          <InputField
            label="Durée / rythme"
            placeholder="6 semaines, 12h, auto-rythmé…"
            value={general.duration}
            onChange={(value) => updateGeneral({ duration: value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Accroche / sous-titre"
              placeholder="Déclenchez l'engagement émotionnel et boostez la mémorisation"
              value={general.subtitle}
              onChange={(value) => updateGeneral({ subtitle: value })}
            />
          </div>
          <InputField
            label="Image hero (URL)"
            placeholder="https://images.unsplash.com/..."
            value={general.heroImage}
            onChange={(value) => updateGeneral({ heroImage: value })}
          />
          <InputField
            label="Vidéo trailer (URL)"
            placeholder="https://storage.googleapis.com/..."
            value={general.trailerUrl}
            onChange={(value) => updateGeneral({ trailerUrl: value })}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-[30px] font-semibold leading-tight">Objectifs pédagogiques</CardTitle>
          <p className="text-sm text-white/60">Les apprenants les retrouveront dans la page de présentation.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleObjectiveSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Input
                value={objectiveDraft}
                onChange={(event) => setObjectiveDraft(event.target.value)}
                placeholder="Écrire un objectif clair et actionnable"
                className="bg-white/5 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Ajouter
            </Button>
          </form>
          <div className="space-y-2">
            {objectives.length ? (
              objectives.map((objective) => (
                <ObjectiveChip key={objective} value={objective} onRemove={() => removeObjective(objective)} />
              ))
            ) : (
              <p className="text-sm text-white/50">Ajoutez au moins 3 objectifs pour guider vos apprenants.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-[30px] font-semibold leading-tight">Compétences développées</CardTitle>
          <p className="text-sm text-white/60">Utilisées pour les badges et la preview apprenant.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSkillSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Input
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                placeholder="Ex : Conception pédagogique"
                className="bg-white/5 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Ajouter
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {skills.length ? (
              skills.map((skill) => (
                <Badge
                  key={skill}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-white/40 transition hover:text-white">✕</button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-white/50">Ajoutez les compétences clés travaillées dans ce parcours.</p>
            )}
          </div>
          <div className="pt-4">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/dashboard/formateur/formations/new">Passer à la construction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="uppercase tracking-[0.3em] text-white/40">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-white/5 text-sm text-white placeholder:text-white/30"
      />
    </label>
  );
}

function TextareaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="uppercase tracking-[0.3em] text-white/40">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-none bg-white/5 text-sm text-white placeholder:text-white/30"
      />
    </label>
  );
}

function ObjectiveChip({ value, onRemove }: { value: string; onRemove: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm text-white/70">{value}</p>
      <button type="button" onClick={onRemove} className="text-sm text-white/40 transition hover:text-white">
        ✕
      </button>
    </div>
  );
}

export function CourseMetadataForm() {
  return (
    <Suspense fallback={null}>
      <CourseMetadataFormContent />
    </Suspense>
  );
}

