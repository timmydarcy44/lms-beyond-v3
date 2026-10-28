"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search, Sparkles } from "lucide-react";
import {
  DEFAULT_SEO_TEMPLATES,
  failingCheckPill,
  failingPriorityCards,
  filterSeoPages,
  scoreSwatch,
  type SeoPageGroup,
} from "@/lib/seo/overview";
import type { SeoCheckId, SeoCheckResult } from "@/lib/seo/score";

export type SeoOverviewPage = {
  path: string;
  label: string;
  group: string;
  score: number;
  checks: SeoCheckResult[];
  impressions: number | null;
  clicks: number | null;
};

export type SeoTemplateCard = {
  type: string;
  label: string;
  title_template: string;
  description_template: string;
  jsonld_type?: string;
  og_image_url?: string;
  count: number;
  example?: {
    path: string;
    vars: Record<string, string>;
    previewTitle: string;
    previewDescription: string;
  } | null;
};

const GROUPS: Array<"Toutes" | SeoPageGroup> = ["Toutes", "Marque", "Business", "Apprenants"];

function formatCount(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR").format(value);
}

export type SeoGscCard = {
  configured: boolean;
  connected: boolean;
  impressions: number;
  clicks: number;
  position: number;
  impressionsDelta: number;
  clicksDelta: number;
  positionDelta: number;
};

