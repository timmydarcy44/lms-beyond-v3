"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Download,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildZipStoreBlob } from "@/lib/zip-store";
import {
  CATALOGUE_PROOF_FIELDS,
  QUALIOPI_FINANCING_OPTIONS,
  QUALIOPI_MODALITY_DETAIL_OPTIONS,
  QUALIOPI_PEDAGOGICAL_MODALITIES,
  QUALIOPI_RECOGNITION_TYPES,
  modalityDetailOptionId,
  sentenceCaseTitle,
  type CatalogueProofFieldId,
} from "@/lib/training-courses/qualiopi-fiche";

type CourseProof = {
  id: string;
  title: string;
  domain: string | null;
  objectives: string[];
  objectivesOk: boolean;
  compliant: boolean;
  missing: string[];
  missingIds: CatalogueProofFieldId[];
  filledIds: CatalogueProofFieldId[];
  onePager: string;
  source: string;
};

type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  headline?: string | null;
  specialties?: unknown;
  photo_url?: string | null;
};

type DupGroup = {
  key: string;
  kind: "email" | "name";
  count: number;
  label: string;
  ids: string[];
};

type Summary = {
  coursesTotal: number;
  publishedCount: number;
  excludedDrafts: number;
  withObjectives: number;
  compliantCount: number;
  approvedExperts: number;
  expertsOk: boolean;
  hiddenExpertsCount: number;
  accessibilityOk: boolean;
  handicapConfigured: boolean;
  fieldMissingCounts: Record<string, number>;
  fieldFilledCounts: Record<string, number>;
  fieldLabels: Record<string, string>;
};

const PAGE_SIZE = 20;

function specialtyLabel(e: ExpertRow): string {
  if (e.headline) return e.headline;
  if (Array.isArray(e.specialties) && e.specialties[0]) return String(e.specialties[0]);
  return "Expert";
}

function barColor(filled: number, total: number): string {
  if (total <= 0) return "#26304F";
  if (filled >= total) return "#6BE39B";
  if (filled <= 0) return "#FF8A9B";
  return "#F2CF6B";
}

