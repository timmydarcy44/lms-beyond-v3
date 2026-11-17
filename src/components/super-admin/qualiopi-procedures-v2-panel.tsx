"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Loader2,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  countFilledSections,
  isSectionFilled,
  PROCEDURE_SECTION_KEYS,
  PROCEDURE_SECTION_LABELS,
  sectionTitle,
  type ProcedureSectionKey,
} from "@/lib/qualiopi/procedure-sections";
import {
  displayProcedureStatus,
  nextMajorVersion,
} from "@/lib/qualiopi/procedure-status";
import { PROCEDURE_VIDEO_SLOTS } from "@/lib/qualiopi/procedure-videos";
import { formatFrDateShort, formatRelativeFr } from "@/lib/qualiopi/reclamation-format";

type Section = {
  id: string;
  key: ProcedureSectionKey | string;
  position: number;
  content: string;
};

type Procedure = {
  id: string;
  slug: string;
  title: string;
  status: string;
  current_version: string;
  indicators: number[];
  legal_obligation?: boolean;
  owner_name?: string | null;
  validated_by_name?: string | null;
  validated_at?: string | null;
  effective_date?: string | null;
  next_review_at?: string | null;
  audiences?: string[];
  updated_at: string;
  sections: Section[];
  migration_required?: boolean;
};

type ListFilter = "all" | "todo" | "validated";
type SaveState = "idle" | "saving" | "saved" | "error";

const CARD = "#111831";
const INNER = "#0B1122";
const BORDER = "#1A2340";
const BORDER2 = "#26304F";
const TEXT = "#F2F4FA";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const VIOLET = "#6E5BFF";
const VIOLET_SOFT = "#A99BFF";
const GREEN = "#6BE39B";
const AMBER = "#F2CF6B";
const RED = "#FF8A9B";
const BLUE = "#8DB8FF";

function contentToHtml(content: string): string {
  const c = content.trim();
  if (!c) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(c)) return c;
  return c
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function htmlToPlainish(html: string): string {
  if (!html) return "";
  if (!/<[a-z][\s\S]*>/i.test(html)) return html;
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<h[1-6][^>]*>/gi, "## ")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function renderPreview(content: string): ReactNode {
  const plain = htmlToPlainish(content);
  if (!plain.trim()) return null;
  const lines = plain.split("\n");
  return (
    <div className="space-y-2 text-[14px] leading-[1.6]" style={{ color: TEXT }}>
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-2" />;
        if (t.startsWith("## "))
          return (
            <p key={i} className="pt-1 text-[14px] font-bold">
              {t.slice(3)}
            </p>
          );
        if (t.startsWith("- ") || t.startsWith("* "))
          return (
            <p key={i} className="pl-3">
              • {t.slice(2)}
            </p>
          );
        return <p key={i}>{t}</p>;
      })}
    </div>
  );
}

function toneColor(tone: string): string {
  if (tone === "green") return GREEN;
  if (tone === "red") return RED;
  if (tone === "blue") return BLUE;
  if (tone === "amber") return AMBER;
  return MUTED;
}

