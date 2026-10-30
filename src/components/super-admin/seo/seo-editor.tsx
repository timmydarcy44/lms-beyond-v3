"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { applySeoDraft, CHECK_FIELD_ID, draftToScoreInput, seoDraftFromPage, type SeoDraftFields } from "@/lib/seo/draft";
import { charMeter, googleDescriptionPreview, googleTitlePreview, wordMeter } from "@/lib/seo/google-preview";
import { SEO_JSONLD_TYPES, suggestedJsonLdTypes } from "@/lib/seo/jsonld-types";
import { scoreSwatch } from "@/lib/seo/overview";
import { headingStatus, questionAppearsInText } from "@/lib/seo/parse-html";
import { scoreSeoPage, type SeoCheckResult, type SeoScorePeer } from "@/lib/seo/score";
import type { SeoHeadingsCache, SeoPageRecord } from "@/lib/seo/byound-seo";
import type { SeoProposalRecord } from "@/lib/seo/proposals";
import { applyProposalToDraft, SeoProposalPanel } from "@/components/super-admin/seo/seo-proposal-panel";

type Row = SeoPageRecord & {
  label: string;
  group: string;
  score: number;
  issues: string[];
  checks?: SeoCheckResult[];
  impressions?: number | null;
  clicks?: number | null;
  queries?: Array<{ query: string; impressions: number; clicks: number; position: number }>;
  headings_managed?: boolean;
};

const fieldClass =
  "w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm text-[#EEF1F8] outline-none placeholder:text-[#5D6785] focus-visible:ring-2 focus-visible:ring-[#6E5BFF]";

const TONE = { green: "#1F9D57", orange: "#E7A92C", red: "#D6334A" };