export function QualiopiCataloguePanel() {
  const [courses, setCourses] = useState<CourseProof[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [duplicates, setDuplicates] = useState<DupGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todo" | "ok">("todo");
  const [domain, setDomain] = useState<string>("all");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [bulkField, setBulkField] = useState<CatalogueProofFieldId | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/catalog-proofs", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Catalogue");
      setCourses(json.courses ?? []);
      setSummary(json.summary);
      setExperts(json.experts ?? []);
      setDuplicates(json.expertDuplicates ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const domains = useMemo(() => {
    const set = new Set(
      courses.map((c) => c.domain).filter((d): d is string => Boolean(d)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [courses]);

  const todoCount = courses.filter((c) => !c.compliant).length;
  const okCount = courses.filter((c) => c.compliant).length;
  const published = summary?.publishedCount ?? courses.length;
  const compliant = summary?.compliantCount ?? okCount;
  const excluded = summary?.excludedDrafts ?? 0;

  const filtered = useMemo(() => {
    let list = courses.filter((c) => (filter === "todo" ? !c.compliant : c.compliant));
    if (domain !== "all") list = list.filter((c) => c.domain === domain);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          (c.domain ?? "").toLowerCase().includes(needle),
      );
    }
    return [...list].sort((a, b) => {
      const dm = b.missingIds.length - a.missingIds.length;
      if (dm !== 0) return dm;
      return a.title.localeCompare(b.title, "fr");
    });
  }, [courses, filter, domain, q]);

  const shown = filtered.slice(0, visible);

  const firstIncompleteField = useMemo(() => {
    if (!summary) return null;
    for (const f of CATALOGUE_PROOF_FIELDS) {
      const missing = summary.fieldMissingCounts?.[f.id] ?? 0;
      if (missing > 0 && f.id !== "accessibility" && f.id !== "tariff") return f.id;
    }
    return CATALOGUE_PROOF_FIELDS[0]?.id ?? null;
  }, [summary]);

  const showSameFieldsHint = useMemo(() => {
    if (!summary || published <= 0) return false;
    return CATALOGUE_PROOF_FIELDS.some((f) => {
      const missing = summary.fieldMissingCounts?.[f.id] ?? 0;
      return missing / published > 0.75;
    });
  }, [summary, published]);

  const downloadOne = (course: CourseProof) => {
    if (!course.compliant) {
      toast.message("Disponible quand la fiche est complète");
      return;
    }
    const blob = new Blob([course.onePager], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `one-pager-${course.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = () => {
    const complete = courses.filter((c) => c.compliant);
    if (!complete.length) {
      toast.message("Aucune fiche complète pour l’instant");
      return;
    }
    const blob = buildZipStoreBlob(
      complete.map((c) => ({
        name: `${c.id.slice(0, 8)}-${c.title.slice(0, 40).replace(/[^\w\-]+/g, "_")}.md`,
        content: c.onePager,
      })),
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qualiopi-one-pagers-${complete.length}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openBulk = (fieldId?: CatalogueProofFieldId | null) => {
    const id = fieldId ?? firstIncompleteField;
    if (!id) {
      toast.message("Tous les champs sont complets");
      return;
    }
    setBulkField(id);
    setBulkOpen(true);
  };

  const topDup = duplicates[0] ?? null;

  return (
    <div className="space-y-6 font-[Manrope,system-ui,sans-serif] text-[#F2F4FA]">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/super/crm/qualiopi"
            className="text-[13px] text-[#9AA3BD] transition hover:text-[#C9C2FF]"
          >
            ‹ Qualiopi / Indicateurs 1 et 2
          </Link>
          <h1 className="mt-2 text-[34px] font-extrabold leading-tight tracking-tight text-[#F2F4FA]">
            Preuves catalogue
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-[#9AA3BD]">
            Ce que l&apos;auditeur vérifie sur chaque fiche formation publique
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadZip}
            className="rounded-full border border-[#26304F] bg-transparent px-4 py-2 text-[13px] font-semibold text-[#F2F4FA] transition hover:border-[#6E5BFF]/50"
          >
            ⤓ Tous les one-pagers (ZIP)
          </button>
          <button
            type="button"
            onClick={() => openBulk(null)}
            className="rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-[#0A0F1E] transition hover:bg-[#C9C2FF]"
          >
            Compléter en série
          </button>
        </div>
      </div>

      {loading || !summary ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-[24px] bg-[#111831]" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-96 animate-pulse rounded-[24px] bg-[#111831]" />
            <div className="h-96 animate-pulse rounded-[24px] bg-[#111831]" />
          </div>
        </div>
      ) : (
        <>
          {/* Carte fiches complètes */}
          <section
            className="rounded-[24px] border border-[#3A2E3A] p-6 sm:px-7"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, #4A2A20 0%, #1E1A2E 45%, #111831 100%)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-semibold text-[#F2CF6B]">Fiches complètes</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-[44px] font-extrabold leading-none text-[#F2F4FA]">
                    {compliant}
                  </span>
                  <span className="text-[24px] font-semibold text-[#6C7593]">
                    / {published} fiches publiées
                  </span>
                </p>
                <p className="mt-2 text-[13px] text-[#9AA3BD]">
                  {excluded} brouillons et formations archivées ne sont pas comptés
                </p>
              </div>
              {showSameFieldsHint ? (
                <div className="flex max-w-sm gap-3 rounded-2xl border border-[#F2CF6B]/25 bg-[#F2CF6B]/10 px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2CF6B] text-[13px] font-extrabold text-[#0A0F1E]">
                    !
                  </span>
                  <div className="text-[13px] leading-snug text-[#F2F4FA]">
                    <p className="font-semibold">
                      Ce sont presque toujours les mêmes champs qui manquent
                    </p>
                    <p className="mt-1 text-[#9AA3BD]">
                      Les compléter en série règle presque tout. Vérifiez d&apos;abord qu&apos;ils
                      ne sont pas déjà saisis ailleurs dans la fiche.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <ul className="mt-6 space-y-3">
              {CATALOGUE_PROOF_FIELDS.map((f) => {
                const filled = summary.fieldFilledCounts?.[f.id] ?? 0;
                const color = barColor(filled, published);
                const complete = published > 0 && filled >= published;
                return (
                  <li
                    key={f.id}
                    className="grid items-center gap-3"
                    style={{
                      gridTemplateColumns: "minmax(140px,220px) 1fr 70px 150px",
                    }}
                  >
                    <span className="truncate text-[13px] text-[#F2F4FA]">{f.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[#0B1122]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${published ? Math.round((filled / published) * 100) : 0}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="text-right text-[12px] tabular-nums text-[#9AA3BD]">
                      {filled} / {published}
                    </span>
                    {complete ? (
                      <span className="justify-self-end text-[12px] font-semibold text-[#6BE39B]">
                        ✓ Complet
                      </span>
                    ) : f.id === "accessibility" ? (
                      <Link
                        href="/super/parametres"
                        className="justify-self-end text-[12px] font-semibold text-[#A99BFF] hover:underline"
                      >
                        Configurer ›
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBulk(f.id)}
                        className="justify-self-end rounded-full px-3 py-1 text-[12px] font-extrabold text-[#0A0F1E]"
                        style={{ background: color }}
                      >
                        Compléter en série
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Grille bas */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Liste fiches */}
            <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
              <div className="flex flex-wrap items-center gap-2 gap-y-3">
                <h2 className="mr-auto text-[16px] font-extrabold text-[#F2F4FA]">
                  Fiches formation
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("todo");
                    setVisible(PAGE_SIZE);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold",
                    filter === "todo"
                      ? "bg-[#6E5BFF]/25 text-[#C9C2FF]"
                      : "text-[#9AA3BD] hover:text-[#F2F4FA]",
                  )}
                >
                  À compléter ({todoCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("ok");
                    setVisible(PAGE_SIZE);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold",
                    filter === "ok"
                      ? "bg-[#6BE39B]/20 text-[#6BE39B]"
                      : "text-[#9AA3BD] hover:text-[#F2F4FA]",
                  )}
                >
                  Complètes ({okCount})
                </button>
                <select
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  className="rounded-full border border-[#26304F] bg-[#0B1122] px-3 py-1 text-[12px] text-[#F2F4FA]"
                >
                  <option value="all">Thématique ▾</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <label className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6C7593]" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setVisible(PAGE_SIZE);
                    }}
                    placeholder="Rechercher"
                    className="w-[150px] rounded-full border border-[#26304F] bg-[#0B1122] py-1.5 pl-8 pr-3 text-[12px] text-[#F2F4FA] placeholder:text-[#6C7593]"
                  />
                </label>
              </div>

              <div className="mt-4 hidden text-[11px] text-[#6C7593] md:grid md:grid-cols-[minmax(0,1.7fr)_110px_minmax(0,1.3fr)_130px] md:gap-3 md:px-1">
                <span>Formation</span>
                <span>Complétude</span>
                <span>Ce qui manque</span>
                <span className="text-right">Actions</span>
              </div>

              <ul className="mt-2 space-y-2">
                {shown.map((course) => {
                  const firstMissing = course.missingIds[0];
                  const extra = Math.max(0, course.missingIds.length - 1);
                  const filled = course.filledIds.length;
                  return (
                    <li
                      key={course.id}
                      className="grid items-center gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122]/60 px-3 py-3 md:grid-cols-[minmax(0,1.7fr)_110px_minmax(0,1.3fr)_130px]"
                    >
                      <div className="min-w-0">
                        <p
                          className="truncate text-[14px] font-extrabold text-[#F2F4FA]"
                          title={course.title}
                        >
                          {sentenceCaseTitle(course.title)}
                        </p>
                        <p className="truncate text-[12px] text-[#6C7593]">
                          {course.domain || "Sans thématique"}
                        </p>
                      </div>
                      <div>
                        <div className="flex gap-1">
                          {CATALOGUE_PROOF_FIELDS.map((f) => (
                            <span
                              key={f.id}
                              title={f.label}
                              className="h-3 w-3 rounded-[3px]"
                              style={{
                                background: course.filledIds.includes(f.id)
                                  ? "#6BE39B"
                                  : "#26304F",
                              }}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] text-[#6C7593]">
                          {filled} / 8 champs
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {firstMissing ? (
                          <span className="rounded-full bg-[#F2CF6B]/15 px-2 py-0.5 text-[11px] font-semibold text-[#F2CF6B]">
                            {summary.fieldLabels?.[firstMissing] ?? firstMissing}
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#6BE39B]/15 px-2 py-0.5 text-[11px] font-semibold text-[#6BE39B]">
                            Complet
                          </span>
                        )}
                        {extra > 0 ? (
                          <span
                            className="rounded-full bg-[#26304F] px-2 py-0.5 text-[11px] text-[#9AA3BD]"
                            title={course.missing.join(" · ")}
                          >
                            +{extra}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/super/formations?edit=${course.id}${firstMissing ? `&field=${firstMissing}` : ""}`}
                          className="rounded-full bg-[#6E5BFF]/15 px-3 py-1.5 text-[12px] font-extrabold text-[#C9C2FF] transition hover:bg-[#6E5BFF]/25"
                        >
                          Compléter
                        </Link>
                        <button
                          type="button"
                          disabled={!course.compliant}
                          title={
                            course.compliant
                              ? "Télécharger le one-pager"
                              : "Disponible quand la fiche est complète"
                          }
                          onClick={() => downloadOne(course)}
                          className={cn(
                            "rounded-full border border-[#26304F] p-1.5",
                            course.compliant
                              ? "text-[#F2F4FA] hover:border-[#6E5BFF]"
                              : "cursor-not-allowed text-[#6C7593] opacity-50",
                          )}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
                {!shown.length ? (
                  <li className="py-10 text-center text-[13px] text-[#6C7593]">
                    Aucune fiche dans ce filtre
                  </li>
                ) : null}
              </ul>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#6C7593]">
                <span>
                  {shown.length} sur {filtered.length} · triées par nombre de champs manquants
                </span>
                {visible < filtered.length ? (
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="font-semibold text-[#A99BFF] hover:underline"
                  >
                    Afficher plus ›
                  </button>
                ) : null}
              </div>
            </section>

            {/* Colonne droite */}
            <aside className="space-y-4">
              <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-[16px] font-extrabold text-[#F2F4FA]">
                    Experts approuvés
                  </h2>
                  <span className="text-[20px] font-extrabold text-[#F2F4FA]">
                    {summary.approvedExperts}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#6C7593]">
                  Intervenants affichés sur les fiches
                </p>
                <ul className="mt-4 space-y-3">
                  {experts.slice(0, 4).map((e) => {
                    const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`
                      .trim()
                      .replace(/\b\w/g, (c) => c.toLocaleUpperCase("fr-FR"));
                    return (
                      <li key={e.id} className="flex items-center gap-3">
                        {e.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={e.photo_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6E5BFF]/25 text-[12px] font-bold text-[#C9C2FF]">
                            {(e.first_name?.[0] ?? "?").toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#F2F4FA]">
                            {name || "Expert"}
                          </p>
                          <p className="truncate text-[11px] text-[#6C7593]">
                            {specialtyLabel(e)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href="/super/experts?status=approved"
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-[#A99BFF] hover:underline"
                >
                  Voir les {summary.approvedExperts} experts <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <div className="mt-4 space-y-2 rounded-2xl bg-[#0B1122] p-3 text-[12px]">
                  {topDup ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#9AA3BD]">
                        {topDup.count} doublons de {topDup.label}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          toast.message(
                            "Fusion experts : pas encore d’outil dédié. Canonique proposé Timmy Darcy (timmydarcy44@gmail.com) — fusion non exécutée.",
                          )
                        }
                        className="rounded-full bg-[#6E5BFF]/20 px-2.5 py-1 font-semibold text-[#C9C2FF]"
                      >
                        Fusionner
                      </button>
                    </div>
                  ) : null}
                  <p className="text-[#6C7593]">
                    {summary.hiddenExpertsCount} comptes de test ou apprenants masqués
                  </p>
                </div>
              </section>

              <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[16px] font-extrabold text-[#F2F4FA]">Accessibilité</h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[12px] font-extrabold",
                      summary.accessibilityOk
                        ? "bg-[#6BE39B]/15 text-[#6BE39B]"
                        : "bg-[#F2CF6B]/15 text-[#F2CF6B]",
                    )}
                  >
                    ✓ {summary.accessibilityOk ? published : 0} / {published}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-[#9AA3BD]">
                  Le contact de la référente handicap figure sur toutes les fiches et tous les
                  one-pagers.
                </p>
                <Link
                  href="/super/parametres"
                  className="mt-3 inline-block text-[13px] font-semibold text-[#A99BFF] hover:underline"
                >
                  Modifier le contact ›
                </Link>
              </section>

              <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
                <h2 className="text-[16px] font-extrabold text-[#F2F4FA]">One-pager auditeur</h2>
                <p className="mt-3 text-[13px] leading-relaxed text-[#9AA3BD]">
                  Une page PDF par formation, générée depuis la fiche. Disponible dès qu&apos;une
                  fiche est complète.
                </p>
                <Link
                  href="/super/formations"
                  className="mt-3 inline-block text-[13px] font-semibold text-[#A99BFF] hover:underline"
                >
                  Personnaliser le modèle ›
                </Link>
              </section>
            </aside>
          </div>
        </>
      )}

      {bulkOpen && bulkField ? (
        <BulkFillDrawer
          fieldId={bulkField}
          courses={courses}
          onClose={() => setBulkOpen(false)}
          onDone={async () => {
            setBulkOpen(false);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function BulkFillDrawer({
  fieldId,
  courses,
  onClose,
  onDone,
}: {
  fieldId: CatalogueProofFieldId;
  courses: CourseProof[];
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const field = CATALOGUE_PROOF_FIELDS.find((f) => f.id === fieldId)!;
  const candidates = courses.filter((c) => c.missingIds.includes(fieldId));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.id)),
  );
  const [mode, setMode] = useState<"same" | "domain">("same");
  const [value, setValue] = useState("");
  const [byDomain, setByDomain] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [objIndex, setObjIndex] = useState(0);
  const [objDraft, setObjDraft] = useState("");

  const domainsInSelection = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      if (selected.has(c.id)) set.add(c.domain || "Sans thématique");
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [candidates, selected]);

  const objCourse = candidates[objIndex] ?? null;

  useEffect(() => {
    if (fieldId === "objectives" && objCourse) {
      setObjDraft("");
      setSelected(new Set([objCourse.id]));
    }
  }, [fieldId, objCourse]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runPreview = async () => {
    setBusy(true);
    try {
      const payload = buildPayload();
      const res = await fetch("/api/super-admin/crm/qualiopi/catalog-proofs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, preview: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Aperçu impossible");
      setPreviewCount(json.willUpdate ?? 0);
      setConfirm(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aperçu impossible");
    } finally {
      setBusy(false);
    }
  };

  const buildPayload = () => {
    const courseIds = Array.from(selected);
    if (fieldId === "objectives") {
      const base = objCourse?.objectives ?? [];
      const extra = objDraft
        .split(/\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        fieldId,
        courseIds: objCourse ? [objCourse.id] : [],
        objectives: [...base, ...extra],
      };
    }
    if (mode === "domain") {
      return { fieldId, courseIds, valueByDomain: byDomain };
    }
    return { fieldId, courseIds, value };
  };

  const apply = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/catalog-proofs/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mise à jour impossible");
      toast.success(`${json.updated ?? 0} fiche(s) mise(s) à jour`);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mise à jour impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <button type="button" className="flex-1" aria-label="Fermer" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-[#1A2340] bg-[#0A0F1E] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#1A2340] px-5 py-4">
          <div>
            <p className="text-[12px] text-[#9AA3BD]">Compléter en série</p>
            <h3 className="text-[18px] font-extrabold text-[#F2F4FA]">{field.label}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#9AA3BD] hover:bg-[#111831]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {fieldId === "objectives" ? (
            <>
              <p className="text-[13px] text-[#9AA3BD]">
                Les objectifs se complètent fiche par fiche (minimum 3).
              </p>
              {objCourse ? (
                <div className="rounded-2xl border border-[#1A2340] bg-[#111831] p-4">
                  <p className="text-[14px] font-extrabold text-[#F2F4FA]">
                    {sentenceCaseTitle(objCourse.title)}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6C7593]">
                    {objIndex + 1} / {candidates.length}
                  </p>
                  <ul className="mt-3 space-y-1 text-[13px] text-[#9AA3BD]">
                    {objCourse.objectives.map((o, i) => (
                      <li key={i}>
                        {i + 1}. {o}
                      </li>
                    ))}
                    {!objCourse.objectives.length ? (
                      <li className="italic">Aucun objectif pour l’instant</li>
                    ) : null}
                  </ul>
                  <textarea
                    value={objDraft}
                    onChange={(e) => setObjDraft(e.target.value)}
                    rows={4}
                    placeholder="Ajouter des objectifs (un par ligne)"
                    className="mt-3 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-[13px] text-[#F2F4FA]"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={objIndex <= 0}
                      onClick={() => setObjIndex((i) => Math.max(0, i - 1))}
                      className="border-[#26304F] text-[#F2F4FA]"
                    >
                      Précédente
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={objIndex >= candidates.length - 1}
                      onClick={() => setObjIndex((i) => Math.min(candidates.length - 1, i + 1))}
                      className="border-[#26304F] text-[#F2F4FA]"
                    >
                      Suivante
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[#6C7593]">Aucune fiche à compléter</p>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="mb-2 text-[12px] font-semibold text-[#9AA3BD]">
                  Fiches concernées ({selected.size} / {candidates.length})
                </p>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[#1A2340] bg-[#0B1122] p-2">
                  {candidates.map((c) => (
                    <li key={c.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#111831]">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggle(c.id)}
                          className="accent-[#6E5BFF]"
                        />
                        <span className="truncate text-[12px] text-[#F2F4FA]">
                          {sentenceCaseTitle(c.title)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("same")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold",
                    mode === "same" ? "bg-[#6E5BFF]/25 text-[#C9C2FF]" : "text-[#6C7593]",
                  )}
                >
                  Même valeur pour toutes
                </button>
                <button
                  type="button"
                  onClick={() => setMode("domain")}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-semibold",
                    mode === "domain" ? "bg-[#6E5BFF]/25 text-[#C9C2FF]" : "text-[#6C7593]",
                  )}
                >
                  Valeur par thématique
                </button>
              </div>

              {mode === "same" ? (
                <FieldInput fieldId={fieldId} value={value} onChange={setValue} />
              ) : (
                <div className="space-y-3">
                  {domainsInSelection.map((d) => (
                    <div key={d}>
                      <p className="mb-1 text-[11px] font-semibold text-[#6C7593]">{d}</p>
                      <FieldInput
                        fieldId={fieldId}
                        value={byDomain[d] ?? ""}
                        onChange={(v) => setByDomain((prev) => ({ ...prev, [d]: v }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {confirm ? (
            <div className="rounded-2xl border border-[#F2CF6B]/30 bg-[#F2CF6B]/10 p-4 text-[13px] text-[#F2F4FA]">
              <p className="font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-[#F2CF6B]" />
                {previewCount ?? 0} fiches seront modifiées
              </p>
              <p className="mt-1 text-[#9AA3BD]">
                Les valeurs déjà renseignées ne seront pas remplacées.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-[#1A2340] px-5 py-4">
          {!confirm ? (
            <button
              type="button"
              disabled={busy || (!selected.size && fieldId !== "objectives")}
              onClick={() => void runPreview()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-[13px] font-extrabold text-[#0A0F1E] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aperçu
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || (previewCount ?? 0) <= 0}
              onClick={() => void apply()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#6BE39B] py-2.5 text-[13px] font-extrabold text-[#0A0F1E] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmer
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#26304F] px-4 py-2.5 text-[13px] font-semibold text-[#9AA3BD]"
          >
            Annuler
          </button>
        </div>
      </aside>
    </div>
  );
}

function FieldInput({
  fieldId,
  value,
  onChange,
}: {
  fieldId: CatalogueProofFieldId;
  value: string;
  onChange: (v: string) => void;
}) {
  if (fieldId === "recognition_type") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-[13px] text-[#F2F4FA]"
      >
        <option value="">Choisir…</option>
        {QUALIOPI_RECOGNITION_TYPES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    );
  }
  if (fieldId === "pedagogical_modality") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-[13px] text-[#F2F4FA]"
      >
        <option value="">Choisir…</option>
        {QUALIOPI_PEDAGOGICAL_MODALITIES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    );
  }
  if (fieldId === "financing_modalities") {
    const selected = new Set(
      value
        .split(" · ")
        .map((s) => s.trim())
        .filter(Boolean),
    );
    return (
      <div className="flex flex-wrap gap-2">
        {QUALIOPI_FINANCING_OPTIONS.map((opt) => {
          const on = selected.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = new Set(selected);
                if (on) next.delete(opt);
                else next.add(opt);
                onChange(Array.from(next).join(" · "));
              }}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-semibold",
                on ? "bg-[#6E5BFF] text-white" : "bg-[#111831] text-[#9AA3BD]",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  if (fieldId === "pedagogical_modality_detail") {
    return (
      <select
        value={modalityDetailOptionId(value)}
        onChange={(e) => {
          const opt = QUALIOPI_MODALITY_DETAIL_OPTIONS.find((o) => o.id === e.target.value);
          onChange(opt?.text ?? "");
        }}
        className="w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-[13px] text-[#F2F4FA]"
      >
        <option value="">Choisir…</option>
        {QUALIOPI_MODALITY_DETAIL_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      placeholder="Saisir la valeur…"
      className="w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-[13px] text-[#F2F4FA]"
    />
  );
}