export function QualiopiProceduresV2Panel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ListFilter>("all");
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [createOpen, setCreateOpen] = useState(false);
  const [validateOpen, setValidateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editKey, setEditKey] = useState<ProcedureSectionKey | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    indicators: "",
    legal_obligation: false,
  });
  const [validateForm, setValidateForm] = useState({
    effective_date: new Date().toISOString().slice(0, 10),
    next_review_at: "",
    audiences: ["formateurs", "equipe"] as string[],
  });

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/procedures");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Procédures");
      const list = (json.procedures ?? []) as Procedure[];
      setProcedures(list);
      setMigrationRequired(Boolean(json.migration_required));
      if (!selectedId && list[0]?.id) setQuery({ id: list[0].id });
      if (json.migration_required) {
        toast.message("Migration SQL procédures v2 à coller pour valider / PDF.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [selectedId, setQuery]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => procedures.find((p) => p.id === selectedId) ?? null,
    [procedures, selectedId],
  );

  const counts = useMemo(() => {
    const validated = procedures.filter((p) => p.status === "validated").length;
    const drafts = procedures.filter((p) => p.status !== "validated").length;
    const nextReview = procedures
      .map((p) => p.next_review_at)
      .filter(Boolean)
      .sort()[0] as string | undefined;
    return { total: procedures.length, validated, drafts, nextReview };
  }, [procedures]);

  const filtered = useMemo(() => {
    return procedures.filter((p) => {
      if (filter === "validated") return p.status === "validated";
      if (filter === "todo") return p.status !== "validated";
      return true;
    });
  }, [procedures, filter]);

  const filled = selected ? countFilledSections(selected.sections) : 0;
  const canValidate = filled >= 7 && !migrationRequired;

  const saveSection = useCallback(
    async (key: ProcedureSectionKey, content: string) => {
      if (!selected) return;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/super-admin/crm/qualiopi/procedures/${selected.id}/sections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, content }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Enregistrement");
        setProcedures((prev) =>
          prev.map((p) =>
            p.id !== selected.id
              ? p
              : {
                  ...p,
                  updated_at: new Date().toISOString(),
                  sections: p.sections.map((s) => (s.key === key ? { ...s, content } : s)),
                },
          ),
        );
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
        toast.error(e instanceof Error ? e.message : "Erreur");
      }
    },
    [selected],
  );

  const createProcedure = async () => {
    const title = createForm.title.trim();
    if (!title) return toast.error("Titre requis");
    const indicators = createForm.indicators
      .split(/[,\s]+/)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));
    const res = await fetch("/api/super-admin/crm/qualiopi/procedures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        indicators,
        legal_obligation: createForm.legal_obligation,
      }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Création impossible");
    toast.success("Procédure créée");
    setCreateOpen(false);
    setCreateForm({ title: "", indicators: "", legal_obligation: false });
    await load();
    if (json.procedure?.id) setQuery({ id: json.procedure.id });
  };

  const validate = async () => {
    if (!selected) return;
    const res = await fetch(`/api/super-admin/crm/qualiopi/procedures/${selected.id}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effective_date: validateForm.effective_date,
        next_review_at:
          validateForm.next_review_at ||
          (() => {
            const d = new Date(validateForm.effective_date || Date.now());
            d.setMonth(d.getMonth() + 12);
            return d.toISOString().slice(0, 10);
          })(),
        audiences: validateForm.audiences,
      }),
    });
    const json = await res.json();
    if (!res.ok) return toast.error(json.error || "Validation impossible");
    toast.success(`Version ${json.version} validée`);
    setValidateOpen(false);
    await load();
  };

  const exportMd = () => {
    if (!selected) return;
    const md = [
      `# ${selected.title}`,
      "",
      ...PROCEDURE_SECTION_KEYS.map((key, i) => {
        const sec = selected.sections.find((s) => s.key === key);
        return `## ${i + 1}. ${PROCEDURE_SECTION_LABELS[key]}\n\n${htmlToPlainish(sec?.content ?? "")}\n`;
      }),
    ].join("\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.slug || "procedure"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reviewTone =
    counts.nextReview && new Date(counts.nextReview).getTime() < Date.now() ? RED : MUTED;

  return (
    <div className="space-y-5" style={{ color: TEXT, fontFamily: "Manrope, system-ui, sans-serif" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight">Procédures qualité</h1>
          <p className="mt-1 max-w-xl text-sm" style={{ color: MUTED }}>
            Rédiger, valider, diffuser et réviser les procédures présentées à l&apos;auditeur
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/super-admin/crm/qualiopi/procedures/dossier-pdf"
            className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold"
            style={{ borderColor: BORDER2, color: TEXT }}
          >
            ⤓ Dossier auditeur (PDF)
          </a>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-extrabold text-[#0A0F1E]"
          >
            <Plus className="h-4 w-4" /> Procédure
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-2 divide-x rounded-[24px] sm:grid-cols-4"
        style={{ background: CARD, border: `1px solid ${BORDER}`, borderColor: BORDER }}
      >
        {[
          { label: `${counts.total} procédure${counts.total > 1 ? "s" : ""}`, color: TEXT },
          { label: `${counts.validated} validée${counts.validated > 1 ? "s" : ""}`, color: GREEN },
          {
            label: `${counts.drafts} brouillon${counts.drafts > 1 ? "s" : ""} à compléter`,
            color: counts.drafts > 0 ? AMBER : MUTED,
          },
          {
            label: counts.nextReview
              ? `${formatFrDateShort(counts.nextReview)} prochaine revue`
              : "— prochaine revue",
            color: reviewTone,
          },
        ].map((c) => (
          <div key={c.label} className="px-4 py-3 text-sm font-semibold" style={{ color: c.color }}>
            {c.label}
          </div>
        ))}
      </div>

      <section
        className="rounded-[24px] p-5"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-extrabold" style={{ color: TEXT }}>
              Vidéos
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: MUTED }}>
              Tutos courts pour présenter chaque procédure à l&apos;équipe et à l&apos;auditeur.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PROCEDURE_VIDEO_SLOTS.map((slot) => {
            const match = procedures.find((p) => p.slug === slot.slug);
            return (
              <div
                key={slot.slug}
                className="overflow-hidden rounded-[20px]"
                style={{ background: INNER, border: `1px solid ${BORDER2}` }}
              >
                {slot.videoUrl ? (
                  <video
                    className="aspect-video w-full bg-black object-contain"
                    controls
                    preload="metadata"
                    src={slot.videoUrl}
                  >
                    Votre navigateur ne lit pas la vidéo.
                  </video>
                ) : (
                  <div
                    className="flex aspect-video items-center justify-center"
                    style={{ background: "#080C18" }}
                  >
                    <span
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{
                        background: "rgba(242,207,107,.12)",
                        color: AMBER,
                        border: "1px solid rgba(242,207,107,.35)",
                      }}
                    >
                      À venir
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 px-3.5 py-3">
                  <p className="text-[13.5px] font-bold leading-snug" style={{ color: TEXT }}>
                    {slot.title}
                  </p>
                  {match ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery({ id: match.id });
                        setMode("preview");
                        setEditKey(null);
                      }}
                      className="shrink-0 text-[12px] font-semibold"
                      style={{ color: VIOLET_SOFT }}
                    >
                      Ouvrir ›
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          <div className="h-[480px] animate-pulse rounded-[24px]" style={{ background: CARD }} />
          <div className="h-[480px] animate-pulse rounded-[24px]" style={{ background: CARD }} />
          <div className="h-[480px] animate-pulse rounded-[24px]" style={{ background: CARD }} />
        </div>
      ) : (
        <div className="grid gap-4 max-[1000px]:grid-cols-1 min-[1000px]:max-xl:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_300px]">
          {/* Liste */}
          <aside className="rounded-[24px] p-3.5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(
                [
                  ["all", `Toutes (${counts.total})`],
                  ["todo", `À compléter (${counts.drafts})`],
                  ["validated", `Validées (${counts.validated})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className="rounded-full px-3 py-1.5 text-xs font-bold"
                  style={
                    filter === id
                      ? { background: "rgba(110,91,255,.18)", color: "#C9C2FF", border: `1px solid rgba(110,91,255,.4)` }
                      : { color: MUTED, border: `1px solid ${BORDER2}` }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="space-y-0">
              {filtered.map((p, idx) => {
                const st = displayProcedureStatus(p);
                const n = countFilledSections(p.sections);
                const sel = p.id === selected?.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery({ id: p.id });
                        setMode("preview");
                        setEditKey(null);
                      }}
                      className="w-full rounded-[16px] px-3 py-3 text-left transition"
                      style={
                        sel
                          ? {
                              background: "rgba(110,91,255,.12)",
                              border: "1px solid rgba(110,91,255,.4)",
                            }
                          : {
                              borderTop: idx === 0 ? "none" : `1px solid ${BORDER}`,
                              borderRadius: 0,
                              paddingLeft: 4,
                              paddingRight: 4,
                            }
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-3 text-sm font-extrabold">{p.title}</p>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            color: toneColor(st.tone),
                            background: `${toneColor(st.tone)}22`,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.legal_obligation ? (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(169,155,255,.15)", color: "#C9C2FF" }}>
                            Obligation légale
                          </span>
                        ) : null}
                        {(p.indicators ?? []).map((nInd) => (
                          <span
                            key={nInd}
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: "rgba(169,155,255,.15)", color: "#C9C2FF" }}
                          >
                            Ind. {nInd}
                          </span>
                        ))}
                        <span className="text-[11px]" style={{ color: TERT }}>
                          {n} / 7 sections
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Document */}
          <section className="rounded-[24px]" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            {selected ? (
              <>
                <div className="border-b px-5 py-5 sm:px-6" style={{ borderColor: BORDER }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[22px] font-extrabold leading-snug">{selected.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold" style={{ color: toneColor(displayProcedureStatus(selected).tone) }}>
                          ● {displayProcedureStatus(selected).label} · v{selected.current_version}
                        </span>
                        {(selected.indicators ?? []).map((n) => (
                          <span key={n} className="rounded-full px-2 py-0.5 font-semibold" style={{ background: "rgba(169,155,255,.15)", color: "#C9C2FF" }}>
                            Ind. {n}
                          </span>
                        ))}
                        <span style={{ color: MUTED }}>Modifié {formatRelativeFr(selected.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-full p-1" style={{ background: INNER, border: `1px solid ${BORDER2}` }}>
                        {(["preview", "edit"] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMode(m);
                              if (m === "edit" && !editKey) setEditKey("objet");
                            }}
                            className="rounded-full px-3 py-1.5 text-xs font-bold"
                            style={mode === m ? { background: "#fff", color: "#0A0F1E" } : { color: MUTED }}
                          >
                            {m === "preview" ? "Aperçu" : "Modifier"}
                          </button>
                        ))}
                      </div>
                      <span className="text-[11px]" style={{ color: MUTED }}>
                        {saveState === "saving"
                          ? "Enregistrement…"
                          : saveState === "error"
                            ? "Erreur, réessayer"
                            : "Enregistré automatiquement"}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          className="grid h-9 w-9 place-items-center rounded-full border"
                          style={{ borderColor: BORDER2 }}
                          onClick={() => setMenuOpen((v) => !v)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen ? (
                          <div
                            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl border py-1 text-sm"
                            style={{ background: INNER, borderColor: BORDER2 }}
                          >
                            <button type="button" className="block w-full px-3 py-2 text-left hover:bg-white/5" onClick={() => { exportMd(); setMenuOpen(false); }}>
                              Exporter en .md
                            </button>
                            <button type="button" className="block w-full px-3 py-2 text-left hover:bg-white/5" onClick={() => { setHistoryOpen(true); setMenuOpen(false); }}>
                              Historique
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {selected.status === "draft" && selected.current_version.includes(".") && Number(selected.current_version.split(".")[0]) >= 1 ? (
                    <p className="mt-3 rounded-2xl px-3 py-2 text-xs" style={{ background: "rgba(242,207,107,.08)", color: AMBER }}>
                      Vous modifiez un brouillon. La version validée précédente reste en vigueur.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  {PROCEDURE_SECTION_KEYS.map((key, i) => {
                    const sec = selected.sections.find((s) => s.key === key);
                    const content = sec?.content ?? "";
                    const filledSec = isSectionFilled(content);
                    const editing = mode === "edit" && editKey === key;
                    return (
                      <div key={key}>
                        <h3 className="mb-2 text-base font-extrabold" style={{ color: filledSec ? TEXT : AMBER }}>
                          {sectionTitle(key, i + 1)}
                        </h3>
                        {editing ? (
                          <SectionEditor
                            content={content}
                            onDebouncedSave={(v) => void saveSection(key, v)}
                          />
                        ) : filledSec ? (
                          <div className="rounded-2xl p-4" style={{ background: INNER, border: `1px solid ${BORDER}` }}>
                            {renderPreview(content)}
                            {mode === "edit" ? (
                              <button
                                type="button"
                                className="mt-3 text-xs font-bold"
                                style={{ color: VIOLET }}
                                onClick={() => setEditKey(key)}
                              >
                                Modifier cette section
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            className="rounded-2xl border border-dashed px-4 py-5"
                            style={{ borderColor: "#F2CF6B55", background: "#F2CF6B0A" }}
                          >
                            <p className="text-sm font-semibold" style={{ color: AMBER }}>
                              à rédiger
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setMode("edit");
                                setEditKey(key);
                              }}
                              className="mt-3 rounded-full px-3 py-1.5 text-xs font-extrabold"
                              style={{ background: AMBER, color: "#0A0F1E" }}
                            >
                              ＋ Rédiger
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="p-6 text-sm" style={{ color: MUTED }}>
                Sélectionnez une procédure.
              </p>
            )}
          </section>

          {/* Droite */}
          <aside className="space-y-3 max-xl:order-last">
            {selected ? (
              <>
                <div
                  className="rounded-[24px] p-4"
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    boxShadow: `inset 3px 0 0 ${filled >= 7 ? GREEN : AMBER}`,
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-extrabold">Prête à valider ?</p>
                    <span className="text-sm font-bold" style={{ color: filled >= 7 ? GREEN : AMBER }}>
                      {filled} / 7
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {PROCEDURE_SECTION_KEYS.map((key) => {
                      const ok = isSectionFilled(selected.sections.find((s) => s.key === key)?.content);
                      return (
                        <li key={key} className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                          <span
                            className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold"
                            style={
                              ok
                                ? { background: "rgba(107,227,155,.15)", color: GREEN }
                                : { border: `1px dashed ${BORDER2}`, color: TERT }
                            }
                          >
                            {ok ? "✓" : ""}
                          </span>
                          {PROCEDURE_SECTION_LABELS[key]}
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    disabled={!canValidate}
                    onClick={() => setValidateOpen(true)}
                    className="mt-4 w-full rounded-full py-2.5 text-sm font-extrabold disabled:opacity-40"
                    style={{ background: canValidate ? GREEN : BORDER2, color: canValidate ? "#0A0F1E" : MUTED }}
                  >
                    Valider la version {nextMajorVersion(selected.current_version)}
                  </button>
                </div>

                <div className="rounded-[24px] p-4 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <p className="mb-3 font-extrabold">Fiche du document</p>
                  <MetaRow label="Responsable" value={selected.owner_name || "—"} />
                  <MetaRow label="Validée par" value={selected.validated_by_name || "—"} />
                  <MetaRow label="Date d’application" value={formatFrDateShort(selected.effective_date)} />
                  <MetaRow
                    label="Prochaine revue"
                    value={
                      selected.next_review_at
                        ? formatFrDateShort(selected.next_review_at)
                        : "À définir"
                    }
                    valueColor={
                      !selected.next_review_at
                        ? AMBER
                        : new Date(selected.next_review_at).getTime() < Date.now()
                          ? RED
                          : MUTED
                    }
                  />
                  <MetaRow
                    label="Diffusée à"
                    value={
                      selected.audiences?.length
                        ? selected.audiences.join(", ")
                        : "—"
                    }
                  />
                </div>

                <div className="rounded-[24px] p-4 text-sm" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                  <p className="mb-2 font-extrabold">Après validation</p>
                  <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                    Une version figée et un PDF sont générés. Les publics choisis reçoivent un e-mail
                    (comptes de test uniquement pour l’instant).
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-xs font-bold"
                    style={{ color: "#A99BFF" }}
                    onClick={() => setHistoryOpen(true)}
                  >
                    Historique des versions ›
                  </button>
                </div>
              </>
            ) : null}
          </aside>
        </div>
      )}

      {createOpen ? (
        <Modal title="Nouvelle procédure" onClose={() => setCreateOpen(false)}>
          <Field label="Titre">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            />
          </Field>
          <Field label="Indicateurs (ex. 21, 22)">
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
              value={createForm.indicators}
              onChange={(e) => setCreateForm((f) => ({ ...f, indicators: e.target.value }))}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
            <input
              type="checkbox"
              checked={createForm.legal_obligation}
              onChange={(e) => setCreateForm((f) => ({ ...f, legal_obligation: e.target.checked }))}
            />
            Obligation légale (sans indicateur Qualiopi)
          </label>
          <button
            type="button"
            onClick={() => void createProcedure()}
            className="mt-2 w-full rounded-full bg-white py-2.5 text-sm font-extrabold text-[#0A0F1E]"
          >
            Créer
          </button>
        </Modal>
      ) : null}

      {validateOpen && selected ? (
        <Modal
          title={`Valider la version ${nextMajorVersion(selected.current_version)}`}
          onClose={() => setValidateOpen(false)}
        >
          <Field label="Date d’application">
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
              value={validateForm.effective_date}
              onChange={(e) => setValidateForm((f) => ({ ...f, effective_date: e.target.value }))}
            />
          </Field>
          <Field label="Prochaine revue (12 mois par défaut)">
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
              value={validateForm.next_review_at}
              onChange={(e) => setValidateForm((f) => ({ ...f, next_review_at: e.target.value }))}
            />
          </Field>
          <p className="text-xs" style={{ color: MUTED }}>
            Diffusion réservée aux comptes de test (is_test).
          </p>
          <button
            type="button"
            onClick={() => void validate()}
            className="mt-2 w-full rounded-full py-2.5 text-sm font-extrabold"
            style={{ background: GREEN, color: "#0A0F1E" }}
          >
            Confirmer la validation
          </button>
        </Modal>
      ) : null}

      {historyOpen && selected ? (
        <Modal title="Historique des versions" onClose={() => setHistoryOpen(false)}>
          <HistoryList procedureId={selected.id} />
        </Modal>
      ) : null}
    </div>
  );
}

function SectionEditor({
  content,
  onDebouncedSave,
}: {
  content: string;
  onDebouncedSave: (value: string) => void;
}) {
  const [local, setLocal] = useState(content);
  const editor = useEditor({
    extensions: [StarterKit],
    content: contentToHtml(content),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 text-[14px] leading-relaxed focus:outline-none [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const plain = htmlToPlainish(html);
      setLocal(plain);
    },
  });

  useEffect(() => {
    const t = setTimeout(() => onDebouncedSave(local), 800);
    return () => clearTimeout(t);
  }, [local, onDebouncedSave]);

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(contentToHtml(content), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) {
    return <div className="h-32 animate-pulse rounded-2xl" style={{ background: INNER }} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: BORDER2, background: INNER }}>
      <div className="flex gap-1 border-b px-2 py-1.5" style={{ borderColor: BORDER2 }}>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: MUTED }} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: MUTED }} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: MUTED }} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-lg" style={{ color: MUTED }} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function HistoryList({ procedureId }: { procedureId: string }) {
  const [rows, setRows] = useState<Array<{ version: string; validated_at: string; validated_by_name?: string; pdf_path?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/super-admin/crm/qualiopi/procedures/${procedureId}`);
      const json = await res.json();
      setRows(json.procedure?.versions ?? []);
      setLoading(false);
    })();
  }, [procedureId]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
      </p>
    );
  }
  if (!rows.length) {
    return <p className="text-sm" style={{ color: MUTED }}>Aucune version validée pour l’instant.</p>;
  }
  return (
    <ul className="space-y-2">
      {rows.map((v) => (
        <li
          key={v.version}
          className="flex items-center justify-between rounded-2xl border px-3 py-2 text-sm"
          style={{ borderColor: BORDER2, background: INNER }}
        >
          <div>
            <p className="font-bold">v{v.version}</p>
            <p className="text-xs" style={{ color: MUTED }}>
              {formatFrDateShort(v.validated_at)} · {v.validated_by_name || "—"}
            </p>
          </div>
          {v.pdf_path ? (
            <button
              type="button"
              className="text-xs font-bold"
              style={{ color: "#A99BFF" }}
              onClick={() => {
                void (async () => {
                  const res = await fetch(
                    `/api/super-admin/crm/qualiopi/procedures/${procedureId}/pdf?version=${encodeURIComponent(v.version)}`,
                  );
                  const json = await res.json();
                  if (json.url) window.open(json.url, "_blank");
                  else toast.error(json.error || "PDF indisponible");
                })();
              }}
            >
              PDF
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function MetaRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 text-xs" style={{ borderColor: BORDER }}>
      <span style={{ color: TERT }}>{label}</span>
      <span className="text-right font-semibold" style={{ color: valueColor || MUTED }}>
        {value}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block space-y-1 text-xs font-semibold" style={{ color: MUTED }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[24px] p-5"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: MUTED }}>
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