export function SeoOverview({
  pages,
  templates = DEFAULT_SEO_TEMPLATES.map((item) => ({ ...item, count: 0 })),
  gsc = null,
  onEditPage,
  onBatchPropose,
  onConnectGsc,
  onSaveTemplate,
  batchBusy = false,
}: {
  pages: SeoOverviewPage[];
  templates?: SeoTemplateCard[];
  gsc?: SeoGscCard | null;
  onEditPage: (path: string) => void;
  onBatchPropose: (paths: string[]) => void;
  onConnectGsc: () => void;
  onSaveTemplate?: (item: SeoTemplateCard) => Promise<void>;
  batchBusy?: boolean;
}) {
  const gscConnected = Boolean(gsc?.connected);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"Toutes" | SeoPageGroup>("Toutes");
  const [checkId, setCheckId] = useState<SeoCheckId | null>(null);
  const [sort, setSort] = useState<"score" | "impressions" | "clicks">("score");
  const [selected, setSelected] = useState<string[]>([]);

  const average = pages.length ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length) : 0;
  const under50 = pages.filter((page) => page.score < 50).length;
  const mid = pages.filter((page) => page.score >= 50 && page.score < 80).length;
  const high = pages.filter((page) => page.score >= 80).length;
  const barPages = [...pages].sort((a, b) => a.score - b.score);
  const priority = failingPriorityCards(pages);
  const listed = useMemo(
    () => filterSeoPages(pages, { query, group, checkId, sort }),
    [pages, query, group, checkId, sort],
  );
  const allListedSelected = listed.length > 0 && listed.every((page) => selected.includes(page.path));

  const toggleCheck = (id: SeoCheckId) => setCheckId((current) => (current === id ? null : id));
  const togglePath = (path: string) =>
    setSelected((current) => (current.includes(path) ? current.filter((item) => item !== path) : [...current, path]));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section
          className="relative overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831] p-6"
          style={{ boxShadow: "0 0 80px rgba(110, 91, 255, 0.18)" }}
        >
          <p className="text-sm text-[#AEB6CC]">Score moyen du site · {pages.length} pages</p>
          <p className="mt-2 font-[family-name:var(--font-seo)] text-[56px] font-semibold leading-none tracking-tight text-[#EEF1F8]">
            {average} <span className="text-[28px] font-medium text-[#5D6785]">/ 100</span>
          </p>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full" role="img" aria-label="Répartition des scores">
            {barPages.map((page) => (
              <span key={page.path} className="h-full min-w-[3px] flex-1" style={{ background: scoreSwatch(page.score).fg }} title={`${page.label} · ${page.score}`} />
            ))}
          </div>
          <p className="mt-3 text-sm text-[#AEB6CC]">
            <span className="text-[#D6334A]">{under50} pages sous 50</span>
            <span className="text-[#5D6785]"> · </span>
            <span className="text-[#E7A92C]">{mid} pages entre 50 et 79</span>
            <span className="text-[#5D6785]"> · </span>
            <span className="text-[#1F9D57]">{high} page{high > 1 ? "s" : ""} à 80 ou plus</span>
          </p>
        </section>

        <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-[#AEB6CC]">Google Search Console · 28 derniers jours</p>
            {gscConnected ? (
              <span className="rounded-full bg-[#0E2A1D] px-2.5 py-1 text-xs font-medium text-[#1F9D57]">Connecté</span>
            ) : (
              <span className="rounded-full bg-[#0B1122] px-2.5 py-1 text-xs text-[#5D6785]">Non connecté</span>
            )}
          </div>
          {gscConnected && gsc ? (
            <>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <GscStat label="Impressions" value={formatCount(gsc.impressions)} delta={`${gsc.impressionsDelta > 0 ? "+" : ""}${gsc.impressionsDelta} %`} up={gsc.impressionsDelta >= 0} />
                <GscStat label="Clics" value={formatCount(gsc.clicks)} delta={`${gsc.clicksDelta > 0 ? "+" : ""}${gsc.clicksDelta} %`} up={gsc.clicksDelta >= 0} />
                <GscStat
                  label="Position moyenne"
                  value={gsc.position ? gsc.position.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"}
                  delta={`${gsc.positionDelta > 0 ? "+" : ""}${gsc.positionDelta}`}
                  up={gsc.positionDelta <= 0}
                />
              </div>
              <button type="button" className="mt-4 text-sm font-medium text-[#6E5BFF] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]" onClick={onConnectGsc}>
                Synchroniser
              </button>
            </>
          ) : (
            <div className="mt-8">
              <p className="text-sm text-[#AEB6CC]">Les impressions et clics s’afficheront ici après connexion. Le reste de l’outil fonctionne déjà.</p>
              <button
                type="button"
                className="mt-5 inline-flex h-10 items-center rounded-full border border-[#6E5BFF] px-4 text-sm font-semibold text-[#EEF1F8] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
                onClick={onConnectGsc}
              >
                Connecter Search Console
              </button>
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[#EEF1F8]">À corriger en priorité</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {priority.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-pressed={checkId === card.id}
              onClick={() => toggleCheck(card.id)}
              className={`rounded-[20px] border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                checkId === card.id ? "border-[#6E5BFF] bg-[#161B3A]" : "border-[#1A2340] bg-[#111831] hover:border-[#26304F]"
              }`}
            >
              <p className={`text-[28px] font-semibold tabular-nums ${card.hot ? "text-[#D6334A]" : "text-[#E7A92C]"}`}>{card.count}</p>
              <p className="mt-1 text-sm leading-snug text-[#AEB6CC]">{card.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Rechercher une page ou une URL</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5D6785]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une page ou une URL"
              className="h-11 w-full rounded-full border border-[#26304F] bg-[#0B1122] pl-10 pr-4 text-sm text-[#EEF1F8] outline-none placeholder:text-[#5D6785] focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {GROUPS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={group === item}
                onClick={() => setGroup(item)}
                className={`h-9 rounded-full px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF] ${
                  group === item ? "bg-[#6E5BFF] text-white" : "bg-[#0B1122] text-[#AEB6CC]"
                }`}
              >
                {item === "Toutes" ? `Toutes · ${pages.length}` : item}
              </button>
            ))}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="h-9 rounded-full border border-[#26304F] bg-[#0B1122] px-3 text-sm text-[#AEB6CC] outline-none focus-visible:ring-2 focus-visible:ring-[#6E5BFF]"
              aria-label="Trier la liste"
            >
              <option value="score">Triées par score croissant</option>
              <option value="impressions">Triées par impressions</option>
              <option value="clicks">Triées par clics</option>
            </select>
            <button
              type="button"
              disabled={!selected.length || batchBusy}
              onClick={() => onBatchPropose(selected)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white outline-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-white"
            >
              <Sparkles className="h-4 w-4" />
              Proposer avec l’IA · {selected.length} page{selected.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[#5D6785]">
              <tr className="border-b border-[#1A2340]">
                <th className="w-10 py-3 pr-2 font-medium">
                  <input
                    type="checkbox"
                    checked={allListedSelected}
                    onChange={() => {
                      if (allListedSelected) setSelected((current) => current.filter((path) => !listed.some((page) => page.path === path)));
                      else setSelected((current) => [...new Set([...current, ...listed.map((page) => page.path)])]);
                    }}
                    className="h-4 w-4 accent-[#6E5BFF]"
                    aria-label="Tout sélectionner"
                  />
                </th>
                <th className="py-3 font-medium">Page</th>
                <th className="py-3 font-medium">Score</th>
                <th className="py-3 font-medium">Problèmes</th>
                <th className="py-3 text-right font-medium">Impressions</th>
                <th className="py-3 text-right font-medium">Clics</th>
                <th className="w-8 py-3" />
              </tr>
            </thead>
            <tbody>
              {listed.map((page) => {
                const fails = (page.checks ?? []).filter((item) => !item.passed);
                const pills = fails.slice(0, 3);
                const extra = fails.length - pills.length;
                const swatch = scoreSwatch(page.score);
                return (
                  <tr
                    key={page.path}
                    className="cursor-pointer border-b border-[#1A2340] last:border-0 hover:bg-[#161B3A]"
                    onClick={() => onEditPage(page.path)}
                  >
                    <td className="py-3 pr-2" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.includes(page.path)}
                        onChange={() => togglePath(page.path)}
                        className="h-4 w-4 accent-[#6E5BFF]"
                        aria-label={`Sélectionner ${page.label}`}
                      />
                    </td>
                    <td className="py-3">
                      <p className="font-medium text-[#EEF1F8]">{page.label}</p>
                      <p className="text-xs text-[#5D6785]">{page.path === "/" ? "/" : page.path}</p>
                    </td>
                    <td className="py-3">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                        style={{ color: swatch.fg, background: swatch.bg }}
                      >
                        {page.score} / 100
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {pills.map((item) => (
                          <span key={item.id} className="rounded-full bg-[#3A1418] px-2 py-0.5 text-[11px] text-[#D6334A]">
                            {failingCheckPill(item)}
                          </span>
                        ))}
                        {extra > 0 ? <span className="rounded-full bg-[#0B1122] px-2 py-0.5 text-[11px] text-[#AEB6CC]">+{extra}</span> : null}
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#AEB6CC]">{formatCount(page.impressions)}</td>
                    <td className="py-3 text-right tabular-nums text-[#AEB6CC]">{formatCount(page.clicks)}</td>
                    <td className="py-3 text-[#5D6785]"><ChevronRight className="ml-auto h-4 w-4" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[#EEF1F8]">Modèles pour les pages générées</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((item) => (
            <TemplateCard key={item.type} item={item} onSave={onSaveTemplate} />
          ))}
        </div>
      </section>
    </div>
  );
}

function TemplateCard({
  item,
  onSave,
}: {
  item: SeoTemplateCard;
  onSave?: (item: SeoTemplateCard) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title_template);
  const [description, setDescription] = useState(item.description_template);
  const [jsonld, setJsonld] = useState(item.jsonld_type ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setTitle(item.title_template);
    setDescription(item.description_template);
    setJsonld(item.jsonld_type ?? "");
  }, [item.title_template, item.description_template, item.jsonld_type]);
  const vars = Object.keys(item.example?.vars ?? {}).map((key) => `{${key}}`).join(" · ");
  return (
    <article className="rounded-[20px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[#EEF1F8]">{item.label}</h3>
        <p className="text-sm text-[#5D6785]">{item.count} pages</p>
      </div>
      <p className="mt-2 text-[11px] text-[#5D6785]">{vars || "Variables du modèle"}</p>
      <label className="mt-3 block text-[11px] text-[#5D6785]">Titre</label>
      <textarea
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        rows={2}
        className="mt-1 w-full resize-none rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 font-mono text-xs text-[#AEB6CC] outline-none focus:border-[#6E5BFF]"
      />
      <label className="mt-3 block text-[11px] text-[#5D6785]">Description</label>
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        className="mt-1 w-full resize-none rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 font-mono text-xs text-[#AEB6CC] outline-none focus:border-[#6E5BFF]"
      />
      <label className="mt-3 block text-[11px] text-[#5D6785]">Type JSON-LD</label>
      <input
        value={jsonld}
        onChange={(event) => setJsonld(event.target.value)}
        className="mt-1 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-xs text-[#AEB6CC] outline-none focus:border-[#6E5BFF]"
      />
      {item.example ? (
        <div className="mt-4 rounded-xl border border-[#26304F] bg-[#0B1122] p-3">
          <p className="text-[11px] text-[#5D6785]">Aperçu Google · {item.example.path}</p>
          <p className="mt-2 text-sm text-[#6E5BFF]">{item.example.previewTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#AEB6CC]">{item.example.previewDescription}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#5D6785]">Aucun exemple réel pour ce type pour l’instant.</p>
      )}
      <button
        type="button"
        disabled={busy || !onSave}
        onClick={() => {
          if (!onSave) return;
          setBusy(true);
          void onSave({ ...item, title_template: title, description_template: description, jsonld_type: jsonld })
            .finally(() => setBusy(false));
        }}
        className="mt-4 h-9 w-full rounded-full bg-[#6E5BFF] text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? "Enregistrement…" : "Enregistrer le modèle"}
      </button>
    </article>
  );
}

function GscStat({ label, value, delta, up }: { label: string; value: string; delta: string; up: boolean }) {
  return (
    <div>
      <p className="text-xs text-[#5D6785]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#EEF1F8]">{value}</p>
      <p className="mt-1 text-xs" style={{ color: up ? "#1F9D57" : "#D6334A" }}>
        {delta} vs période précédente
      </p>
    </div>
  );
}