function formatDay(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

export function SeoEditor({
  pages,
  path,
  onPath,
  onSaved,
  batch = null,
}: {
  pages: Row[];
  path: string;
  onPath: (path: string) => void;
  onSaved: () => void;
  batch?: { index: number; total: number; onNext: () => void } | null;
}) {
  const selected = pages.find((item) => item.path === path) ?? pages[0] ?? null;
  const [draft, setDraft] = useState<SeoDraftFields | null>(null);
  const [query, setQuery] = useState("");
  const [openList, setOpenList] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "publishing">("idle");
  const [versions, setVersions] = useState<Array<{ id: string; published_at: string }>>([]);
  const [headingsCache, setHeadingsCache] = useState<SeoHeadingsCache | null>(null);
  const [proposals, setProposals] = useState<SeoProposalRecord[]>([]);
  const skipSave = useRef(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!selected) return;
    skipSave.current = true;
    setDraft(seoDraftFromPage(applySeoDraft(selected, selected.draft)));
    setHeadingsCache(selected.headings_cache);
    setProposals([]);
    void fetch(`/api/super-admin/seo/proposals?path=${encodeURIComponent(selected.path)}`)
      .then((res) => res.json())
      .then((json) => setProposals(json.proposals ?? []))
      .catch(() => setProposals([]));
    setQuery("");
    setOpenList(false);
    const cachedAt = selected.headings_cached_at ? new Date(selected.headings_cached_at).getTime() : 0;
    const stale = !cachedAt || Date.now() - cachedAt > 24 * 60 * 60 * 1000;
    if (stale) {
      void fetch("/api/super-admin/seo/headings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.cache) setHeadingsCache(json.cache);
        })
        .catch(() => undefined);
    }
  }, [selected?.path]);

  useEffect(() => {
    if (!selected) return;
    void fetch(`/api/super-admin/seo/versions?path=${encodeURIComponent(selected.path)}`)
      .then((res) => res.json())
      .then((json) => setVersions(json.versions ?? []))
      .catch(() => setVersions([]));
  }, [selected?.path]);

  const peers: SeoScorePeer[] = useMemo(
    () =>
      pages.map((page) =>
        page.path === path && draft
          ? { path: page.path, title: draft.title, meta_description: draft.meta_description }
          : { path: page.path, title: page.title, meta_description: page.meta_description },
      ),
    [pages, path, draft?.title, draft?.meta_description],
  );

  const scored = useMemo(() => {
    if (!draft || !selected) return null;
    return scoreSeoPage(
      {
        ...draftToScoreInput(selected.path, draft, headingsCache),
        faqVisibleOnPage: headingsCache?.text
          ? draft.faq.filter((item) => item.question.trim()).length >= 2 &&
            draft.faq.filter((item) => item.question.trim()).every((item) => questionAppearsInText(item.question, headingsCache.text ?? ""))
          : headingsCache?.faq_visible,
      },
      peers,
    );
  }, [draft, selected, peers, headingsCache]);

  useEffect(() => {
    if (!draft || !selected) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSaving("saving");
      void fetch("/api/super-admin/seo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, ...draft }),
      }).then((res) => {
        setSaving(res.ok ? "saved" : "idle");
        if (!res.ok) toast.error("Brouillon non enregistré");
      });
    }, 800);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [draft, selected?.path]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((item) => item.label.toLowerCase().includes(q) || item.path.toLowerCase().includes(q));
  }, [pages, query]);

  if (!selected || !draft || !scored) return <p className="text-sm text-[#AEB6CC]">Aucune page.</p>;

  const swatch = scoreSwatch(scored.score);
  const titlePrev = googleTitlePreview(draft.title);
  const descPrev = googleDescriptionPreview(draft.meta_description);
  const titleMeter = charMeter(draft.title.length, 50, 60, 80);
  const descMeter = charMeter(draft.meta_description.length, 140, 160, 200);
  const suggested = suggestedJsonLdTypes(selected.path);
  const jsonldSet = new Set(draft.jsonld_types);
  const displayPath = selected.path === "/" ? "" : selected.path.replace(/^\//, "");
  const modified = formatDay(selected.updated_at);

  const publish = async () => {
    setSaving("publishing");
    try {
      const res = await fetch("/api/super-admin/seo/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, ...draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Publication impossible");
      toast.success("Publié — page, sitemap et llms.txt revalidés.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publication impossible");
    } finally {
      setSaving("idle");
    }
  };

  const markProposal = async (proposal: SeoProposalRecord, status: "accepted" | "ignored") => {
    await fetch("/api/super-admin/seo/proposals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: proposal.id, status }),
    });
    setProposals((current) => current.map((item) => (item.id === proposal.id ? { ...item, status } : item)));
  };

  const acceptProposal = async (proposal: SeoProposalRecord) => {
    skipSave.current = false;
    setDraft((current) => (current ? applyProposalToDraft(current, proposal) : current));
    await markProposal(proposal, "accepted");
  };

  const generate = async () => {
    if (!draft) return;
    setSaving("saving");
    try {
      const res = await fetch("/api/super-admin/seo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selected.path,
          current: {
            title: draft.title,
            meta_description: draft.meta_description,
            focus_keyword: draft.focus_keyword,
            ai_summary: draft.ai_summary,
            faq: draft.faq,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Génération impossible");
      setProposals(json.proposals ?? []);
      toast.success("Propositions prêtes — acceptez les champs un par un, puis publiez.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Génération impossible");
    } finally {
      setSaving("idle");
    }
  };

  const uploadOg = async (file: File) => {
    const form = new FormData();
    form.set("path", selected.path);
    form.set("file", file);
    const res = await fetch("/api/super-admin/seo/og-image", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Téléversement impossible");
    setDraft((current) => (current ? { ...current, og_image_url: json.url } : current));
  };

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <label className="sr-only" htmlFor="seo-page-search">
          Choisir une page
        </label>
        <input
          id="seo-page-search"
          value={openList ? query : `${selected.label} · ${selected.path}`}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenList(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpenList(true);
          }}
          placeholder="Rechercher une page"
          className="h-11 w-full rounded-full border border-[#26304F] bg-[#0B1122] px-4 pr-10 text-sm text-[#EEF1F8] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D6785]" />
        {openList ? (
          <ul className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-[#1A2340] bg-[#111831] p-2 shadow-xl">
            {filtered.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#EEF1F8] hover:bg-[#161B3A] focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPath(item.path);
                    setOpenList(false);
                  }}
                >
                  <span>
                    {item.label}
                    <span className="ml-2 text-xs text-[#5D6785]">{item.path}</span>
                  </span>
                  <span className="text-xs" style={{ color: scoreSwatch(item.score).fg }}>
                    {item.score}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <SeoProposalPanel
            proposals={proposals}
            onAccept={(item) => void acceptProposal(item)}
            onIgnore={(item) => void markProposal(item, "ignored")}
            onAcceptAll={() => {
              const pending = proposals.filter((item) => item.status === "pending");
              skipSave.current = false;
              setDraft((current) => {
                if (!current) return current;
                return pending.reduce((acc, item) => applyProposalToDraft(acc, item), current);
              });
              pending.forEach((item) => void markProposal(item, "accepted"));
            }}
            batch={batch}
          />
          <header className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="grid h-[72px] w-[72px] place-items-center rounded-full"
                  style={{ background: `conic-gradient(${swatch.fg} ${scored.score}%, #1A2340 0)` }}
                  aria-label={`Score ${scored.score} sur 100`}
                >
                  <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#111831] text-lg font-semibold tabular-nums text-[#EEF1F8]">
                    {scored.score}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5D6785]">byound.fr / {displayPath}</p>
                  <h2 className="text-[26px] font-semibold leading-tight text-[#EEF1F8]">{selected.label}</h2>
                  <p className="mt-1 text-sm text-[#AEB6CC]">
                    {draft.noindex ? "Non indexée" : "Indexée"}
                    {modified ? ` · modifiée le ${modified}` : ""}
                    {" · "}
                    {selected.impressions != null ? `${selected.impressions.toLocaleString("fr-FR")} impressions sur 28 jours` : "— impressions sur 28 jours"}
                  </p>
                  <p className="mt-1 text-xs text-[#5D6785]" aria-live="polite">
                    {saving === "saving" ? "Enregistrement du brouillon…" : saving === "saved" ? "Brouillon enregistré" : saving === "publishing" ? "Publication…" : "Les modifications restent en brouillon tant que vous ne publiez pas."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void generate()}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-[#6E5BFF] px-4 text-sm font-semibold text-[#EEF1F8] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
                >
                  <Sparkles className="h-4 w-4" /> Proposer avec l’IA
                </button>
                <button
                  type="button"
                  onClick={() => void publish()}
                  disabled={saving === "publishing"}
                  className="inline-flex h-10 items-center rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
                >
                  Publier
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {scored.checks.map((check) => (
                <button
                  key={check.id}
                  type="button"
                  title={check.message}
                  onClick={() => {
                    if (!check.passed) goTo(CHECK_FIELD_ID[check.id] ?? "seo-field-title");
                  }}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                    check.passed ? "bg-[#0E2A1D] text-[#1F9D57]" : "bg-[#3A1418] text-[#D6334A]"
                  }`}
                >
                  {check.passed ? "✓" : "✕"} {check.passed ? check.label : check.message}
                </button>
              ))}
            </div>
            {versions.length ? (
              <p className="mt-3 text-xs text-[#5D6785]">
                Historique : {versions.length} version{versions.length > 1 ? "s" : ""} · dernière {formatDay(versions[0]?.published_at) ?? ""}
              </p>
            ) : null}
          </header>

          <section className="rounded-[24px] border border-[#6E5BFF]/50 bg-[#111831] p-5">
            <h3 className="text-base font-semibold text-[#EEF1F8]">Référencement</h3>
            <div id="seo-field-keyword" className="mt-4">
              <label className="text-sm font-medium text-[#EEF1F8]" htmlFor="seo-keyword">
                Mot-clé principal
              </label>
              <input
                id="seo-keyword"
                className={`${fieldClass} mt-1`}
                value={draft.focus_keyword}
                onChange={(event) => setDraft({ ...draft, focus_keyword: event.target.value })}
              />
            </div>
            <SeoCharField
              id="seo-field-title"
              label="Titre (balise title)"
              value={draft.title}
              meter={titleMeter}
              onChange={(title) => setDraft({ ...draft, title })}
            />
            <SeoCharField
              id="seo-field-description"
              label="Meta description"
              value={draft.meta_description}
              meter={descMeter}
              multiline
              onChange={(meta_description) => setDraft({ ...draft, meta_description })}
            />
            <div id="seo-field-canonical" className="mt-4">
              <label className="text-sm font-medium text-[#EEF1F8]" htmlFor="seo-canonical">
                URL canonique
              </label>
              <input
                id="seo-canonical"
                className={`${fieldClass} mt-1`}
                value={draft.canonical_url}
                onChange={(event) => setDraft({ ...draft, canonical_url: event.target.value })}
              />
            </div>
            <div id="seo-field-jsonld" className="mt-4">
              <p className="text-sm font-medium text-[#EEF1F8]">Données structurées</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SEO_JSONLD_TYPES.map((type) => {
                  const on = jsonldSet.has(type.id);
                  const recommended = suggested.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          jsonld_types: on ? draft.jsonld_types.filter((item) => item !== type.id) : [...draft.jsonld_types, type.id],
                        })
                      }
                      className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                        on ? "bg-[#0E2A1D] text-[#1F9D57]" : recommended ? "border border-[#6E5BFF] text-[#EEF1F8]" : "border border-[#26304F] text-[#AEB6CC]"
                      }`}
                    >
                      {on ? "✓" : "+"} {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <HeadingsSection
            cache={headingsCache}
            managed={selected.headings_managed === true}
            draft={draft}
            onDraft={setDraft}
          />

          <FaqSection
            draft={draft}
            onDraft={setDraft}
            pageText={headingsCache?.text}
            impressions={selected.impressions}
            managed={selected.headings_managed === true}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4">
            <h3 className="text-sm font-semibold text-[#EEF1F8]">Aperçu dans Google</h3>
            <div className="mt-3 rounded-xl p-4" style={{ background: "#fff" }}>
              <div className="flex items-center gap-2">
                <img src="/icons/edge/edge-icon-E.png" alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full" />
                <div>
                  <p style={{ color: "#202124", fontSize: 14, lineHeight: 1.2 }}>Byound</p>
                  <p style={{ color: "#4D5156", fontSize: 12 }}>https://www.byound.fr{selected.path === "/" ? "/" : selected.path}</p>
                </div>
              </div>
              <p className="mt-2" style={{ color: "#1A0DAB", fontSize: 19, lineHeight: 1.3 }}>
                {titlePrev.text || "Titre de la page"}
              </p>
              <p className="mt-1" style={{ color: "#4D5156", fontSize: 14, lineHeight: 1.4 }}>
                {descPrev.text || "La meta description apparaîtra ici."}
              </p>
            </div>
            <p className="mt-2 text-sm" style={{ color: titlePrev.clipped ? TONE.red : TONE.green }}>
              {titlePrev.clipped ? "Le titre est coupé dans les résultats." : "Le titre s’affiche en entier."}
            </p>
          </section>

          <section id="seo-field-og" className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4">
            <h3 className="text-sm font-semibold text-[#EEF1F8]">Aperçu du partage (LinkedIn, WhatsApp)</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-[#26304F]">
              {draft.og_image_url ? (
                <img src={draft.og_image_url} alt="Image de partage" className="h-40 w-full object-cover" />
              ) : (
                <div className="grid h-40 place-items-center bg-gradient-to-br from-[#2B1F6B] to-[#111831] text-lg font-semibold">Byound</div>
              )}
              <div className="bg-[#0B1122] px-3 py-2">
                <p className="text-[11px] text-[#5D6785]">byound.fr</p>
                <p className="truncate text-sm font-medium text-[#EEF1F8]">{draft.title || selected.label}</p>
              </div>
            </div>
            {!draft.og_image_url ? (
              <p className="mt-2 text-sm text-[#D6334A]">Image de partage générique : ajoutez une image dédiée (1200 × 630).</p>
            ) : null}
            <label className="mt-3 inline-flex h-9 cursor-pointer items-center rounded-full border border-[#26304F] px-3 text-sm text-[#EEF1F8] outline-none focus-within:ring-2 focus-within:ring-[#6E5BFF]">
              Déposer une image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadOg(file).catch((error) => toast.error(error instanceof Error ? error.message : "Téléversement impossible"));
                }}
              />
            </label>
          </section>

          <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4">
            <h3 className="text-sm font-semibold text-[#EEF1F8]">Requêtes qui amènent sur cette page</h3>
            {selected.queries?.length ? (
              <ul className="mt-3 space-y-2">
                {selected.queries.map((item) => (
                  <li key={item.query} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-[#EEF1F8]">{item.query}</span>
                    <span className="shrink-0 tabular-nums text-[#AEB6CC]">
                      {item.impressions.toLocaleString("fr-FR")} imp. · pos. {item.position.toLocaleString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[#5D6785]">Aucune requête pour l’instant. Sans Search Console, les colonnes restent à « — ».</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function SeoCharField({
  id,
  label,
  value,
  meter,
  multiline,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  meter: ReturnType<typeof charMeter>;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const color = TONE[meter.tone];
  return (
    <div id={id} className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[#EEF1F8]" htmlFor={`${id}-input`}>
          {label}
        </label>
        <p className="text-xs tabular-nums" style={{ color }} aria-live="polite">
          {meter.label}
        </p>
      </div>
      {multiline ? (
        <textarea id={`${id}-input`} className={`${fieldClass} mt-1 min-h-[88px]`} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input id={`${id}-input`} className={`${fieldClass} mt-1`} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      <div className="relative mt-2 h-[6px] overflow-hidden rounded-full bg-[#0B1122]" aria-hidden>
        <span className="absolute inset-y-0 rounded-full bg-[#0E2A1D]" style={{ left: `${meter.zoneLeft}%`, width: `${meter.zoneWidth}%` }} />
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${meter.fill}%`, background: color }} />
      </div>
      <p className="mt-1 text-xs text-[#5D6785]">{meter.hint}</p>
    </div>
  );
}

function HeadingsSection({
  cache,
  managed,
  draft,
  onDraft,
}: {
  cache: SeoHeadingsCache | null;
  managed: boolean;
  draft: SeoDraftFields;
  onDraft: (draft: SeoDraftFields) => void;
}) {
  const headings = cache ?? { h1: [], h2: [], h3: [] };
  const status = headingStatus(headings);
  const rows: Array<{ level: "H1" | "H2" | "H3"; text: string; ok: string }> = [
    ...headings.h1.map((text) => ({ level: "H1" as const, text, ok: status.h1 })),
    ...headings.h2.map((text, index) => ({ level: "H2" as const, text, ok: index === 0 ? status.h2 : status.h2 === "OK" ? "OK" : "" })),
    ...(headings.h3 ?? []).map((text) => ({ level: "H3" as const, text, ok: "" })),
  ];
  return (
    <section id="seo-field-headings" className="rounded-[24px] border border-[#2F7CF6]/70 bg-[#111831] p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[#EEF1F8]">Titres de la page</h3>
        <p className="text-xs text-[#AEB6CC]">{status.h1 === "OK" && status.h2 === "OK" ? "OK" : status.h1 !== "OK" ? status.h1 : status.h2}</p>
      </div>
      {rows.length ? (
        <ul className="mt-4 space-y-2">
          {rows.map((row, index) => (
            <li key={`${row.level}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#1A2340] bg-[#0B1122] px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.level === "H1" ? "bg-[#6E5BFF]/20 text-[#B8AEFF]" : "bg-[#2F7CF6]/20 text-[#8CB8FF]"}`}>
                  {row.level}
                </span>
                <span className="truncate text-sm text-[#EEF1F8]">{row.text || "—"}</span>
              </div>
              {row.ok ? <span className={`shrink-0 text-xs ${row.ok === "OK" ? "text-[#1F9D57]" : "text-[#E7A92C]"}`}>{row.ok}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[#5D6785]">Analyse du HTML en arrière-plan (cache 24 h). Les titres réels apparaîtront ici.</p>
      )}
      <p className="mt-3 text-xs text-[#5D6785]">Pour modifier un titre, ouvrez la page dans l’éditeur de contenu. L’outil SEO signale seulement les problèmes.</p>
      {managed ? (
        <div className="mt-4 space-y-2 border-t border-[#1A2340] pt-4">
          <p className="text-xs font-medium text-[#B8AEFF]">Géré par l’outil SEO</p>
          <label className="block text-sm text-[#EEF1F8]">
            H1 affiché
            <input className={`${fieldClass} mt-1`} value={draft.h1} onChange={(event) => onDraft({ ...draft, h1: event.target.value })} />
          </label>
          {(draft.h2.length ? draft.h2 : ["", ""]).map((item, index) => (
            <input
              key={index}
              className={fieldClass}
              placeholder={`H2 ${index + 1}`}
              value={item}
              onChange={(event) => {
                const h2 = [...draft.h2];
                h2[index] = event.target.value;
                onDraft({ ...draft, h2 });
              }}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-[#5D6785]">H1 et H2 éventuellement saisis restent en base, mais ne s’affichent pas sur cette page.</p>
      )}
    </section>
  );
}

function FaqSection({
  draft,
  onDraft,
  pageText,
  impressions,
  managed,
}: {
  draft: SeoDraftFields;
  onDraft: (draft: SeoDraftFields) => void;
  pageText?: string;
  impressions: number | null | undefined;
  managed: boolean;
}) {
  const items = draft.faq.length ? draft.faq : [{ question: "", answer: "" }];
  const summary = wordMeter(draft.ai_summary);
  const color = TONE[summary.tone];
  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onDraft({ ...draft, faq: next });
  };
  const toggleNoindex = (checked: boolean) => {
    if (checked && (impressions ?? 0) > 0) {
      const ok = window.confirm(`Cette page reçoit ${impressions} impressions. Confirmez le noindex ?`);
      if (!ok) return;
    }
    onDraft({ ...draft, noindex: checked });
  };
  return (
    <section className="rounded-[24px] border border-[#14A37F]/70 bg-[#111831] p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-[#EEF1F8]">FAQ et résumé pour les IA</h3>
        <p className="text-xs text-[#AEB6CC]">La FAQ doit aussi être visible sur la page</p>
      </div>
      <div id="seo-field-faq" className="mt-4 space-y-3">
        {items.map((item, index) => {
          const visible = !item.question.trim() || !pageText ? managed && Boolean(item.question.trim()) : questionAppearsInText(item.question, pageText);
          const warn = Boolean(item.question.trim()) && pageText && !visible;
          return (
            <div key={index} className="rounded-xl border border-[#1A2340] bg-[#0B1122] p-3">
              <div className="mb-2 flex justify-end gap-1">
                <button type="button" className="rounded-lg p-1 text-[#5D6785] hover:text-[#EEF1F8]" onClick={() => move(index, -1)} aria-label="Monter">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-1 text-[#5D6785] hover:text-[#EEF1F8]" onClick={() => move(index, 1)} aria-label="Descendre">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[#5D6785] hover:text-[#D6334A]"
                  aria-label="Supprimer"
                  onClick={() => onDraft({ ...draft, faq: items.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                className={fieldClass}
                placeholder="Question"
                value={item.question}
                onChange={(event) => onDraft({ ...draft, faq: items.map((row, i) => (i === index ? { ...row, question: event.target.value } : row)) })}
              />
              <textarea
                className={`${fieldClass} mt-2 min-h-[64px]`}
                placeholder="Réponse"
                value={item.answer}
                onChange={(event) => onDraft({ ...draft, faq: items.map((row, i) => (i === index ? { ...row, answer: event.target.value } : row)) })}
              />
              {warn ? <p className="mt-2 text-xs text-[#D6334A]">Cette FAQ n’est pas visible sur la page : ajoutez le bloc FAQ.</p> : null}
            </div>
          );
        })}
        <button type="button" className="text-sm font-semibold text-[#14A37F]" onClick={() => onDraft({ ...draft, faq: [...items, { question: "", answer: "" }] })}>
          Ajouter une question
        </button>
      </div>
      <div id="seo-field-summary" className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-sm font-medium text-[#EEF1F8]" htmlFor="seo-llms">
            Résumé pour les IA (llms.txt)
          </label>
          <p className="text-xs tabular-nums" style={{ color }} aria-live="polite">
            {summary.label}
          </p>
        </div>
        <textarea id="seo-llms" className={`${fieldClass} mt-1 min-h-[120px]`} value={draft.ai_summary} onChange={(event) => onDraft({ ...draft, ai_summary: event.target.value })} />
        <div className="relative mt-2 h-[6px] overflow-hidden rounded-full bg-[#0B1122]" aria-hidden>
          <span className="absolute inset-y-0 rounded-full bg-[#0E2A1D]" style={{ left: `${summary.zoneLeft}%`, width: `${summary.zoneWidth}%` }} />
          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${summary.fill}%`, background: color }} />
        </div>
        <p className="mt-1 text-xs text-[#5D6785]">{summary.hint}</p>
      </div>
      <label id="seo-field-noindex" className="mt-4 flex items-center gap-2 text-sm text-[#AEB6CC]">
        <input type="checkbox" className="accent-[#6E5BFF]" checked={draft.noindex} onChange={(event) => toggleNoindex(event.target.checked)} />
        Ne pas indexer cette page (noindex)
      </label>
    </section>
  );
}
